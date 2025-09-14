import axios from 'axios'
import { ApiIntegration } from '../schema.js'

export class SlackIntegration {
  constructor(integrationConfig) {
    this.config = integrationConfig
    this.baseUrl = 'https://slack.com/api'
  }

  // Authenticate with Slack
  async authenticate(code, redirectUri) {
    try {
      const response = await axios.post(`${this.baseUrl}/oauth.v2.access`, {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri
      })

      if (!response.data.ok) {
        throw new Error(response.data.error)
      }

      return {
        accessToken: response.data.access_token,
        teamId: response.data.team.id,
        teamName: response.data.team.name,
        userId: response.data.authed_user.id,
        scope: response.data.scope
      }
    } catch (error) {
      throw new Error(`Slack authentication failed: ${error.message}`)
    }
  }

  // Send message to channel
  async sendMessage(channel, text, blocks = null) {
    try {
      const payload = {
        channel,
        text,
        ...(blocks && { blocks })
      }

      const response = await axios.post(`${this.baseUrl}/chat.postMessage`, payload, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.data.ok) {
        throw new Error(response.data.error)
      }

      return response.data
    } catch (error) {
      throw new Error(`Failed to send Slack message: ${error.message}`)
    }
  }

  // Send rich message with blocks
  async sendRichMessage(channel, title, text, fields = [], actions = []) {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: title
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: text
        }
      }
    ]

    if (fields.length > 0) {
      blocks.push({
        type: 'section',
        fields: fields.map(field => ({
          type: 'mrkdwn',
          text: `*${field.title}*\n${field.value}`
        }))
      })
    }

    if (actions.length > 0) {
      blocks.push({
        type: 'actions',
        elements: actions.map(action => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: action.text
          },
          url: action.url,
          style: action.style || 'primary'
        }))
      })
    }

    return await this.sendMessage(channel, '', blocks)
  }

  // Get channel list
  async getChannels() {
    try {
      const response = await axios.get(`${this.baseUrl}/conversations.list`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        },
        params: {
          types: 'public_channel,private_channel',
          limit: 1000
        }
      })

      if (!response.data.ok) {
        throw new Error(response.data.error)
      }

      return response.data.channels
    } catch (error) {
      throw new Error(`Failed to get Slack channels: ${error.message}`)
    }
  }

  // Get user list
  async getUsers() {
    try {
      const response = await axios.get(`${this.baseUrl}/users.list`, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (!response.data.ok) {
        throw new Error(response.data.error)
      }

      return response.data.members
    } catch (error) {
      throw new Error(`Failed to get Slack users: ${error.message}`)
    }
  }

  // Create webhook for Slack events
  async createWebhook(webhookUrl, events = ['message.channels']) {
    try {
      const response = await axios.post(`${this.baseUrl}/apps.event.authorizations.list`, {
        event: events[0]
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to create Slack webhook: ${error.message}`)
    }
  }

  // Handle incoming webhook
  async handleWebhook(payload) {
    const { type, event, challenge } = payload

    // Handle URL verification
    if (type === 'url_verification') {
      return { challenge }
    }

    // Handle event callbacks
    if (type === 'event_callback') {
      switch (event.type) {
        case 'message':
          return await this.handleMessageEvent(event)
        case 'app_mention':
          return await this.handleAppMentionEvent(event)
        default:
          console.log('Unhandled Slack event type:', event.type)
      }
    }

    return { status: 'ok' }
  }

  // Handle message events
  async handleMessageEvent(event) {
    // Process incoming message
    console.log('Received Slack message:', event)
    
    // You can add custom logic here to process messages
    // For example, trigger voice commands, create tasks, etc.
    
    return { status: 'processed' }
  }

  // Handle app mention events
  async handleAppMentionEvent(event) {
    // Process app mentions
    console.log('Received Slack app mention:', event)
    
    // You can add custom logic here to respond to mentions
    // For example, provide help, execute commands, etc.
    
    return { status: 'processed' }
  }

  // Send notification about course completion
  async notifyCourseCompletion(userId, courseName, score) {
    const message = `🎉 Course completed! *${courseName}* - Score: ${score}%`
    
    try {
      // Find user's Slack DM channel
      const response = await axios.post(`${this.baseUrl}/conversations.open`, {
        users: userId
      }, {
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`
        }
      })

      if (response.data.ok) {
        await this.sendMessage(response.data.channel.id, message)
      }
    } catch (error) {
      console.error('Failed to send course completion notification:', error)
    }
  }

  // Send quiz reminder
  async sendQuizReminder(channel, quizName, dueDate) {
    const message = `📚 Quiz Reminder: *${quizName}* is due on ${dueDate}`
    
    await this.sendMessage(channel, message)
  }

  // Send system alert
  async sendSystemAlert(channel, alertType, message, severity = 'info') {
    const severityEmoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      success: '✅'
    }

    const emoji = severityEmoji[severity] || 'ℹ️'
    const alertMessage = `${emoji} *System Alert*: ${message}`

    await this.sendMessage(channel, alertMessage)
  }
}

// Slack integration factory
export const createSlackIntegration = async (integrationId) => {
  const integration = await ApiIntegration.findById(integrationId)
  if (!integration || integration.platform !== 'slack') {
    throw new Error('Invalid Slack integration')
  }

  return new SlackIntegration(integration.configuration)
}

export default SlackIntegration
