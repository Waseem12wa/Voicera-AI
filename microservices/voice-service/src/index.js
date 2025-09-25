// Load environment variables first
import dotenv from 'dotenv'
dotenv.config()

import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import helmet from 'helmet'
import compression from 'compression'
import rateLimit from 'express-rate-limit'
import { createServer } from 'http'
import { Server } from 'socket.io'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import Bull from 'bull'
import winston from 'winston'
import promClient from 'prom-client'

// Import services and middleware
import { VoiceProcessor } from './services/voiceProcessor.js'
import { CommandProcessor } from './services/commandProcessor.js'
import { MultilingualProcessor } from './services/multilingualProcessor.js'
import { CacheService } from './services/cacheService.js'
import { MetricsService } from './services/metricsService.js'
import CircuitBreakerService from './middleware/circuitBreaker.js'
import { healthCheck } from './middleware/healthCheck.js'
import { errorHandler } from './middleware/errorHandler.js'
import { requestLogger } from './middleware/requestLogger.js'

dotenv.config()

const app = express()
const server = createServer(app)
const PORT = process.env.PORT || 3001
const SERVICE_NAME = 'voice-service'

// Initialize Redis for caching and job queues
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

// Initialize Bull queue for voice processing
const voiceQueue = new Bull('voice processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379
  }
})

// Initialize Socket.IO for real-time communication
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Initialize services
const cacheService = new CacheService(redis)
const metricsService = new MetricsService()
const voiceProcessor = new VoiceProcessor(cacheService, metricsService)
const multilingualProcessor = new MultilingualProcessor(cacheService, metricsService)
const commandProcessor = new CommandProcessor(voiceProcessor, cacheService)

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

