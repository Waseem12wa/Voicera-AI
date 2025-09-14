# Voicera AI API Documentation

## Overview

The Voicera AI API provides comprehensive integration capabilities for educational platforms, voice commands, analytics, and third-party services. This documentation covers all available endpoints, authentication methods, and integration patterns.

## Base URL

```
Production: https://api.voicera.ai/v1
Development: http://localhost:3000/api/v1
```

## Authentication

### OAuth 2.0

Voicera AI supports OAuth 2.0 with multiple grant types:

#### Client Credentials Flow
```bash
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "client_credentials",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "scope": "read write"
}
```

#### Authorization Code Flow
```bash
# Step 1: Get authorization URL
GET /oauth/authorize?response_type=code&client_id=your_client_id&redirect_uri=your_redirect_uri&scope=read write

# Step 2: Exchange code for token
POST /oauth/token
Content-Type: application/json

{
  "grant_type": "authorization_code",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "code": "authorization_code",
  "redirect_uri": "your_redirect_uri"
}
```

### API Key Authentication

```bash
curl -H "X-API-Key: your_api_key" https://api.voicera.ai/v1/users
```

## Core API Endpoints

### Users

#### Get All Users
```bash
GET /users
Authorization: Bearer your_access_token
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `role` (string): Filter by role (admin, teacher, student)
- `status` (string): Filter by status (active, inactive, pending)

**Response:**
```json
{
  "data": [
    {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "student",
      "status": "active",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastActive": "2024-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "pages": 5
  }
}
```

#### Create User
```bash
POST /users
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "student",
  "password": "secure_password"
}
```

#### Get User by ID
```bash
GET /users/{user_id}
Authorization: Bearer your_access_token
```

#### Update User
```bash
PUT /users/{user_id}
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "name": "Jane Smith",
  "email": "jane.smith@example.com"
}
```

#### Delete User
```bash
DELETE /users/{user_id}
Authorization: Bearer your_access_token
```

### Courses

#### Get All Courses
```bash
GET /courses
Authorization: Bearer your_access_token
```

#### Create Course
```bash
POST /courses
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "name": "Introduction to AI",
  "description": "Learn the basics of artificial intelligence",
  "instructor": "instructor_id",
  "duration": 40,
  "difficulty": "beginner"
}
```

### Voice Commands

#### Process Voice Command
```bash
POST /voice/process
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "command": "Show me my courses",
  "context": {
    "userId": "user_id",
    "sessionId": "session_id"
  }
}
```

**Response:**
```json
{
  "id": "command_id",
  "text": "Show me my courses",
  "intent": "get_courses",
  "entities": [],
  "response": {
    "type": "courses_list",
    "data": [
      {
        "id": "course_id",
        "name": "Introduction to AI",
        "progress": 75
      }
    ]
  },
  "processedAt": "2024-01-15T10:30:00Z"
}
```

### Analytics

#### Get Real-time Metrics
```bash
GET /analytics/real-time
Authorization: Bearer your_access_token
```

**Response:**
```json
{
  "activeUsers": 25,
  "currentSessions": 15,
  "requestsPerMinute": 120,
  "errorRate": 0.5,
  "averageResponseTime": 150,
  "systemLoad": 45,
  "memoryUsage": 65,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### Get User Analytics
```bash
GET /analytics/users
Authorization: Bearer your_access_token
```

#### Get Voice Analytics
```bash
GET /analytics/voice
Authorization: Bearer your_access_token
```

## Integration Endpoints

### Platform Integrations

#### Get All Integrations
```bash
GET /integrations
Authorization: Bearer your_access_token
```

#### Create Integration
```bash
POST /integrations
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "name": "Slack Integration",
  "platform": "slack",
  "configuration": {
    "baseUrl": "https://slack.com/api",
    "authType": "oauth2",
    "scopes": ["chat:write", "channels:read"]
  }
}
```

### Slack Integration

#### Connect Slack
```bash
POST /integrations/slack/connect
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "integrationId": "integration_id",
  "code": "slack_authorization_code",
  "redirect_uri": "your_redirect_uri"
}
```

#### Send Slack Message
```bash
POST /integrations/slack/message
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "integrationId": "integration_id",
  "channel": "#general",
  "text": "Hello from Voicera AI!",
  "blocks": [
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "Hello from Voicera AI!"
      }
    }
  ]
}
```

### Google Workspace Integration

#### Connect Google Workspace
```bash
POST /integrations/google/connect
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "integrationId": "integration_id",
  "code": "google_authorization_code"
}
```

#### Send Email
```bash
POST /integrations/google/email
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "integrationId": "integration_id",
  "to": "student@example.com",
  "subject": "Course Reminder",
  "body": "Your course assignment is due tomorrow.",
  "isHtml": true
}
```

## Webhooks

### Create Webhook
```bash
POST /webhooks
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "eventType": "user.created",
  "source": "voicera_ai",
  "payload": {
    "userId": "user_id",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "subscribers": [
    {
      "integrationId": "integration_id",
      "webhookUrl": "https://your-app.com/webhook"
    }
  ]
}
```

### Subscribe to Webhook
```bash
POST /webhooks/subscribe
Authorization: Bearer your_access_token
Content-Type: application/json

{
  "integrationId": "integration_id",
  "eventType": "course.completed",
  "webhookUrl": "https://your-app.com/webhook",
  "secret": "your_webhook_secret"
}
```

### Available Webhook Events

- `user.created` - New user created
- `user.updated` - User information updated
- `user.deleted` - User deleted
- `course.created` - New course created
- `course.updated` - Course updated
- `course.completed` - Course completed by user
- `quiz.submitted` - Quiz submitted
- `file.uploaded` - File uploaded
- `voice.command` - Voice command processed
- `system.alert` - System alert generated

## SDKs

### Node.js SDK

#### Installation
```bash
npm install @voicera/ai-sdk
```

#### Usage
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
```

### Python SDK

#### Installation
```bash
pip install voicera-ai-sdk
```

#### Usage
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
```

## Rate Limiting

API requests are rate limited per client:

- **Free Tier**: 60 requests per minute
- **Pro Tier**: 300 requests per minute
- **Enterprise**: 1000 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 1640995200
```

## Error Handling

### Error Response Format
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error

## Webhook Security

Webhooks include a signature header for verification:

```javascript
const crypto = require('crypto')

function verifyWebhookSignature(payload, signature, secret) {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  )
}
```

## Examples

### Complete Integration Example

```javascript
const { VoiceraSDK } = require('@voicera/ai-sdk')

// Initialize SDK
const sdk = new VoiceraSDK({
  baseUrl: 'https://api.voicera.ai',
  apiKey: 'your_api_key'
})

// Create a user
const user = await sdk.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  role: 'student'
})

// Create a course
const course = await sdk.createCourse({
  name: 'Introduction to AI',
  description: 'Learn AI basics',
  instructor: 'instructor_id'
})

// Process voice command
const result = await sdk.processVoiceCommand('Show me my courses', {
  userId: user.id
})

// Set up webhook
const webhook = await sdk.createWebhook({
  eventType: 'course.completed',
  webhookUrl: 'https://your-app.com/webhook',
  secret: 'your_secret'
})
```

## Support

For API support and questions:
- Email: api-support@voicera.ai
- Documentation: https://docs.voicera.ai
- Status Page: https://status.voicera.ai
