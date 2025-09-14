import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import { createProxyMiddleware } from 'http-proxy-middleware'
import winston from 'winston'
import promClient from 'prom-client'
import Redis from 'ioredis'
import { CircuitBreaker } from './middleware/circuitBreaker.js'
import { healthCheck } from './middleware/healthCheck.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { authMiddleware } from './middleware/authMiddleware.js'
import { metricsMiddleware } from './middleware/metricsMiddleware.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000
const SERVICE_NAME = 'api-gateway'

// Initialize Redis for caching and rate limiting
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

// Configure logging
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: SERVICE_NAME },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
})

// Security middleware
app.use(helmet())
app.use(compression())

// CORS configuration
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false
})
app.use(limiter)

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Logging middleware
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }))
app.use(requestLogger(logger))

// Metrics middleware
app.use(metricsMiddleware)

// Health check endpoint
app.get('/health', healthCheck)

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(await promClient.register.metrics())
})

// Service configurations
const services = {
  voice: {
    url: process.env.VOICE_SERVICE_URL || 'http://localhost:3001',
    path: '/api/voice',
    timeout: 30000
  },
  user: {
    url: process.env.USER_SERVICE_URL || 'http://localhost:3002',
    path: '/api',
    timeout: 10000
  },
  analytics: {
    url: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:3003',
    path: '/api/analytics',
    timeout: 15000
  }
}

// Circuit breakers for each service
const circuitBreakers = {}
Object.keys(services).forEach(serviceName => {
  circuitBreakers[serviceName] = new CircuitBreaker({
    timeout: services[serviceName].timeout,
    errorThreshold: 5,
    resetTimeout: 30000
  })
})

// Create proxy middleware for each service
Object.keys(services).forEach(serviceName => {
  const service = services[serviceName]
  
  const proxyOptions = {
    target: service.url,
    changeOrigin: true,
    timeout: service.timeout,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${serviceName}:`, err)
      res.status(503).json({ 
        error: 'Service temporarily unavailable',
        service: serviceName
      })
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add service name to headers
      proxyReq.setHeader('X-Service-Name', serviceName)
      proxyReq.setHeader('X-Request-ID', req.id)
      
      logger.info(`Proxying request to ${serviceName}: ${req.method} ${req.url}`)
    },
    onProxyRes: (proxyRes, req, res) => {
      // Add service name to response headers
      res.setHeader('X-Service-Name', serviceName)
      
      logger.info(`Response from ${serviceName}: ${proxyRes.statusCode}`)
    }
  }

  // Apply circuit breaker
  const circuitBreaker = circuitBreakers[serviceName]
  
  app.use(service.path, (req, res, next) => {
    circuitBreaker.fire(() => {
      return new Promise((resolve, reject) => {
        const proxy = createProxyMiddleware(proxyOptions)
        proxy(req, res, (err) => {
          if (err) {
            reject(err)
          } else {
            resolve()
          }
        })
      })
    }).catch(err => {
      logger.error(`Circuit breaker opened for ${serviceName}:`, err)
      res.status(503).json({
        error: 'Service temporarily unavailable',
        service: serviceName,
        circuitBreakerOpen: true
      })
    })
  })
})

// Authentication routes (proxied to user service)
app.use('/api/auth', createProxyMiddleware({
  target: services.user.url,
  changeOrigin: true,
  timeout: 10000
}))

// User routes (proxied to user service)
app.use('/api/users', authMiddleware, createProxyMiddleware({
  target: services.user.url,
  changeOrigin: true,
  timeout: 10000
}))

// Voice routes (proxied to voice service)
app.use('/api/voice', authMiddleware, createProxyMiddleware({
  target: services.voice.url,
  changeOrigin: true,
  timeout: 30000
}))

// Analytics routes (proxied to analytics service)
app.use('/api/analytics', authMiddleware, createProxyMiddleware({
  target: services.analytics.url,
  changeOrigin: true,
  timeout: 15000
}))

// WebSocket proxy for real-time features
app.use('/socket.io', createProxyMiddleware({
  target: services.voice.url,
  changeOrigin: true,
  ws: true,
  timeout: 30000
}))

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    name: 'Voicera AI API Gateway',
    version: '1.0.0',
    description: 'API Gateway for Voicera AI microservices',
    services: Object.keys(services).map(name => ({
      name,
      url: services[name].url,
      path: services[name].path,
      status: circuitBreakers[name].isOpen ? 'unavailable' : 'available'
    })),
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      voice: '/api/voice',
      analytics: '/api/analytics',
      health: '/health',
      metrics: '/metrics'
    }
  })
})

// Error handling middleware
app.use(errorHandler)

// Start server
app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} listening on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`Metrics: http://localhost:${PORT}/metrics`)
  logger.info(`API Docs: http://localhost:${PORT}/api/docs`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  // Close Redis connection
  await redis.quit()
  
  process.exit(0)
})

export default app
