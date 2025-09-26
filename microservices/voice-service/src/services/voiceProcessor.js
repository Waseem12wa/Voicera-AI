import { Groq } from 'groq-sdk'
import winston from 'winston'

export class VoiceProcessor {
  constructor(cacheService, metricsService) {
    this.cacheService = cacheService
    this.metricsService = metricsService
    
    // Initialize Groq with fallback for missing API key
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error('GROQ_API_KEY environment variable is required')
    }
    this.groq = new Groq({
      apiKey: apiKey
    })
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'voice-processor' },
      transports: [
        new winston.transports.Console()
      ]
    })
  }

  async processVoiceCommand(command, context = {}) {
    const startTime = Date.now()
    
    try {
      // Check cache first
      const cacheKey = `voice:command:${this.hashCommand(command)}`
      const cachedResult = await this.cacheService.get(cacheKey)
      
      if (cachedResult) {
        this.logger.info('Voice command served from cache')
        this.metricsService.incrementCacheHits()
        return cachedResult
      }

      // Process with AI
      const result = await this.processWithAI(command, context)
      
      // Cache result
      await this.cacheService.set(cacheKey, result, 1800) // 30 minutes
      
      // Record metrics
      const processingTime = Date.now() - startTime
      this.metricsService.recordProcessingTime(processingTime)
      this.metricsService.incrementVoiceCommandsProcessed()
      
      this.logger.info(`Voice command processed in ${processingTime}ms`)
      return result

    } catch (error) {
      this.logger.error('Error processing voice command:', error)
      this.metricsService.incrementVoiceCommandsFailed()
      throw error
    }
  }

  async processWithAI(command, context) {
    try {
      const systemPrompt = this.buildSystemPrompt(context)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: command
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })

      const response = completion.choices[0]?.message?.content || 'I could not process that command.'
      
      return {
        command,
        response,
        intent: this.extractIntent(command),
        entities: this.extractEntities(command),
        confidence: this.calculateConfidence(response),
        timestamp: new Date().toISOString(),
        context
      }

    } catch (error) {
      this.logger.error('AI processing error:', error)
      throw new Error('Failed to process voice command with AI')
    }
  }

  buildSystemPrompt(context) {
    const basePrompt = `You are Voicera AI, an intelligent educational assistant. 
    You help students, teachers, and administrators with educational tasks.
    
    Available capabilities:
    - Answer questions about courses, assignments, and grades
    - Help with study planning and time management
    - Provide explanations of complex topics
    - Assist with quiz preparation
    - Help with file management and organization
    - Provide general educational guidance
    
    Current context: ${JSON.stringify(context)}
    
    Respond in a helpful, educational, and encouraging tone.
    If you need more information, ask clarifying questions.
    Always provide actionable advice when possible.`

    return basePrompt
  }

  extractIntent(command) {
    const commandLower = command.toLowerCase()
    
    // Intent patterns
    const intents = {
      'get_courses': ['courses', 'classes', 'subjects', 'curriculum'],
      'get_grades': ['grades', 'scores', 'marks', 'results'],
      'get_assignments': ['assignments', 'homework', 'tasks', 'projects'],
      'get_schedule': ['schedule', 'timetable', 'calendar', 'when'],
      'study_help': ['study', 'learn', 'understand', 'explain', 'help'],
      'quiz_help': ['quiz', 'test', 'exam', 'practice'],
      'file_help': ['files', 'documents', 'upload', 'download'],
      'general_help': ['help', 'what can you do', 'capabilities']
    }

    for (const [intent, keywords] of Object.entries(intents)) {
      if (keywords.some(keyword => commandLower.includes(keyword))) {
        return intent
      }
    }

    return 'general_query'
  }

  extractEntities(command) {
    const entities = {
      courses: [],
      dates: [],
      numbers: [],
      subjects: []
    }

    // Extract course names (simple pattern matching)
    const coursePattern = /(?:course|class|subject)\s+([a-zA-Z\s]+)/gi
    let match
    while ((match = coursePattern.exec(command)) !== null) {
      entities.courses.push(match[1].trim())
    }

    // Extract dates
    const datePattern = /(?:on|by|at)\s+([a-zA-Z0-9\s,]+)/gi
    while ((match = datePattern.exec(command)) !== null) {
      entities.dates.push(match[1].trim())
    }

    // Extract numbers
    const numberPattern = /\b(\d+)\b/g
    while ((match = numberPattern.exec(command)) !== null) {
      entities.numbers.push(parseInt(match[1]))
    }

    return entities
  }

  calculateConfidence(response) {
    // Simple confidence calculation based on response length and content
    const minLength = 10
    const maxLength = 500
    
    if (response.length < minLength) return 0.3
    if (response.length > maxLength) return 0.8
    
    // Check for uncertainty indicators
    const uncertaintyWords = ['maybe', 'perhaps', 'might', 'could be', 'not sure']
    const hasUncertainty = uncertaintyWords.some(word => 
      response.toLowerCase().includes(word)
    )
    
    if (hasUncertainty) return 0.6
    
    // Check for confidence indicators
    const confidenceWords = ['definitely', 'certainly', 'sure', 'exactly', 'precisely']
    const hasConfidence = confidenceWords.some(word => 
      response.toLowerCase().includes(word)
    )
    
    if (hasConfidence) return 0.9
    
    return 0.7 // Default confidence
  }

  hashCommand(command) {
    // Simple hash function for caching
    let hash = 0
    for (let i = 0; i < command.length; i++) {
      const char = command.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  async getCommandSuggestions(userId, limit = 5) {
    try {
      const cacheKey = `voice:suggestions:${userId}`
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const suggestions = [
        'Show me my courses',
        'What are my grades?',
        'When is my next assignment due?',
        'Help me study for the math quiz',
        'What files do I have uploaded?',
        'Create a study schedule',
        'Explain machine learning concepts',
        'What are my upcoming deadlines?'
      ]

      const result = suggestions.slice(0, limit)
      await this.cacheService.set(cacheKey, result, 1800) // 30 minutes
      
      return result

    } catch (error) {
      this.logger.error('Error getting command suggestions:', error)
      return []
    }
  }
}
