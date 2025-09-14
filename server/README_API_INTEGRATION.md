# Voicera AI API Integration System

## Overview

This document describes the comprehensive API and integration layer for Voicera AI, designed to provide seamless connectivity with third-party platforms and enable robust external integrations.

## Architecture

### Core Components

1. **API Schema** (`/api/schema.js`)
   - Mongoose schemas for all integration-related data models
   - OAuth 2.0 client and token management
   - Webhook event tracking and delivery
   - API key management
   - Integration configuration storage

2. **OAuth 2.0 Authentication** (`/api/auth/oauth2.js`)
   - Complete OAuth 2.0 server implementation
   - Support for authorization code, client credentials, and refresh token flows
   - PKCE (Proof Key for Code Exchange) support
   - Rate limiting and security middleware

3. **Webhook Management** (`/api/webhooks/webhookManager.js`)
   - Event-driven webhook system
   - Retry mechanisms with exponential backoff
   - Signature verification for security
   - Delivery tracking and logging

4. **Platform Integrations** (`/api/integrations/`)
   - **Slack** (`slack.js`): Send messages, handle events, create rich notifications
   - **Google Workspace** (`google-workspace.js`): Gmail, Drive, Calendar, Docs integration
   - **Zapier** (`zapier.js`): Webhook-based automation triggers
   - **Alexa** (`alexa.js`): Voice skill integration for educational commands

5. **SDKs** (`/sdks/`)
   - **Node.js** (`nodejs/voicera-sdk.js`): Full-featured SDK with TypeScript support
   - **Python** (`python/voicera_sdk.py`): Python SDK with async support

6. **Developer Portal** (`/frontend/src/pages/developer/`)
   - Interactive API documentation
   - Code examples and SDK downloads
   - Webhook configuration interface
   - Integration management dashboard

## Features

### 🔐 Authentication & Security
- OAuth 2.0 with multiple grant types
- API key authentication
- Webhook signature verification
- Rate limiting per client
- IP whitelisting support

### 🔗 Platform Integrations
- **Slack**: Rich notifications, interactive messages, event handling
- **Google Workspace**: Email, documents, calendar, drive integration
- **Zapier**: 5000+ app connections through webhooks
- **Alexa**: Voice commands for course management

### 📡 Webhook System
- Real-time event delivery
- Retry mechanisms with exponential backoff
- Delivery status tracking
- Event filtering and routing

### 🛠️ Developer Tools
- Comprehensive REST API
- Official SDKs for Node.js and Python
- Interactive documentation
- Code examples and tutorials

## Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Environment Setup

Create a `.env` file with:

```env
# Database
MONGO_URI=mongodb://localhost:27017/voicera

# OAuth 2.0
JWT_SECRET=your_jwt_secret_here
OAUTH_CLIENT_ID=your_client_id
OAUTH_CLIENT_SECRET=your_client_secret

# Integration APIs
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Webhooks
WEBHOOK_SECRET=your_webhook_secret
```

### 3. Start the Server

```bash
npm run dev
```

### 4. Access the Developer Portal

Navigate to `http://localhost:5173/developer` to access the interactive API documentation and integration tools.

## API Endpoints

### Authentication
- `POST /api/oauth/token` - Get access token
- `POST /api/oauth/revoke` - Revoke token

### Core API
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/courses` - List courses
- `POST /api/courses` - Create course
- `POST /api/voice/process` - Process voice command

### Integrations
- `GET /api/integrations` - List integrations
- `POST /api/integrations` - Create integration
- `POST /api/integrations/slack/connect` - Connect Slack
- `POST /api/integrations/google/connect` - Connect Google Workspace

### Webhooks
- `POST /api/webhooks` - Create webhook
- `GET /api/webhooks` - List webhooks
- `POST /api/webhooks/subscribe` - Subscribe to events

## Usage Examples

### Node.js SDK

```javascript
const { VoiceraSDK } = require('@voicera/ai-sdk')

const sdk = new VoiceraSDK({
  baseUrl: 'https://api.voicera.ai',
  apiKey: 'your_api_key'
})

