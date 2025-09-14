import crypto from 'crypto'
import axios from 'axios'
import { WebhookEvent, ApiIntegration, IntegrationLog } from '../schema.js'

export class WebhookManager {
  constructor() {
    this.retryQueue = new Map()
    this.maxRetries = 3
    this.baseRetryDelay = 1000
  }

  // Create webhook event
  async createWebhookEvent(eventType, source, payload, subscribers = []) {
    const eventId = crypto.randomUUID()
    
    const webhookEvent = new WebhookEvent({
      eventId,
      eventType,
      source,
      payload,
      subscribers: subscribers.map(sub => ({
        integrationId: sub.integrationId,
        webhookUrl: sub.webhookUrl,
        status: 'pending'
      }))
    })

    await webhookEvent.save()
    
    // Process webhook asynchronously
    this.processWebhookEvent(webhookEvent)
    
    return webhookEvent
  }

  // Process webhook event
  async processWebhookEvent(webhookEvent) {
    for (const subscriber of webhookEvent.subscribers) {
      try {
        await this.deliverWebhook(webhookEvent, subscriber)
      } catch (error) {
        console.error('Webhook delivery failed:', error)
        await this.handleDeliveryFailure(webhookEvent, subscriber, error)
      }
    }
  }

  // Deliver webhook to subscriber
  async deliverWebhook(webhookEvent, subscriber) {
    const integration = await ApiIntegration.findById(subscriber.integrationId)
    if (!integration) {
      throw new Error('Integration not found')
    }

    const webhookConfig = integration.webhooks.find(w => w.event === webhookEvent.eventType)
    if (!webhookConfig) {
      throw new Error('Webhook configuration not found')
    }

    const signature = this.generateSignature(
      JSON.stringify(webhookEvent.payload),
      webhookConfig.secret
    )

    const headers = {
      'Content-Type': 'application/json',
      'X-Webhook-Signature': signature,
      'X-Webhook-Event': webhookEvent.eventType,
      'X-Webhook-Event-Id': webhookEvent.eventId,
      'User-Agent': 'VoiceraAI-Webhook/1.0'
    }

    const startTime = Date.now()
    
    try {
      const response = await axios.post(subscriber.webhookUrl, {
        event: webhookEvent.eventType,
        eventId: webhookEvent.eventId,
        timestamp: webhookEvent.createdAt,
        data: webhookEvent.payload
      }, {
        headers,
        timeout: 30000 // 30 seconds
      })

      const responseTime = Date.now() - startTime

      // Update subscriber status
      subscriber.status = 'delivered'
      subscriber.lastAttempt = new Date()
      webhookEvent.deliveryAttempts++
      webhookEvent.deliveredAt = new Date()
      webhookEvent.status = 'delivered'

      await webhookEvent.save()

      // Log successful delivery
      await this.logWebhookDelivery(webhookEvent, subscriber, {
        statusCode: response.status,
        responseTime,
        success: true
      })

    } catch (error) {
      throw error
    }
  }

  // Handle delivery failure
  async handleDeliveryFailure(webhookEvent, subscriber, error) {
    subscriber.attempts++
    subscriber.lastAttempt = new Date()

    const webhookConfig = await this.getWebhookConfig(webhookEvent.eventType, subscriber.integrationId)
    const retryPolicy = webhookConfig?.retryPolicy || {
      maxRetries: this.maxRetries,
      backoffMultiplier: 2,
      initialDelay: this.baseRetryDelay
    }

    if (subscriber.attempts < retryPolicy.maxRetries) {
      // Schedule retry
      const delay = retryPolicy.initialDelay * Math.pow(retryPolicy.backoffMultiplier, subscriber.attempts - 1)
      subscriber.status = 'retrying'
      webhookEvent.nextRetryAt = new Date(Date.now() + delay)
      webhookEvent.status = 'retrying'

      // Schedule retry
      setTimeout(() => {
        this.processWebhookEvent(webhookEvent)
      }, delay)

    } else {
      // Max retries exceeded
      subscriber.status = 'failed'
      webhookEvent.status = 'failed'
      webhookEvent.errorMessage = error.message
    }

    await webhookEvent.save()

    // Log failed delivery
    await this.logWebhookDelivery(webhookEvent, subscriber, {
      statusCode: error.response?.status || 0,
      responseTime: 0,
      success: false,
      error: error.message
    })
  }

