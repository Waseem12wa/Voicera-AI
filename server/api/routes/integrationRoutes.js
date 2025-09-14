import express from 'express'
import { ApiIntegration, OAuthClient, OAuthToken, WebhookEvent, ApiKey } from '../schema.js'
import { OAuth2Server, oauth2Auth, rateLimit } from '../auth/oauth2.js'
import { WebhookManager, WEBHOOK_EVENTS } from '../webhooks/webhookManager.js'
import { createSlackIntegration } from '../integrations/slack.js'
import { createGoogleWorkspaceIntegration } from '../integrations/google-workspace.js'

const router = express.Router()
const oauth2Server = new OAuth2Server()
const webhookManager = new WebhookManager()

// OAuth 2.0 Routes
router.post('/oauth/token', async (req, res) => {
  try {
    const { grant_type, client_id, client_secret, code, redirect_uri, scope } = req.body

    let tokenResponse

    switch (grant_type) {
      case 'authorization_code':
        tokenResponse = await oauth2Server.exchangeCodeForToken(
          code, client_id, client_secret, redirect_uri
        )
        break
      case 'client_credentials':
        tokenResponse = await oauth2Server.clientCredentialsGrant(
          client_id, client_secret, scope
        )
        break
      case 'refresh_token':
        tokenResponse = await oauth2Server.refreshAccessToken(
          code, client_id, client_secret
        )
        break
      default:
        return res.status(400).json({ error: 'Unsupported grant type' })
    }

    res.json(tokenResponse)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/oauth/revoke', async (req, res) => {
  try {
    const { token, token_type_hint } = req.body
    await oauth2Server.revokeToken(token, token_type_hint)
    res.json({ revoked: true })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Integration Management Routes
router.get('/integrations', oauth2Auth(['read']), async (req, res) => {
  try {
    const integrations = await ApiIntegration.find({ status: 'active' })
    res.json(integrations)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/integrations', oauth2Auth(['write']), async (req, res) => {
  try {
    const integration = new ApiIntegration(req.body)
    await integration.save()
    res.status(201).json(integration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/integrations/:id', oauth2Auth(['read']), async (req, res) => {
  try {
    const integration = await ApiIntegration.findById(req.params.id)
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' })
    }
    res.json(integration)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.put('/integrations/:id', oauth2Auth(['write']), async (req, res) => {
  try {
    const integration = await ApiIntegration.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' })
    }
    res.json(integration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/integrations/:id', oauth2Auth(['write']), async (req, res) => {
  try {
    await ApiIntegration.findByIdAndDelete(req.params.id)
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Platform-specific Integration Routes
router.post('/integrations/slack/connect', oauth2Auth(['write']), async (req, res) => {
  try {
    const { code, redirect_uri } = req.body
    const slackIntegration = await createSlackIntegration(req.body.integrationId)
    const authResult = await slackIntegration.authenticate(code, redirect_uri)
    res.json(authResult)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/integrations/slack/message', oauth2Auth(['write']), async (req, res) => {
  try {
    const { integrationId, channel, text, blocks } = req.body
    const slackIntegration = await createSlackIntegration(integrationId)
    const result = await slackIntegration.sendMessage(channel, text, blocks)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/integrations/google/connect', oauth2Auth(['write']), async (req, res) => {
  try {
    const { code } = req.body
    const googleIntegration = await createGoogleWorkspaceIntegration(req.body.integrationId)
    const authResult = await googleIntegration.authenticate(code)
    res.json(authResult)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.post('/integrations/google/email', oauth2Auth(['write']), async (req, res) => {
  try {
    const { integrationId, to, subject, body, isHtml } = req.body
    const googleIntegration = await createGoogleWorkspaceIntegration(integrationId)
    const result = await googleIntegration.sendEmail(to, subject, body, isHtml)
    res.json(result)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Webhook Routes
router.post('/webhooks', oauth2Auth(['write']), async (req, res) => {
  try {
    const { eventType, source, payload, subscribers } = req.body
    const webhookEvent = await webhookManager.createWebhookEvent(
      eventType, source, payload, subscribers
    )
    res.status(201).json(webhookEvent)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/webhooks', oauth2Auth(['read']), async (req, res) => {
  try {
    const webhooks = await webhookManager.getWebhookEvents(req.query)
    res.json(webhooks)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.post('/webhooks/subscribe', oauth2Auth(['write']), async (req, res) => {
  try {
    const { integrationId, eventType, webhookUrl, secret } = req.body
    const integration = await webhookManager.registerWebhookSubscription(
      integrationId, eventType, webhookUrl, secret
    )
    res.json(integration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.delete('/webhooks/unsubscribe', oauth2Auth(['write']), async (req, res) => {
  try {
    const { integrationId, eventType } = req.body
    const integration = await webhookManager.unregisterWebhookSubscription(
      integrationId, eventType
    )
    res.json(integration)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

// Webhook endpoint for receiving external webhooks
router.post('/webhooks/receive/:integrationId', async (req, res) => {
  try {
    const { integrationId } = req.params
    const integration = await ApiIntegration.findById(integrationId)
    
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' })
    }

    // Verify webhook signature
    const signature = req.headers['x-webhook-signature']
    const secret = integration.webhooks[0]?.secret
    
    if (secret && !webhookManager.verifySignature(
      JSON.stringify(req.body), 
      signature, 
      secret
    )) {
      return res.status(401).json({ error: 'Invalid webhook signature' })
    }

    // Process webhook based on platform
    let result
    switch (integration.platform) {
      case 'slack':
        const slackIntegration = await createSlackIntegration(integrationId)
        result = await slackIntegration.handleWebhook(req.body)
        break
      case 'google-workspace':
        // Handle Google Workspace webhooks
        result = { status: 'processed' }
        break
      default:
        result = { status: 'processed' }
    }

    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API Key Management
router.post('/api-keys', oauth2Auth(['write']), async (req, res) => {
  try {
    const apiKey = new ApiKey({
      ...req.body,
      keyId: crypto.randomUUID(),
      keySecret: crypto.randomBytes(32).toString('hex'),
      owner: req.oauth.userId
    })
    await apiKey.save()
    res.status(201).json(apiKey)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
})

router.get('/api-keys', oauth2Auth(['read']), async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({ owner: req.oauth.userId })
    res.json(apiKeys)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

router.delete('/api-keys/:keyId', oauth2Auth(['write']), async (req, res) => {
  try {
    await ApiKey.findOneAndDelete({ 
      keyId: req.params.keyId, 
      owner: req.oauth.userId 
    })
    res.status(204).send()
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// SDK Download Routes
router.get('/sdk/:language', async (req, res) => {
  try {
    const { language } = req.params
    const { version = 'latest' } = req.query
    
    // In a real implementation, you would serve the actual SDK files
    const sdkInfo = {
      language,
      version,
      downloadUrl: `/sdk/${language}/${version}/download`,
      documentation: `/docs/sdk/${language}`,
      examples: `/examples/${language}`
    }
    
    res.json(sdkInfo)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Rate limiting middleware
router.use(rateLimit(60)) // 60 requests per minute

export default router
