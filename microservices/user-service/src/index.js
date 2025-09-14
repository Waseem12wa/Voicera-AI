import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import winston from 'winston'
import promClient from 'prom-client'

// Import services and middleware
import { UserService } from './services/userService.js'
import { AuthService } from './services/authService.js'
import { CacheService } from './services/cacheService.js'
import { MetricsService } from './services/metricsService.js'
import { healthCheck } from './middleware/healthCheck.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'
import { authMiddleware } from './middleware/authMiddleware.js'
import { validateRequest } from './middleware/validateRequest.js'
import { userRoutes } from './routes/userRoutes.js'
import { authRoutes } from './routes/authRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002
const SERVICE_NAME = 'user-service'

// Initialize Redis for caching
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

// Initialize services
const cacheService = new CacheService(redis)
const metricsService = new MetricsService()
const userService = new UserService(cacheService, metricsService)
const authService = new AuthService(userService, cacheService)

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
  max: 200, // limit each IP to 200 requests per windowMs
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

// API routes
app.use('/api/auth', authRoutes(authService))
app.use('/api/users', userRoutes(userService))

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voicera_users'
mongoose.connect(MONGO_URI)
  .then(() => {
    logger.info('Connected to MongoDB')
  })
  .catch((error) => {
    logger.error('MongoDB connection error:', error)
    process.exit(1)
  })

// Start server
app.listen(PORT, () => {
  logger.info(`${SERVICE_NAME} listening on port ${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`Metrics: http://localhost:${PORT}/metrics`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully')
  
  // Close database connections
  await mongoose.connection.close()
  await redis.quit()
  
  process.exit(0)
})

export default app
