export const healthCheck = (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'voice-service',
    version: '1.0.0'
  })
}