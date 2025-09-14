import mongoose from 'mongoose'
import winston from 'winston'

const commandHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true },
  command: { type: String, required: true },
  response: { type: String, required: true },
  intent: { type: String, required: true },
  entities: mongoose.Schema.Types.Mixed,
  confidence: { type: Number, min: 0, max: 1 },
  processingTime: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
  context: mongoose.Schema.Types.Mixed
}, { timestamps: true })

const CommandHistory = mongoose.model('CommandHistory', commandHistorySchema)

export class CommandProcessor {
  constructor(voiceProcessor, cacheService) {
    this.voiceProcessor = voiceProcessor
    this.cacheService = cacheService
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'command-processor' },
      transports: [
        new winston.transports.Console()
      ]
    })
  }

  async processCommand(command, context, userId) {
    const startTime = Date.now()
    const sessionId = context.sessionId || this.generateSessionId()
    
    try {
      this.logger.info(`Processing command for user ${userId}: ${command}`)
      
      // Process the voice command
      const result = await this.voiceProcessor.processVoiceCommand(command, {
        ...context,
        userId,
        sessionId
      })
      
      // Calculate processing time
      const processingTime = Date.now() - startTime
      result.processingTime = processingTime
      
      // Save to command history
      await this.saveCommandHistory({
        userId,
        sessionId,
        command,
        response: result.response,
        intent: result.intent,
        entities: result.entities,
        confidence: result.confidence,
        processingTime,
        context
      })
      
      // Update user command statistics
      await this.updateUserStats(userId, result.intent)
      
      this.logger.info(`Command processed successfully in ${processingTime}ms`)
      return result

    } catch (error) {
      this.logger.error('Error processing command:', error)
      
      // Save failed command attempt
      await this.saveCommandHistory({
        userId,
        sessionId,
        command,
        response: 'Error processing command',
        intent: 'error',
        entities: {},
        confidence: 0,
        processingTime: Date.now() - startTime,
        context,
        error: error.message
      })
      
      throw error
    }
  }

  async saveCommandHistory(commandData) {
    try {
      const commandHistory = new CommandHistory(commandData)
      await commandHistory.save()
      
      // Update cache with recent commands
      const cacheKey = `voice:recent:${commandData.userId}`
      await this.cacheService.set(cacheKey, commandData, 3600) // 1 hour
      
    } catch (error) {
      this.logger.error('Error saving command history:', error)
    }
  }

  async getCommandHistory(userId, options = {}) {
    try {
      const { limit = 50, offset = 0, intent, startDate, endDate } = options
      
      const query = { userId }
      
      if (intent) {
        query.intent = intent
      }
      
      if (startDate || endDate) {
        query.timestamp = {}
        if (startDate) query.timestamp.$gte = new Date(startDate)
        if (endDate) query.timestamp.$lte = new Date(endDate)
      }
      
      const commands = await CommandHistory.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(offset)
        .lean()
      
      return commands

    } catch (error) {
      this.logger.error('Error getting command history:', error)
      return []
    }
  }

  async getUserCommandStats(userId) {
    try {
      const cacheKey = `voice:stats:${userId}`
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const stats = await CommandHistory.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            totalCommands: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' },
            avgProcessingTime: { $avg: '$processingTime' },
            intents: {
              $push: '$intent'
            },
            lastCommand: { $max: '$timestamp' }
          }
        },
        {
          $project: {
            totalCommands: 1,
            avgConfidence: { $round: ['$avgConfidence', 2] },
            avgProcessingTime: { $round: ['$avgProcessingTime', 2] },
            intentDistribution: {
              $reduce: {
                input: '$intents',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }]
                      ]
                    }
                  ]
                }
              }
            },
            lastCommand: 1
          }
        }
      ])

      const result = stats[0] || {
        totalCommands: 0,
        avgConfidence: 0,
        avgProcessingTime: 0,
        intentDistribution: {},
        lastCommand: null
      }

      await this.cacheService.set(cacheKey, result, 1800) // 30 minutes
      return result

    } catch (error) {
      this.logger.error('Error getting user command stats:', error)
      return {
        totalCommands: 0,
        avgConfidence: 0,
        avgProcessingTime: 0,
        intentDistribution: {},
        lastCommand: null
      }
    }
  }

  async updateUserStats(userId, intent) {
    try {
      const statsKey = `voice:user:${userId}:stats`
      const stats = await this.cacheService.get(statsKey) || {
        totalCommands: 0,
        intentCounts: {},
        lastActivity: null
      }
      
      stats.totalCommands += 1
      stats.intentCounts[intent] = (stats.intentCounts[intent] || 0) + 1
      stats.lastActivity = new Date().toISOString()
      
      await this.cacheService.set(statsKey, stats, 86400) // 24 hours
      
    } catch (error) {
      this.logger.error('Error updating user stats:', error)
    }
  }

  async getPopularCommands(limit = 10) {
    try {
      const cacheKey = 'voice:popular:commands'
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const popularCommands = await CommandHistory.aggregate([
        {
          $group: {
            _id: '$command',
            count: { $sum: 1 },
            avgConfidence: { $avg: '$confidence' }
          }
        },
        {
          $match: {
            count: { $gte: 2 } // Only commands used more than once
          }
        },
        {
          $sort: { count: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            command: '$_id',
            count: 1,
            avgConfidence: { $round: ['$avgConfidence', 2] }
          }
        }
      ])

      await this.cacheService.set(cacheKey, popularCommands, 3600) // 1 hour
      return popularCommands

    } catch (error) {
      this.logger.error('Error getting popular commands:', error)
      return []
    }
  }

  async searchCommands(query, userId, limit = 20) {
    try {
      const searchRegex = new RegExp(query, 'i')
      
      const commands = await CommandHistory.find({
        userId,
        $or: [
          { command: searchRegex },
          { response: searchRegex }
        ]
      })
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean()
      
      return commands

    } catch (error) {
      this.logger.error('Error searching commands:', error)
      return []
    }
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  async cleanupOldCommands(daysOld = 90) {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const result = await CommandHistory.deleteMany({
        timestamp: { $lt: cutoffDate }
      })
      
      this.logger.info(`Cleaned up ${result.deletedCount} old commands`)
      return result.deletedCount

    } catch (error) {
      this.logger.error('Error cleaning up old commands:', error)
      return 0
    }
  }
}
