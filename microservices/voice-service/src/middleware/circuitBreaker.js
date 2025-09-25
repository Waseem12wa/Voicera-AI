import CircuitBreaker from 'hystrixjs'

export class CircuitBreakerService {
  constructor() {
    this.commands = new Map()
  }

  createCommand(name, run, fallback) {
    const command = CircuitBreaker.commandFactory.getOrCreate(name)
      .run(run)
      .fallbackTo(fallback)
      .timeout(5000)
      .circuitBreakerErrorThresholdPercentage(50)
      .circuitBreakerRequestVolumeThreshold(10)
      .circuitBreakerSleepWindowInMilliseconds(10000)
      .statisticalWindowLength(10000)
      .statisticalWindowNumberOfBuckets(10)
      .percentileWindowLength(60000)
      .percentileWindowNumberOfBuckets(6)
      .build()

    this.commands.set(name, command)
    return command
  }

  async execute(name, ...args) {
    const command = this.commands.get(name)
    if (!command) {
      throw new Error(`Command ${name} not found`)
    }
    return command.execute(...args)
  }

  getMetrics(name) {
    const command = this.commands.get(name)
    if (!command) {
      return null
    }
    return command.metrics
  }
}

export default CircuitBreakerService
