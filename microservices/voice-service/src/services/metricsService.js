import promClient from 'prom-client'

export class MetricsService {
  constructor() {
    // Create a Registry
    this.register = new promClient.Registry()
    
    // Add default metrics
    promClient.collectDefaultMetrics({ register: this.register })
    
    // Custom metrics
    this.voiceCommandsProcessed = new promClient.Counter({
      name: 'voice_commands_processed_total',
      help: 'Total number of voice commands processed',
      labelNames: ['intent', 'status']
    })
    
    this.voiceCommandsFailed = new promClient.Counter({
      name: 'voice_commands_failed_total',
      help: 'Total number of failed voice commands',
      labelNames: ['error_type']
    })
    
    this.voiceCommandProcessingTime = new promClient.Histogram({
      name: 'voice_command_processing_duration_seconds',
      help: 'Duration of voice command processing',
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    })
    
    this.cacheHits = new promClient.Counter({
      name: 'cache_hits_total',
      help: 'Total number of cache hits',
      labelNames: ['cache_type']
    })
    
    this.cacheMisses = new promClient.Counter({
      name: 'cache_misses_total',
      help: 'Total number of cache misses',
      labelNames: ['cache_type']
    })
    
    this.activeConnections = new promClient.Gauge({
      name: 'active_connections',
      help: 'Number of active WebSocket connections'
    })
    
    this.queueSize = new promClient.Gauge({
      name: 'voice_queue_size',
      help: 'Current size of the voice processing queue'
    })
    
    this.queueProcessingTime = new promClient.Histogram({
      name: 'voice_queue_processing_duration_seconds',
      help: 'Time spent in queue before processing',
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    })
    
    this.aiApiCalls = new promClient.Counter({
      name: 'ai_api_calls_total',
      help: 'Total number of AI API calls',
      labelNames: ['provider', 'status']
    })
    
    this.aiApiResponseTime = new promClient.Histogram({
      name: 'ai_api_response_duration_seconds',
      help: 'AI API response time',
      buckets: [0.1, 0.5, 1, 2, 5, 10, 30]
    })
    
    // Register custom metrics
    this.register.registerMetric(this.voiceCommandsProcessed)
    this.register.registerMetric(this.voiceCommandsFailed)
    this.register.registerMetric(this.voiceCommandProcessingTime)
    this.register.registerMetric(this.cacheHits)
    this.register.registerMetric(this.cacheMisses)
    this.register.registerMetric(this.activeConnections)
    this.register.registerMetric(this.queueSize)
    this.register.registerMetric(this.queueProcessingTime)
    this.register.registerMetric(this.aiApiCalls)
    this.register.registerMetric(this.aiApiResponseTime)
  }

  incrementVoiceCommandsProcessed(intent = 'unknown', status = 'success') {
    this.voiceCommandsProcessed.inc({ intent, status })
  }

  incrementVoiceCommandsFailed(errorType = 'unknown') {
    this.voiceCommandsFailed.inc({ error_type: errorType })
  }

  recordProcessingTime(timeMs) {
    this.voiceCommandProcessingTime.observe(timeMs / 1000)
  }

  incrementCacheHits(cacheType = 'voice') {
    this.cacheHits.inc({ cache_type: cacheType })
  }

  incrementCacheMisses(cacheType = 'voice') {
    this.cacheMisses.inc({ cache_type: cacheType })
  }

  setActiveConnections(count) {
    this.activeConnections.set(count)
  }

  setQueueSize(size) {
    this.queueSize.set(size)
  }

  recordQueueProcessingTime(timeMs) {
    this.queueProcessingTime.observe(timeMs / 1000)
  }

  incrementAiApiCalls(provider = 'groq', status = 'success') {
    this.aiApiCalls.inc({ provider, status })
  }

  recordAiApiResponseTime(timeMs) {
    this.aiApiResponseTime.observe(timeMs / 1000)
  }

  getRegister() {
    return this.register
  }

  async getMetrics() {
    return await this.register.metrics()
  }
}
