import Redis from 'ioredis'
import winston from 'winston'

export class CacheService {
  constructor(redis) {
    this.redis = redis
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'cache-service' },
      transports: [
        new winston.transports.Console()
      ]
    })
  }

  async get(key) {
    try {
      const value = await this.redis.get(key)
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`)
        return JSON.parse(value)
      }
      this.logger.debug(`Cache miss for key: ${key}`)
      return null
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}:`, error)
      return null
    }
  }

  async set(key, value, ttlSeconds = 3600) {
    try {
      const serialized = JSON.stringify(value)
      await this.redis.setex(key, ttlSeconds, serialized)
      this.logger.debug(`Cached key: ${key} with TTL: ${ttlSeconds}s`)
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}:`, error)
    }
  }

  async del(key) {
    try {
      await this.redis.del(key)
      this.logger.debug(`Deleted cache key: ${key}`)
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}:`, error)
    }
  }

  async exists(key) {
    try {
      const exists = await this.redis.exists(key)
      return exists === 1
    } catch (error) {
      this.logger.error(`Error checking cache key existence ${key}:`, error)
      return false
    }
  }

  async expire(key, ttlSeconds) {
    try {
      await this.redis.expire(key, ttlSeconds)
      this.logger.debug(`Set TTL for key: ${key} to ${ttlSeconds}s`)
    } catch (error) {
      this.logger.error(`Error setting TTL for key ${key}:`, error)
    }
  }

  async getPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length === 0) return []
      
      const values = await this.redis.mget(...keys)
      return values
        .filter(value => value !== null)
        .map(value => JSON.parse(value))
    } catch (error) {
      this.logger.error(`Error getting pattern ${pattern}:`, error)
      return []
    }
  }

  async flushPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
        this.logger.info(`Flushed ${keys.length} keys matching pattern: ${pattern}`)
      }
    } catch (error) {
      this.logger.error(`Error flushing pattern ${pattern}:`, error)
    }
  }

  async increment(key, ttlSeconds = 3600) {
    try {
      const value = await this.redis.incr(key)
      if (value === 1) {
        await this.redis.expire(key, ttlSeconds)
      }
      return value
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}:`, error)
      return 0
    }
  }

  async getStats() {
    try {
      const info = await this.redis.info('memory')
      const stats = {
        usedMemory: this.parseInfoValue(info, 'used_memory_human'),
        connectedClients: this.parseInfoValue(info, 'connected_clients'),
        totalCommandsProcessed: this.parseInfoValue(info, 'total_commands_processed'),
        keyspaceHits: this.parseInfoValue(info, 'keyspace_hits'),
        keyspaceMisses: this.parseInfoValue(info, 'keyspace_misses')
      }
      
      if (stats.keyspaceHits && stats.keyspaceMisses) {
        stats.hitRate = stats.keyspaceHits / (stats.keyspaceHits + stats.keyspaceMisses)
      }
      
      return stats
    } catch (error) {
      this.logger.error('Error getting cache stats:', error)
      return {}
    }
  }

  parseInfoValue(info, key) {
    const match = info.match(new RegExp(`${key}:(.+)`))
    return match ? match[1].trim() : null
  }
}
