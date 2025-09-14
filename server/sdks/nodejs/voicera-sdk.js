import axios from 'axios'
import crypto from 'crypto'

/**
 * Voicera AI SDK for Node.js
 * Official SDK for integrating with Voicera AI platform
 */
export class VoiceraSDK {
  constructor(config) {
    this.baseUrl = config.baseUrl || 'https://api.voicera.ai'
    this.apiKey = config.apiKey
    this.accessToken = config.accessToken
    this.version = config.version || 'v1'
    this.timeout = config.timeout || 30000

    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.version}`,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'VoiceraAI-NodeSDK/1.0.0'
      }
    })

    // Add authentication interceptor
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`
      } else if (this.apiKey) {
        config.headers['X-API-Key'] = this.apiKey
      }
      return config
    })

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          throw new VoiceraError(
            error.response.data.message || 'API request failed',
            error.response.status,
            error.response.data
          )
        } else if (error.request) {
          throw new VoiceraError('Network error - no response received', 0)
        } else {
          throw new VoiceraError(error.message, 0)
        }
      }
    )
  }

  // Authentication methods
  async authenticate(clientId, clientSecret, scope = 'read write') {
    try {
      const response = await this.client.post('/oauth/token', {
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
        scope
      })

      this.accessToken = response.data.access_token
      return response.data
    } catch (error) {
      throw new VoiceraError('Authentication failed', error.status, error.data)
    }
  }

  // User management
  async getUsers(filters = {}) {
    const response = await this.client.get('/users', { params: filters })
    return response.data
  }

  async getUser(userId) {
    const response = await this.client.get(`/users/${userId}`)
    return response.data
  }

  async createUser(userData) {
    const response = await this.client.post('/users', userData)
    return response.data
  }

  async updateUser(userId, userData) {
    const response = await this.client.put(`/users/${userId}`, userData)
    return response.data
  }

  async deleteUser(userId) {
    const response = await this.client.delete(`/users/${userId}`)
    return response.data
  }

  // Course management
  async getCourses(filters = {}) {
    const response = await this.client.get('/courses', { params: filters })
    return response.data
  }

  async getCourse(courseId) {
    const response = await this.client.get(`/courses/${courseId}`)
    return response.data
  }

  async createCourse(courseData) {
    const response = await this.client.post('/courses', courseData)
    return response.data
  }

  async updateCourse(courseId, courseData) {
    const response = await this.client.put(`/courses/${courseId}`, courseData)
    return response.data
  }

  async deleteCourse(courseId) {
    const response = await this.client.delete(`/courses/${courseId}`)
    return response.data
  }

  // Quiz management
  async getQuizzes(filters = {}) {
    const response = await this.client.get('/quizzes', { params: filters })
    return response.data
  }

  async getQuiz(quizId) {
    const response = await this.client.get(`/quizzes/${quizId}`)
    return response.data
  }

  async createQuiz(quizData) {
    const response = await this.client.post('/quizzes', quizData)
    return response.data
  }

  async submitQuiz(quizId, answers) {
    const response = await this.client.post(`/quizzes/${quizId}/submit`, { answers })
    return response.data
  }

  // File management
  async uploadFile(file, metadata = {}) {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('metadata', JSON.stringify(metadata))

    const response = await this.client.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })

    return response.data
  }

  async getFile(fileId) {
    const response = await this.client.get(`/files/${fileId}`)
    return response.data
  }

  async deleteFile(fileId) {
    const response = await this.client.delete(`/files/${fileId}`)
    return response.data
  }

  // Voice commands
  async processVoiceCommand(command, context = {}) {
    const response = await this.client.post('/voice/process', {
      command,
      context
    })
    return response.data
  }

  async getVoiceCommands(filters = {}) {
    const response = await this.client.get('/voice/commands', { params: filters })
    return response.data
  }

  // Analytics
  async getAnalytics(type, filters = {}) {
    const response = await this.client.get(`/analytics/${type}`, { params: filters })
    return response.data
  }

  async getRealTimeMetrics() {
    const response = await this.client.get('/analytics/real-time')
    return response.data
  }

  // Webhooks
  async createWebhook(webhookData) {
    const response = await this.client.post('/webhooks', webhookData)
    return response.data
  }

  async getWebhooks() {
    const response = await this.client.get('/webhooks')
    return response.data
  }

  async deleteWebhook(webhookId) {
    const response = await this.client.delete(`/webhooks/${webhookId}`)
    return response.data
  }

  // Verify webhook signature
  verifyWebhookSignature(payload, signature, secret) {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  }

  // Rate limiting
  async checkRateLimit() {
    const response = await this.client.get('/rate-limit')
    return response.data
  }

  // Health check
  async healthCheck() {
    const response = await this.client.get('/health')
    return response.data
  }
}

// Error class
export class VoiceraError extends Error {
  constructor(message, status, data = null) {
    super(message)
    this.name = 'VoiceraError'
    this.status = status
    this.data = data
  }
}

// Utility functions
export const createSDK = (config) => new VoiceraSDK(config)

export const validateWebhookSignature = (payload, signature, secret) => {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}

// Export default
export default VoiceraSDK
