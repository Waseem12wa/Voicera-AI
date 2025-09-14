import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { OAuthClient, OAuthToken } from '../schema.js'

// OAuth 2.0 Server Implementation
export class OAuth2Server {
  constructor() {
    this.authorizationCodeExpiry = 600 // 10 minutes
    this.authorizationCodes = new Map() // In production, use Redis
  }

  // Generate authorization URL
  generateAuthorizationUrl(clientId, redirectUri, scope, state) {
    const client = OAuthClient.findOne({ clientId, isActive: true })
    if (!client) {
      throw new Error('Invalid client ID')
    }

    if (!client.redirectUris.includes(redirectUri)) {
      throw new Error('Invalid redirect URI')
    }

    const code = this.generateAuthorizationCode()
    this.authorizationCodes.set(code, {
      clientId,
      redirectUri,
      scope: scope.split(' '),
      state,
      expiresAt: Date.now() + (this.authorizationCodeExpiry * 1000)
    })

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      scope,
      state,
      code_challenge: this.generateCodeChallenge(),
      code_challenge_method: 'S256'
    })

    return `/oauth/authorize?${params.toString()}`
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code, clientId, clientSecret, redirectUri) {
    const authCode = this.authorizationCodes.get(code)
    
    if (!authCode || authCode.clientId !== clientId) {
      throw new Error('Invalid authorization code')
    }

    if (authCode.expiresAt < Date.now()) {
      this.authorizationCodes.delete(code)
      throw new Error('Authorization code expired')
    }

    const client = await OAuthClient.findOne({ clientId, clientSecret, isActive: true })
    if (!client) {
      throw new Error('Invalid client credentials')
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(clientId, authCode.scope)
    const refreshToken = this.generateRefreshToken(clientId, authCode.scope)

    // Store token in database
    const token = new OAuthToken({
      accessToken,
      refreshToken,
      clientId,
      userId: authCode.userId,
      scope: authCode.scope,
      expiresAt: new Date(Date.now() + (client.accessTokenLifetime * 1000))
    })

    await token.save()

    // Clean up authorization code
    this.authorizationCodes.delete(code)

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: client.accessTokenLifetime,
      scope: authCode.scope.join(' ')
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken, clientId, clientSecret) {
    const token = await OAuthToken.findOne({
      refreshToken,
      clientId,
      isRevoked: false
    })

    if (!token) {
      throw new Error('Invalid refresh token')
    }

    if (token.expiresAt < new Date()) {
      throw new Error('Refresh token expired')
    }

    const client = await OAuthClient.findOne({ clientId, clientSecret, isActive: true })
    if (!client) {
      throw new Error('Invalid client credentials')
    }

    // Generate new access token
    const newAccessToken = this.generateAccessToken(clientId, token.scope)
    
    // Update token
    token.accessToken = newAccessToken
    token.expiresAt = new Date(Date.now() + (client.accessTokenLifetime * 1000))
    await token.save()

    return {
      access_token: newAccessToken,
      token_type: 'Bearer',
      expires_in: client.accessTokenLifetime,
      scope: token.scope.join(' ')
    }
  }

  // Revoke token
  async revokeToken(token, tokenTypeHint = 'access_token') {
    const query = tokenTypeHint === 'access_token' 
      ? { accessToken: token }
      : { refreshToken: token }

    const tokenDoc = await OAuthToken.findOne(query)
    if (tokenDoc) {
      tokenDoc.isRevoked = true
      await tokenDoc.save()
    }

    return { revoked: true }
  }

  // Validate access token
  async validateAccessToken(accessToken) {
    try {
      const token = await OAuthToken.findOne({
        accessToken,
        isRevoked: false,
        expiresAt: { $gt: new Date() }
      })

      if (!token) {
        return null
      }

      // Update last used
      token.lastUsed = new Date()
      await token.save()

      return {
        clientId: token.clientId,
        userId: token.userId,
        scope: token.scope
      }
    } catch (error) {
      return null
    }
  }

  // Generate authorization code
  generateAuthorizationCode() {
    return crypto.randomBytes(32).toString('hex')
  }

  // Generate access token
  generateAccessToken(clientId, scope) {
    return jwt.sign(
      { clientId, scope, type: 'access' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
  }

  // Generate refresh token
  generateRefreshToken(clientId, scope) {
    return crypto.randomBytes(32).toString('hex')
  }

  // Generate code challenge for PKCE
  generateCodeChallenge() {
    const codeVerifier = crypto.randomBytes(32).toString('base64url')
    return crypto.createHash('sha256').update(codeVerifier).digest('base64url')
  }

  // Client credentials flow
  async clientCredentialsGrant(clientId, clientSecret, scope) {
    const client = await OAuthClient.findOne({ 
      clientId, 
      clientSecret, 
      isActive: true,
      grants: 'client_credentials'
    })

    if (!client) {
      throw new Error('Invalid client credentials')
    }

    const accessToken = this.generateAccessToken(clientId, scope.split(' '))
    
    const token = new OAuthToken({
      accessToken,
      clientId,
      userId: null, // No user for client credentials
      scope: scope.split(' '),
      expiresAt: new Date(Date.now() + (client.accessTokenLifetime * 1000))
    })

    await token.save()

    return {
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: client.accessTokenLifetime,
      scope
    }
  }
}

// Middleware for OAuth 2.0 authentication
export const oauth2Auth = (requiredScopes = []) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid authorization header' })
      }

      const accessToken = authHeader.substring(7)
      const oauthServer = new OAuth2Server()
      const tokenInfo = await oauthServer.validateAccessToken(accessToken)

      if (!tokenInfo) {
        return res.status(401).json({ error: 'Invalid or expired access token' })
      }

      // Check required scopes
      if (requiredScopes.length > 0) {
        const hasRequiredScopes = requiredScopes.every(scope => 
          tokenInfo.scope.includes(scope)
        )
        if (!hasRequiredScopes) {
          return res.status(403).json({ error: 'Insufficient scope' })
        }
      }

      req.oauth = tokenInfo
      next()
    } catch (error) {
      res.status(500).json({ error: 'Authentication error' })
    }
  }
}

// Rate limiting middleware
export const rateLimit = (requestsPerMinute = 60) => {
  const requests = new Map()

  return (req, res, next) => {
    const clientId = req.oauth?.clientId || req.ip
    const now = Date.now()
    const windowMs = 60 * 1000 // 1 minute

    if (!requests.has(clientId)) {
      requests.set(clientId, { count: 1, resetTime: now + windowMs })
      return next()
    }

    const clientRequests = requests.get(clientId)
    
    if (now > clientRequests.resetTime) {
      clientRequests.count = 1
      clientRequests.resetTime = now + windowMs
      return next()
    }

    if (clientRequests.count >= requestsPerMinute) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((clientRequests.resetTime - now) / 1000)
      })
    }

    clientRequests.count++
    next()
  }
}
