import winston from 'winston'

const logger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'voice-service' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log' })
  ]
})

export const errorHandler = (err, req, res, next) => {
  // Log the error
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  })

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  // Determine error type and status code
  let statusCode = 500
  let message = 'Internal Server Error'
  
  if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Validation Error'
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Unauthorized'
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403
    message = 'Forbidden'
  } else if (err.name === 'NotFoundError') {
    statusCode = 404
    message = 'Not Found'
  } else if (err.name === 'RateLimitError') {
    statusCode = 429
    message = 'Too Many Requests'
  } else if (err.name === 'TimeoutError') {
    statusCode = 408
    message = 'Request Timeout'
  }

  // Prepare error response
  const errorResponse = {
    error: {
      message,
      status: statusCode,
      timestamp: new Date().toISOString(),
      path: req.url,
      method: req.method
    }
  }

  // Include additional details in development
  if (isDevelopment) {
    errorResponse.error.details = {
      name: err.name,
      stack: err.stack,
      originalMessage: err.message
    }
  }

  // Include request ID if available
  if (req.id) {
    errorResponse.error.requestId = req.id
  }

  res.status(statusCode).json(errorResponse)
}
