import mongoose from 'mongoose'
import Redis from 'ioredis'

export const healthCheck = async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'voice-service',
    version: process.env.SERVICE_VERSION || '1.0.0',
    checks: {}
  }

  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'healthy' : 'unhealthy'
    health.checks.database = {
      status: mongoStatus,
      message: mongoStatus === 'healthy' ? 'Connected to MongoDB' : 'MongoDB connection failed'
    }

    // Check Redis connection
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      lazyConnect: true
    })

    try {
      await redis.ping()
      health.checks.redis = {
        status: 'healthy',
        message: 'Redis connection successful'
      }
    } catch (error) {
      health.checks.redis = {
        status: 'unhealthy',
        message: 'Redis connection failed'
      }
    } finally {
      await redis.quit()
    }

    // Check memory usage
    const memoryUsage = process.memoryUsage()
    health.checks.memory = {
      status: memoryUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      message: `Heap used: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      details: {
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        rss: memoryUsage.rss
      }
    }

    // Check uptime
    const uptime = process.uptime()
    health.checks.uptime = {
      status: 'healthy',
      message: `Service uptime: ${Math.round(uptime)}s`,
      uptime: uptime
    }

    // Determine overall status
    const allChecks = Object.values(health.checks)
    const hasUnhealthy = allChecks.some(check => check.status === 'unhealthy')
    const hasWarning = allChecks.some(check => check.status === 'warning')

    if (hasUnhealthy) {
      health.status = 'unhealthy'
    } else if (hasWarning) {
      health.status = 'degraded'
    }

    // Set appropriate HTTP status
    const statusCode = health.status === 'healthy' ? 200 : 
                     health.status === 'degraded' ? 200 : 503

    res.status(statusCode).json(health)

  } catch (error) {
    health.status = 'unhealthy'
    health.checks.error = {
      status: 'unhealthy',
      message: error.message
    }
    res.status(503).json(health)
  }
}
