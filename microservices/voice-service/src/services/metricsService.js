export class MetricsService {
  constructor() {
    this.counters = new Map()
    this.timers = new Map()
    this.gauges = new Map()
  }

  incrementVoiceCommandsProcessed() {
    const current = this.counters.get('voice_commands_processed') || 0
    this.counters.set('voice_commands_processed', current + 1)
  }

  incrementVoiceCommandsFailed() {
    const current = this.counters.get('voice_commands_failed') || 0
    this.counters.set('voice_commands_failed', current + 1)
  }

  incrementCacheHits() {
    const current = this.counters.get('cache_hits') || 0
    this.counters.set('cache_hits', current + 1)
  }

  incrementCacheMisses() {
    const current = this.counters.get('cache_misses') || 0
    this.counters.set('cache_misses', current + 1)
  }

  recordProcessingTime(timeMs) {
    const times = this.timers.get('processing_times') || []
    times.push(timeMs)
    
    // Keep only last 100 processing times
    if (times.length > 100) {
      times.shift()
    }
    
    this.timers.set('processing_times', times)
  }

  recordTranslationTime(timeMs) {
    const times = this.timers.get('translation_times') || []
    times.push(timeMs)
    
    if (times.length > 100) {
      times.shift()
    }
    
    this.timers.set('translation_times', times)
  }

  setActiveConnections(count) {
    this.gauges.set('active_connections', count)
  }

  setQueueSize(size) {
    this.gauges.set('queue_size', size)
  }

  getMetrics() {
    const processingTimes = this.timers.get('processing_times') || []
    const translationTimes = this.timers.get('translation_times') || []
    
    const avgProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
      : 0
    
    const avgTranslationTime = translationTimes.length > 0 
      ? translationTimes.reduce((a, b) => a + b, 0) / translationTimes.length 
      : 0

    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      averages: {
        processingTime: Math.round(avgProcessingTime * 100) / 100,
        translationTime: Math.round(avgTranslationTime * 100) / 100
      },
      totals: {
        voiceCommandsProcessed: this.counters.get('voice_commands_processed') || 0,
        voiceCommandsFailed: this.counters.get('voice_commands_failed') || 0,
        cacheHits: this.counters.get('cache_hits') || 0,
        cacheMisses: this.counters.get('cache_misses') || 0
      }
    }
  }

  reset() {
    this.counters.clear()
    this.timers.clear()
    this.gauges.clear()
  }
}