  // Generate webhook signature
  generateSignature(payload, secret) {
    return crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
  }

  // Verify webhook signature
  verifySignature(payload, signature, secret) {
    const expectedSignature = this.generateSignature(payload, secret)
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Get webhook configuration
  async getWebhookConfig(eventType, integrationId) {
    const integration = await ApiIntegration.findById(integrationId)
    return integration?.webhooks.find(w => w.event === eventType)
  }

  // Log webhook delivery
  async logWebhookDelivery(webhookEvent, subscriber, deliveryInfo) {
    const log = new IntegrationLog({
      integrationId: subscriber.integrationId,
      eventType: 'webhook_delivery',
      requestId: webhookEvent.eventId,
      method: 'POST',
      url: subscriber.webhookUrl,
      statusCode: deliveryInfo.statusCode,
      responseTime: deliveryInfo.responseTime,
      error: deliveryInfo.error ? {
        message: deliveryInfo.error,
        code: 'WEBHOOK_DELIVERY_FAILED'
      } : null,
      metadata: {
        webhookEventId: webhookEvent.eventId,
        eventType: webhookEvent.eventType,
        attempts: subscriber.attempts
      }
    })

    await log.save()
  }

  // Register webhook subscription
  async registerWebhookSubscription(integrationId, eventType, webhookUrl, secret) {
    const integration = await ApiIntegration.findById(integrationId)
    if (!integration) {
      throw new Error('Integration not found')
    }

    const existingWebhook = integration.webhooks.find(w => w.event === eventType)
    if (existingWebhook) {
      existingWebhook.url = webhookUrl
      existingWebhook.secret = secret
    } else {
      integration.webhooks.push({
        event: eventType,
        url: webhookUrl,
        secret,
        retryPolicy: {
          maxRetries: 3,
          backoffMultiplier: 2,
          initialDelay: 1000
        }
      })
    }

    await integration.save()
    return integration
  }

  // Unregister webhook subscription
  async unregisterWebhookSubscription(integrationId, eventType) {
    const integration = await ApiIntegration.findById(integrationId)
    if (!integration) {
      throw new Error('Integration not found')
    }

    integration.webhooks = integration.webhooks.filter(w => w.event !== eventType)
    await integration.save()
    return integration
  }

  // Get webhook events
  async getWebhookEvents(filters = {}) {
    const query = {}
    
    if (filters.eventType) query.eventType = filters.eventType
    if (filters.status) query.status = filters.status
    if (filters.integrationId) query['subscribers.integrationId'] = filters.integrationId
    if (filters.startDate) query.createdAt = { $gte: filters.startDate }
    if (filters.endDate) query.createdAt = { ...query.createdAt, $lte: filters.endDate }

    return await WebhookEvent.find(query)
      .sort({ createdAt: -1 })
      .limit(filters.limit || 50)
      .skip(filters.offset || 0)
  }

  // Retry failed webhooks
  async retryFailedWebhooks() {
    const failedEvents = await WebhookEvent.find({
      status: 'failed',
      deliveryAttempts: { $lt: 3 }
    })

    for (const event of failedEvents) {
      await this.processWebhookEvent(event)
    }
  }

  // Clean up old webhook events
  async cleanupOldEvents(daysOld = 30) {
    const cutoffDate = new Date(Date.now() - (daysOld * 24 * 60 * 60 * 1000))
    
    const result = await WebhookEvent.deleteMany({
      createdAt: { $lt: cutoffDate },
      status: { $in: ['delivered', 'failed'] }
    })

    return result.deletedCount
  }
}

// Webhook event types
export const WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  COURSE_CREATED: 'course.created',
  COURSE_UPDATED: 'course.updated',
  COURSE_DELETED: 'course.deleted',
  QUIZ_COMPLETED: 'quiz.completed',
  FILE_UPLOADED: 'file.uploaded',
  VOICE_COMMAND: 'voice.command',
  SYSTEM_ALERT: 'system.alert',
  INTEGRATION_CONNECTED: 'integration.connected',
  INTEGRATION_DISCONNECTED: 'integration.disconnected'
}

export default WebhookManager
