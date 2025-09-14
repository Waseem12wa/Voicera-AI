import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import Bull from 'bull'
import winston from 'winston'
import promClient from 'prom-client'
import { createServer } from 'http'
import { Server } from 'socket.io'

// Import services and middleware
import { AnalyticsService } from './services/analyticsService.js'
import { MetricsService } from './services/metricsService.js'
import { CacheService } from './services/cacheService.js'
import { healthCheck } from './middleware/healthCheck.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { analyticsRoutes } from './routes/analyticsRoutes.js'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3003
const SERVICE_NAME = 'analytics-service'

// Initialize Redis for caching and job queues
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

// Initialize Bull queue for analytics processing
const analyticsQueue = new Bull('analytics processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
})

// Initialize Socket.IO for real-time analytics
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Initialize services
const cacheService = new CacheService(redis)
const metricsService = new MetricsService()
const analyticsService = new AnalyticsService(cacheService, metricsService)

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
  max: 100, // limit each IP to 100 requests per windowMs
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

// Health check endpoint
app.get('/health', healthCheck)

// Metrics endpoint for Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType)
  res.end(await promClient.register.metrics())
})

// Analytics routes
app.use('/api/analytics', analyticsRoutes(analyticsService))

// Real-time analytics updates
io.on('connection', (socket) => {
  logger.info(`Analytics client connected: ${socket.id}`)
  
  socket.on('subscribe-analytics', (data) => {
    const { userId, dashboardType } = data
    socket.join(`analytics-${userId}`)
    socket.join(`dashboard-${dashboardType}`)
    logger.info(`Socket ${socket.id} subscribed to analytics for user ${userId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`Analytics client disconnected: ${socket.id}`)
  })
})

// Process analytics jobs from queue
analyticsQueue.process('process-analytics', async (job) => {
  const { eventType, data, userId, timestamp } = job.data
  
  try {
    logger.info(`Processing analytics event: ${eventType}`)
    
    // Process the analytics event
    const result = await analyticsService.processEvent(eventType, data, userId, timestamp)
    
    // Update metrics
    metricsService.incrementAnalyticsEventsProcessed()
    metricsService.recordProcessingTime(Date.now() - job.timestamp)
    
    // Emit real-time update
    io.to(`analytics-${userId}`).emit('analytics-update', {
      eventType,
      data: result,
      timestamp: new Date().toISOString()
    })
    
    return result

  } catch (error) {
    logger.error(`Error processing analytics event ${job.id}:`, error)
    metricsService.incrementAnalyticsEventsFailed()
    throw error
  }
})

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voicera_analytics'
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB')
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error)
    process.exit(1)
  })

// Start server
server.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} listening on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`Metrics: http://localhost:${PORT}/metrics`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  // Close server
  server.close(() => {
    logger.info('Server closed')
  })
  
  // Close database connections
  await mongoose.connection.close()
  await redis.quit()
  
  // Close queue
  await analyticsQueue.close()
  
  process.exit(0)
})

export default app