// Voice processing routes
app.post('/api/voice/process', async (req, res) => {
  try {
    const { command, context, userId, sessionId, language = 'en' } = req.body
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' })
    }

    // Add job to queue for processing
    const job = await voiceQueue.add('process-voice', {
      command,
      context: context || {},
      userId,
      sessionId,
      language,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    })

    // Return job ID for tracking
    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Voice command queued for processing'
    })

  } catch (error) {
    logger.error('Error processing voice command:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Audio transcription endpoint
app.post('/api/voice/transcribe', async (req, res) => {
  try {
    const { audio, language = 'en', mimeType = 'audio/webm' } = req.body
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio data is required' })
    }

    // Add job to queue for transcription
    const job = await voiceQueue.add('transcribe-audio', {
      audio,
      language,
      mimeType,
      timestamp: new Date().toISOString()
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    })

    res.json({
      jobId: job.id,
      status: 'queued',
      message: 'Audio transcription queued for processing'
    })

  } catch (error) {
    logger.error('Error transcribing audio:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Multilingual command processing
app.post('/api/voice/multilingual', async (req, res) => {
  try {
    const { command, language = 'en', context, userId, sessionId } = req.body
    
    if (!command) {
      return res.status(400).json({ error: 'Command is required' })
    }

    // Process multilingual command directly
    const result = await multilingualProcessor.processMultilingualCommand(
      command, 
      language, 
      { ...context, userId, sessionId }
    )

    res.json(result)

  } catch (error) {
    logger.error('Error processing multilingual command:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get supported languages
app.get('/api/voice/languages', async (req, res) => {
  try {
    const languages = multilingualProcessor.getSupportedLanguages()
    res.json({ languages })
  } catch (error) {
    logger.error('Error getting supported languages:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Translate text
app.post('/api/voice/translate', async (req, res) => {
  try {
    const { text, fromLanguage = 'en', toLanguage = 'en' } = req.body
    
    if (!text) {
      return res.status(400).json({ error: 'Text is required' })
    }

    const translation = await multilingualProcessor.translateText(text, fromLanguage, toLanguage)
    
    res.json({
      originalText: text,
      translatedText: translation,
      fromLanguage,
      toLanguage
    })

  } catch (error) {
    logger.error('Error translating text:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get language-specific suggestions
app.get('/api/voice/suggestions/:language', async (req, res) => {
  try {
    const { language } = req.params
    const { userId, limit = 5 } = req.query
    
    const suggestions = await multilingualProcessor.getLanguageSpecificSuggestions(
      language, 
      userId, 
      parseInt(limit)
    )
    
    res.json({ suggestions, language })

  } catch (error) {
    logger.error('Error getting language-specific suggestions:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get voice command status
app.get('/api/voice/status/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params
    const job = await voiceQueue.getJob(jobId)
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' })
    }

    const state = await job.getState()
    res.json({
      jobId,
      status: state,
      progress: job.progress(),
      result: job.returnvalue,
      error: job.failedReason
    })

  } catch (error) {
    logger.error('Error getting job status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get voice commands history
app.get('/api/voice/history', async (req, res) => {
  try {
    const { userId, limit = 50, offset = 0 } = req.query
    
    const commands = await commandProcessor.getCommandHistory(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    res.json(commands)

  } catch (error) {
    logger.error('Error getting command history:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Real-time voice command processing
io.on('connection', (socket) => {
  logger.info(`Voice service client connected: ${socket.id}`)
  
  socket.on('voice-command', async (data) => {
    try {
      const { command, context, userId } = data
      
      // Process command in real-time
      const result = await commandProcessor.processCommand(command, context, userId)
      
      // Emit result back to client
      socket.emit('command-result', {
        command,
        result,
        timestamp: new Date().toISOString()
      })

      // Broadcast to other clients in the same room
      socket.to(`user-${userId}`).emit('command-broadcast', {
        command,
        result,
        userId,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      logger.error('Error processing real-time voice command:', error)
      socket.emit('command-error', {
        error: 'Failed to process voice command',
        timestamp: new Date().toISOString()
      })
    }
  })

  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`)
    logger.info(`Socket ${socket.id} joined user room: ${userId}`)
  })

  socket.on('disconnect', () => {
    logger.info(`Voice service client disconnected: ${socket.id}`)
  })
})

// Process voice commands from queue
voiceQueue.process('process-voice', async (job) => {
  const { command, context, userId, sessionId, language = 'en' } = job.data
  
  try {
    logger.info(`Processing voice command: ${command} in ${language}`)
    
    // Process the voice command with multilingual support
    const result = await multilingualProcessor.processMultilingualCommand(
      command, 
      language, 
      { ...context, userId, sessionId }
    )
    
    // Update metrics
    metricsService.incrementVoiceCommandsProcessed()
    metricsService.recordProcessingTime(Date.now() - job.timestamp)
    
    // Cache result
    await cacheService.set(`voice:result:${job.id}`, result, 3600) // 1 hour
    
    // Emit real-time update
    io.to(`user-${userId}`).emit('command-completed', {
      jobId: job.id,
      command,
      result,
      timestamp: new Date().toISOString()
    })
    
    return result

  } catch (error) {
    logger.error(`Error processing voice command ${job.id}:`, error)
    metricsService.incrementVoiceCommandsFailed()
    throw error
  }
})

// Process audio transcription from queue
voiceQueue.process('transcribe-audio', async (job) => {
  const { audio, language, mimeType } = job.data
  
  try {
    logger.info(`Transcribing audio in ${language}`)
    
    // Convert base64 audio to buffer
    const audioBuffer = Buffer.from(audio, 'base64')
    
    // For now, we'll simulate transcription
    // In a real implementation, you would use:
    // - Google Speech-to-Text API
    // - Azure Speech Services
    // - AWS Transcribe
    // - OpenAI Whisper API
    // - Or other speech recognition services
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Generate simulated transcript based on language
    const transcript = generateSimulatedTranscript(language)
    
    const result = {
      transcript,
      language,
      confidence: 0.85,
      duration: audioBuffer.length / 1000, // Simulated duration
      timestamp: new Date().toISOString()
    }
    
    // Update metrics
    metricsService.incrementVoiceCommandsProcessed()
    metricsService.recordProcessingTime(Date.now() - job.timestamp)
    
    // Cache result
    await cacheService.set(`transcribe:result:${job.id}`, result, 3600) // 1 hour
    
    return result

  } catch (error) {
    logger.error(`Error transcribing audio ${job.id}:`, error)
    metricsService.incrementVoiceCommandsFailed()
    throw error
  }
})

// Helper function to generate simulated transcripts
function generateSimulatedTranscript(language) {
  const transcripts = {
    'en': 'Hello, I would like to ask about my courses and assignments. Can you help me understand the material better?',
    'es': 'Hola, me gustaría preguntar sobre mis cursos y tareas. ¿Puedes ayudarme a entender mejor el material?',
    'fr': 'Bonjour, je voudrais poser des questions sur mes cours et mes devoirs. Pouvez-vous m\'aider à mieux comprendre le matériel?',
    'de': 'Hallo, ich möchte Fragen zu meinen Kursen und Aufgaben stellen. Können Sie mir helfen, den Stoff besser zu verstehen?',
    'it': 'Ciao, vorrei fare domande sui miei corsi e compiti. Puoi aiutarmi a capire meglio il materiale?',
    'pt': 'Olá, gostaria de fazer perguntas sobre meus cursos e tarefas. Você pode me ajudar a entender melhor o material?',
    'ru': 'Привет, я хотел бы задать вопросы о моих курсах и заданиях. Можете ли вы помочь мне лучше понять материал?',
    'ja': 'こんにちは、私のコースと課題について質問したいと思います。資料をより良く理解するのを手伝ってもらえますか？',
    'ko': '안녕하세요, 제 과정과 과제에 대해 질문하고 싶습니다. 자료를 더 잘 이해할 수 있도록 도와주실 수 있나요?',
    'zh': '你好，我想问一下我的课程和作业。你能帮我更好地理解材料吗？',
    'ar': 'مرحبا، أود أن أسأل عن دوراتي وواجباتي. هل يمكنك مساعدتي في فهم المادة بشكل أفضل؟',
    'hi': 'नमस्ते, मैं अपने पाठ्यक्रम और असाइनमेंट के बारे में पूछना चाहूंगा। क्या आप मुझे सामग्री को बेहतर समझने में मदद कर सकते हैं?',
    'ur': 'السلام علیکم، میں اپنے کورسز اور اسائنمنٹس کے بارے میں پوچھنا چاہوں گا۔ کیا آپ مجھے مواد کو بہتر سمجھنے میں مدد کر سکتے ہیں؟'
  }
  
  return transcripts[language] || transcripts['en']
}

// Error handling middleware
app.use(errorHandler)

// Connect to MongoDB
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voicera_voice'
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
  await voiceQueue.close()
  
  process.exit(0)
})

export default app
