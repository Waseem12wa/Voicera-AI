import axios from 'axios'
import { ApiIntegration } from '../schema.js'

export class ZapierIntegration {
  constructor(integrationConfig) {
    this.config = integrationConfig
    this.baseUrl = 'https://hooks.zapier.com/hooks/catch'
  }

  // Create Zapier webhook
  async createWebhook(webhookUrl, eventType, data) {
    try {
      const response = await axios.post(webhookUrl, {
        event: eventType,
        timestamp: new Date().toISOString(),
        data: data
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to send Zapier webhook: ${error.message}`)
    }
  }

  // Trigger user creation zap
  async triggerUserCreated(userData) {
    const webhookUrl = this.config.webhookUrls?.userCreated
    if (!webhookUrl) {
      throw new Error('User creation webhook URL not configured')
    }

    return await this.createWebhook(webhookUrl, 'user.created', {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      createdAt: userData.createdAt
    })
  }

  // Trigger course completion zap
  async triggerCourseCompleted(courseData, userData) {
    const webhookUrl = this.config.webhookUrls?.courseCompleted
    if (!webhookUrl) {
      throw new Error('Course completion webhook URL not configured')
    }

    return await this.createWebhook(webhookUrl, 'course.completed', {
      course: {
        id: courseData.id,
        name: courseData.name,
        score: courseData.score,
        completedAt: courseData.completedAt
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    })
  }

  // Trigger quiz submission zap
  async triggerQuizSubmitted(quizData, userData) {
    const webhookUrl = this.config.webhookUrls?.quizSubmitted
    if (!webhookUrl) {
      throw new Error('Quiz submission webhook URL not configured')
    }

    return await this.createWebhook(webhookUrl, 'quiz.submitted', {
      quiz: {
        id: quizData.id,
        title: quizData.title,
        score: quizData.score,
        submittedAt: quizData.submittedAt
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    })
  }

  // Trigger file upload zap
  async triggerFileUploaded(fileData, userData) {
    const webhookUrl = this.config.webhookUrls?.fileUploaded
    if (!webhookUrl) {
      throw new Error('File upload webhook URL not configured')
    }

    return await this.createWebhook(webhookUrl, 'file.uploaded', {
      file: {
        id: fileData.id,
        name: fileData.name,
        type: fileData.type,
        size: fileData.size,
        uploadedAt: fileData.uploadedAt
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    })
  }

  // Trigger voice command zap
  async triggerVoiceCommand(commandData, userData) {
    const webhookUrl = this.config.webhookUrls?.voiceCommand
    if (!webhookUrl) {
      throw new Error('Voice command webhook URL not configured')
    }

    return await this.createWebhook(webhookUrl, 'voice.command', {
      command: {
        id: commandData.id,
        text: commandData.text,
        processedAt: commandData.processedAt,
        result: commandData.result
      },
      user: {
        id: userData.id,
        name: userData.name,
        email: userData.email
      }
    })
  }

  // Get Zapier app information
  async getAppInfo() {
    return {
      name: 'Voicera AI',
      description: 'Educational AI platform with voice commands and analytics',
      version: '1.0.0',
      triggers: [
        {
          key: 'user_created',
          name: 'New User Created',
          description: 'Triggered when a new user is created'
        },
        {
          key: 'course_completed',
          name: 'Course Completed',
          description: 'Triggered when a user completes a course'
        },
        {
          key: 'quiz_submitted',
          name: 'Quiz Submitted',
          description: 'Triggered when a user submits a quiz'
        },
        {
          key: 'file_uploaded',
          name: 'File Uploaded',
          description: 'Triggered when a user uploads a file'
        },
        {
          key: 'voice_command',
          name: 'Voice Command Processed',
          description: 'Triggered when a voice command is processed'
        }
      ],
      actions: [
        {
          key: 'create_user',
          name: 'Create User',
          description: 'Create a new user in Voicera AI'
        },
        {
          key: 'create_course',
          name: 'Create Course',
          description: 'Create a new course in Voicera AI'
        },
        {
          key: 'send_notification',
          name: 'Send Notification',
          description: 'Send a notification to a user'
        }
      ]
    }
  }
}

// Zapier integration factory
export const createZapierIntegration = async (integrationId) => {
  const integration = await ApiIntegration.findById(integrationId)
  if (!integration || integration.platform !== 'zapier') {
    throw new Error('Invalid Zapier integration')
  }

  return new ZapierIntegration(integration.configuration)
}

export default ZapierIntegration