// Get users
const users = await sdk.getUsers()

// Process voice command
const result = await sdk.processVoiceCommand('Show me my courses')

// Create webhook
const webhook = await sdk.createWebhook({
  eventType: 'course.completed',
  webhookUrl: 'https://your-app.com/webhook'
})
```

### Python SDK

```python
from voicera_sdk import VoiceraSDK

sdk = VoiceraSDK({
    'base_url': 'https://api.voicera.ai',
    'api_key': 'your_api_key'
})

# Get users
users = sdk.get_users()

# Process voice command
result = sdk.process_voice_command('Show me my courses')

# Create webhook
webhook = sdk.create_webhook({
    'eventType': 'course.completed',
    'webhookUrl': 'https://your-app.com/webhook'
})
```

### Slack Integration

```javascript
const { createSlackIntegration } = require('./api/integrations/slack')

const slack = await createSlackIntegration('integration_id')

// Send message
await slack.sendMessage('#general', 'Hello from Voicera AI!')

// Send rich message
await slack.sendRichMessage('#general', 'Course Completed!', 
  'John Doe completed Introduction to AI with 95% score', 
  [
    { title: 'Course', value: 'Introduction to AI' },
    { title: 'Score', value: '95%' }
  ]
)
```

### Google Workspace Integration

```javascript
const { createGoogleWorkspaceIntegration } = require('./api/integrations/google-workspace')

const google = await createGoogleWorkspaceIntegration('integration_id')

// Send email
await google.sendEmail('student@example.com', 'Course Reminder', 
  'Your assignment is due tomorrow!')

// Create document
const doc = await google.createDocument('Course Notes', 'Content here...')

// Create calendar event
await google.createCalendarEvent('Study Session', 'Group study', 
  '2024-01-20T14:00:00Z', '2024-01-20T16:00:00Z', ['student@example.com'])
```

## Webhook Events

### Available Events
- `user.created` - New user created
- `user.updated` - User information updated
- `course.completed` - Course completed by user
- `quiz.submitted` - Quiz submitted
- `file.uploaded` - File uploaded
- `voice.command` - Voice command processed
- `system.alert` - System alert generated

### Webhook Payload Example

```json
{
  "event": "course.completed",
  "eventId": "evt_123456789",
  "timestamp": "2024-01-15T10:30:00Z",
  "data": {
    "course": {
      "id": "course_123",
      "name": "Introduction to AI",
      "score": 95
    },
    "user": {
      "id": "user_456",
      "name": "John Doe",
      "email": "john@example.com"
    }
  }
}
```

## Security Considerations

### OAuth 2.0 Security
- Use HTTPS for all OAuth flows
- Implement PKCE for public clients
- Store client secrets securely
- Implement proper token expiration

### Webhook Security
- Always verify webhook signatures
- Use HTTPS for webhook URLs
- Implement idempotency for webhook processing
- Monitor for suspicious activity

### API Security
- Implement rate limiting
- Use API keys for simple integrations
- Validate all input data
- Log all API access

## Monitoring & Logging

### Integration Logs
All integration activities are logged in the `IntegrationLog` collection:
- API requests and responses
- Webhook deliveries
- Error tracking
- Performance metrics

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/rate-limit` - Rate limit status
- Webhook delivery status monitoring

## Deployment

### Production Checklist
- [ ] Set up MongoDB with proper authentication
- [ ] Configure OAuth 2.0 clients
- [ ] Set up webhook endpoints
- [ ] Configure rate limiting
- [ ] Set up monitoring and logging
- [ ] Test all integrations
- [ ] Set up SSL certificates
- [ ] Configure CORS properly

### Environment Variables
Ensure all required environment variables are set:
- Database connection strings
- OAuth client credentials
- Integration API keys
- Webhook secrets
- JWT secrets

## Support

For technical support and questions:
- Email: api-support@voicera.ai
- Documentation: https://docs.voicera.ai
- GitHub Issues: https://github.com/voicera/ai-api/issues

## License

This API integration system is part of the Voicera AI platform and is proprietary software.
