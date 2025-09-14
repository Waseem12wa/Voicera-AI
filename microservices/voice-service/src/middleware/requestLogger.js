import { nanoid } from 'nanoid'

export const requestLogger = (logger) => {
  return (req, res, next) => {
    // Generate unique request ID
    req.id = nanoid()
    
    // Add request ID to response headers
    res.setHeader('X-Request-ID', req.id)
    
    // Log request start
    const startTime = Date.now()
    
    logger.info('Request started', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    })
    
    // Override res.end to log response
    const originalEnd = res.end
    res.end = function(chunk, encoding) {
      const duration = Date.now() - startTime
      
      logger.info('Request completed', {
        requestId: req.id,
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        contentLength: res.get('Content-Length') || 0,
        timestamp: new Date().toISOString()
      })
      
      // Call original end method
      originalEnd.call(this, chunk, encoding)
    }
    
    next()
  }
}
