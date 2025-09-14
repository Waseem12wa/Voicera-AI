import mongoose from 'mongoose'

// API Integration Schema
const apiIntegrationSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  platform: { 
    type: String, 
    required: true,
    enum: ['slack', 'zapier', 'google-workspace', 'alexa', 'custom']
  },
  version: { type: String, required: true, default: '1.0.0' },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'deprecated', 'beta'],
    default: 'active'
  },
  configuration: {
    baseUrl: { type: String, required: true },
    authType: { 
      type: String, 
      enum: ['oauth2', 'api-key', 'basic', 'bearer'],
      required: true
    },
    scopes: [String],
    endpoints: [{
      name: String,
      url: String,
      method: { type: String, enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] },
      description: String,
      parameters: [{
        name: String,
        type: String,
        required: Boolean,
        description: String
      }]
    }]
  },
  webhooks: [{
    event: String,
    url: String,
    secret: String,
    retryPolicy: {
      maxRetries: { type: Number, default: 3 },
      backoffMultiplier: { type: Number, default: 2 },
      initialDelay: { type: Number, default: 1000 }
    }
  }],
  rateLimits: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 },
    burstLimit: { type: Number, default: 10 }
  },
  security: {
    requiresHttps: { type: Boolean, default: true },
    allowedOrigins: [String],
    ipWhitelist: [String]
  },
  metadata: {
    description: String,
    documentation: String,
    changelog: [{
      version: String,
      date: Date,
      changes: [String]
    }]
  }
}, { timestamps: true })

// OAuth 2.0 Client Schema
const oauthClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true, unique: true },
  clientSecret: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  redirectUris: [String],
  scopes: [String],
  grants: [{
    type: String,
    enum: ['authorization_code', 'client_credentials', 'refresh_token', 'password']
  }],
  accessTokenLifetime: { type: Number, default: 3600 }, // 1 hour
  refreshTokenLifetime: { type: Number, default: 1209600 }, // 14 days
  isActive: { type: Boolean, default: true },
  owner: { type: String, required: true }, // User ID
  integrations: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ApiIntegration' }]
}, { timestamps: true })

// OAuth 2.0 Token Schema
const oauthTokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true, unique: true },
  refreshToken: String,
  clientId: { type: String, required: true },
  userId: { type: String, required: true },
  scope: [String],
  expiresAt: { type: Date, required: true },
  isRevoked: { type: Boolean, default: false },
  lastUsed: { type: Date, default: Date.now }
}, { timestamps: true })

// Webhook Event Schema
const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, required: true, unique: true },
  eventType: { type: String, required: true },
  source: { type: String, required: true },
  payload: mongoose.Schema.Types.Mixed,
  status: {
    type: String,
    enum: ['pending', 'processing', 'delivered', 'failed', 'retrying'],
    default: 'pending'
  },
  deliveryAttempts: { type: Number, default: 0 },
  maxRetries: { type: Number, default: 3 },
  nextRetryAt: Date,
  deliveredAt: Date,
  errorMessage: String,
  subscribers: [{
    integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiIntegration' },
    webhookUrl: String,
    status: {
      type: String,
      enum: ['pending', 'delivered', 'failed', 'retrying']
    },
    lastAttempt: Date,
    attempts: { type: Number, default: 0 }
  }]
}, { timestamps: true })

// API Key Schema
const apiKeySchema = new mongoose.Schema({
  keyId: { type: String, required: true, unique: true },
  keySecret: { type: String, required: true },
  name: { type: String, required: true },
  description: String,
  permissions: [{
    resource: String,
    actions: [String] // ['read', 'write', 'delete']
  }],
  rateLimits: {
    requestsPerMinute: { type: Number, default: 60 },
    requestsPerHour: { type: Number, default: 1000 }
  },
  expiresAt: Date,
  isActive: { type: Boolean, default: true },
  lastUsed: { type: Date, default: Date.now },
  usageCount: { type: Number, default: 0 },
  owner: { type: String, required: true }
}, { timestamps: true })

// Integration Log Schema
const integrationLogSchema = new mongoose.Schema({
  integrationId: { type: mongoose.Schema.Types.ObjectId, ref: 'ApiIntegration' },
  eventType: { type: String, required: true },
  requestId: String,
  method: String,
  url: String,
  statusCode: Number,
  responseTime: Number,
  requestSize: Number,
  responseSize: Number,
  userAgent: String,
  ipAddress: String,
  error: {
    message: String,
    stack: String,
    code: String
  },
  metadata: mongoose.Schema.Types.Mixed
}, { timestamps: true })

// SDK Download Schema
const sdkDownloadSchema = new mongoose.Schema({
  language: { type: String, required: true, enum: ['nodejs', 'python', 'javascript'] },
  version: { type: String, required: true },
  platform: { type: String, required: true },
  downloadUrl: { type: String, required: true },
  checksum: String,
  size: Number,
  isActive: { type: Boolean, default: true },
  changelog: [{
    version: String,
    date: Date,
    changes: [String]
  }],
  documentation: {
    quickStart: String,
    apiReference: String,
    examples: [String]
  }
}, { timestamps: true })

// Create models
export const ApiIntegration = mongoose.model('ApiIntegration', apiIntegrationSchema)
export const OAuthClient = mongoose.model('OAuthClient', oauthClientSchema)
export const OAuthToken = mongoose.model('OAuthToken', oauthTokenSchema)
export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema)
export const ApiKey = mongoose.model('ApiKey', apiKeySchema)
export const IntegrationLog = mongoose.model('IntegrationLog', integrationLogSchema)
export const SdkDownload = mongoose.model('SdkDownload', sdkDownloadSchema)
