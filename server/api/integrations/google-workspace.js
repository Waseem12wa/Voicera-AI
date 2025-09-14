import { google } from 'googleapis'
import { ApiIntegration } from '../schema.js'

export class GoogleWorkspaceIntegration {
  constructor(integrationConfig) {
    this.config = integrationConfig
    this.oauth2Client = new google.auth.OAuth2(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    )
  }

  // Authenticate with Google
  async authenticate(code) {
    try {
      const { tokens } = await this.oauth2Client.getToken(code)
      this.oauth2Client.setCredentials(tokens)

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        scope: tokens.scope,
        expiryDate: tokens.expiry_date
      }
    } catch (error) {
      throw new Error(`Google authentication failed: ${error.message}`)
    }
  }

  // Set credentials
  setCredentials(tokens) {
    this.oauth2Client.setCredentials(tokens)
  }

  // Get Gmail service
  getGmailService() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client })
  }

  // Get Drive service
  getDriveService() {
    return google.drive({ version: 'v3', auth: this.oauth2Client })
  }

  // Get Calendar service
  getCalendarService() {
    return google.calendar({ version: 'v3', auth: this.oauth2Client })
  }

  // Get Docs service
  getDocsService() {
    return google.docs({ version: 'v1', auth: this.oauth2Client })
  }

  // Send email via Gmail
  async sendEmail(to, subject, body, isHtml = false) {
    try {
      const gmail = this.getGmailService()
      
      const message = {
        raw: Buffer.from(
          `To: ${to}\r\n` +
          `Subject: ${subject}\r\n` +
          `Content-Type: ${isHtml ? 'text/html' : 'text/plain'}; charset=UTF-8\r\n` +
          `\r\n` +
          body
        ).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      }

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: message
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to send email: ${error.message}`)
    }
  }

  // Create Google Doc
  async createDocument(title, content) {
    try {
      const docs = this.getDocsService()
      
      const document = await docs.documents.create({
        requestBody: {
          title: title
        }
      })

      // Add content to document
      if (content) {
        await docs.documents.batchUpdate({
          documentId: document.data.documentId,
          requestBody: {
            requests: [{
              insertText: {
                location: {
                  index: 1
                },
                text: content
              }
            }]
          }
        })
      }

      return document.data
    } catch (error) {
      throw new Error(`Failed to create Google Doc: ${error.message}`)
    }
  }

  // Upload file to Google Drive
  async uploadFile(fileName, fileContent, mimeType, folderId = null) {
    try {
      const drive = this.getDriveService()
      
      const fileMetadata = {
        name: fileName,
        ...(folderId && { parents: [folderId] })
      }

      const media = {
        mimeType: mimeType,
        body: fileContent
      }

      const response = await drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink'
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to upload file to Google Drive: ${error.message}`)
    }
  }

  // Create calendar event
  async createCalendarEvent(summary, description, startTime, endTime, attendees = []) {
    try {
      const calendar = this.getCalendarService()
      
      const event = {
        summary: summary,
        description: description,
        start: {
          dateTime: startTime,
          timeZone: 'UTC'
        },
        end: {
          dateTime: endTime,
          timeZone: 'UTC'
        },
        attendees: attendees.map(email => ({ email })),
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 10 }
          ]
        }
      }

      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to create calendar event: ${error.message}`)
    }
  }

  // Get calendar events
  async getCalendarEvents(timeMin, timeMax, maxResults = 10) {
    try {
      const calendar = this.getCalendarService()
      
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin,
        timeMax: timeMax,
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      })

      return response.data.items
    } catch (error) {
      throw new Error(`Failed to get calendar events: ${error.message}`)
    }
  }

  // Create Google Form
  async createForm(title, description, questions = []) {
    try {
      const forms = google.forms({ version: 'v1', auth: this.oauth2Client })
      
      const form = {
        info: {
          title: title,
          description: description
        },
        items: questions.map((question, index) => ({
          title: question.title,
          questionItem: {
            question: {
              required: question.required || false,
              choiceQuestion: {
                type: question.type || 'RADIO',
                options: question.options || []
              }
            }
          }
        }))
      }

      const response = await forms.forms.create({
        requestBody: form
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to create Google Form: ${error.message}`)
    }
  }

  // Share file with specific users
  async shareFile(fileId, emails, role = 'reader') {
    try {
      const drive = this.getDriveService()
      
      const permissions = emails.map(email => ({
        type: 'user',
        role: role,
        emailAddress: email
      }))

      const response = await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: role,
          type: 'user',
          emailAddress: emails[0] // Google Drive API only supports one permission at a time
        }
      })

      return response.data
    } catch (error) {
      throw new Error(`Failed to share file: ${error.message}`)
    }
  }

  // Get user profile
  async getUserProfile() {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
      
      const response = await oauth2.userinfo.get()
      return response.data
    } catch (error) {
      throw new Error(`Failed to get user profile: ${error.message}`)
    }
  }

  // Create course completion certificate
  async createCompletionCertificate(studentName, courseName, completionDate, score) {
    try {
      const title = `Certificate of Completion - ${courseName}`
      const content = `
        <h1 style="text-align: center;">Certificate of Completion</h1>
        <p style="text-align: center;">This certifies that</p>
        <h2 style="text-align: center;">${studentName}</h2>
        <p style="text-align: center;">has successfully completed the course</p>
        <h3 style="text-align: center;">${courseName}</h3>
        <p style="text-align: center;">with a score of ${score}%</p>
        <p style="text-align: center;">Completed on: ${completionDate}</p>
      `

      const document = await this.createDocument(title, content)
      
      // Make it viewable by anyone with the link
      await this.shareFile(document.documentId, [], 'reader')
      
      return document
    } catch (error) {
      throw new Error(`Failed to create completion certificate: ${error.message}`)
    }
  }

  // Send course reminder email
  async sendCourseReminder(studentEmail, courseName, dueDate) {
    const subject = `Reminder: ${courseName} - Due ${dueDate}`
    const body = `
      <h2>Course Reminder</h2>
      <p>Hello,</p>
      <p>This is a reminder that your course <strong>${courseName}</strong> is due on ${dueDate}.</p>
      <p>Please make sure to complete all assignments and quizzes before the deadline.</p>
      <p>Best regards,<br>Voicera AI Team</p>
    `

    return await this.sendEmail(studentEmail, subject, body, true)
  }
}

// Google Workspace integration factory
export const createGoogleWorkspaceIntegration = async (integrationId) => {
  const integration = await ApiIntegration.findById(integrationId)
  if (!integration || integration.platform !== 'google-workspace') {
    throw new Error('Invalid Google Workspace integration')
  }

  return new GoogleWorkspaceIntegration(integration.configuration)
}

export default GoogleWorkspaceIntegration
