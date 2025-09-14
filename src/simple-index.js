import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'voice-service',
    timestamp: new Date().toISOString(),
    port: PORT
  })
})

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json({
    service: 'voice-service',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  })
})

// Voice processing endpoint
app.post('/api/voice/process', (req, res) => {
  const { command, userId } = req.body
  
  if (!command) {
    return res.status(400).json({ error: 'Command is required' })
  }

  // Simulate voice processing
  const response = {
    command,
    response: `I heard you say: "${command}". This is a simulated response from the voice service.`,
    intent: 'general_query',
    confidence: 0.85,
    timestamp: new Date().toISOString(),
    userId: userId || 'anonymous'
  }

  res.json(response)
})

// Get voice command status
app.get('/api/voice/status/:jobId', (req, res) => {
  res.json({
    jobId: req.params.jobId,
    status: 'completed',
    result: 'Voice command processed successfully'
  })
})

// Get voice commands history
app.get('/api/voice/history', (req, res) => {
  res.json({
    commands: [
      {
        id: '1',
        command: 'Show me my courses',
        response: 'Here are your courses...',
        timestamp: new Date().toISOString()
      }
    ]
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🎤 Voice Service running on port ${PORT}`)
  console.log(`Health check: http://localhost:${PORT}/health`)
  console.log(`Metrics: http://localhost:${PORT}/metrics`)
})

export default app
