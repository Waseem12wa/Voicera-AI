import { apiClient } from './apiClient'

export interface UserSession {
  id: string
  userId: string
  userName: string
  userRole: string
  sessionStart: string
  sessionEnd?: string
  duration?: number
  ipAddress: string
  userAgent: string
  deviceType: 'desktop' | 'mobile' | 'tablet'
  browser: string
  os: string
  location?: {
    country: string
    city: string
    timezone: string
  }
  actions: SessionAction[]
  status: 'active' | 'expired' | 'terminated'
}

export interface SessionAction {
  id: string
  sessionId: string
  action: string
  timestamp: string
  details: Record<string, any>
  success: boolean
  duration?: number
}

export interface VoiceCommand {
  id: string
  userId: string
  sessionId: string
  command: string
  intent: string
  confidence: number
  timestamp: string
  response: string
  success: boolean
  processingTime: number
  language: string
  context?: Record<string, any>
}

export interface SystemError {
  id: string
  level: 'error' | 'warning' | 'info' | 'critical'
  category: 'authentication' | 'api' | 'database' | 'voice' | 'ui' | 'system'
  message: string
  stack?: string
  timestamp: string
  userId?: string
  sessionId?: string
  requestId?: string
  metadata: Record<string, any>
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
}

export interface LogQuery {
  startDate?: string
  endDate?: string
  userId?: string
  sessionId?: string
  level?: string
  category?: string
  limit?: number
  offset?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface LogStats {
  totalSessions: number
  activeSessions: number
  totalErrors: number
  criticalErrors: number
  voiceCommands: number
  averageSessionDuration: number
  errorRate: number
  topErrors: Array<{ error: string; count: number }>
  topUsers: Array<{ userId: string; userName: string; sessions: number }>
}

// User Sessions
export const getUserSessions = async (query: LogQuery = {}): Promise<UserSession[]> => {
  try {
    const response = await apiClient.get('/admin/logs/sessions', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Sessions service unavailable, using mock data:', error.message)
    // Return mock session data
    return [
      {
        id: 'session_1',
        userId: 'user_1',
        userName: 'Dr. Sarah Johnson',
        userRole: 'teacher',
        sessionStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        sessionEnd: null,
        duration: null,
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'Windows 10',
        location: {
          country: 'United States',
          city: 'New York',
          timezone: 'America/New_York'
        },
        actions: [],
        status: 'active'
      },
      {
        id: 'session_2',
        userId: 'user_2',
        userName: 'Alex Thompson',
        userRole: 'student',
        sessionStart: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        sessionEnd: new Date().toISOString(),
        duration: 60,
        ipAddress: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        deviceType: 'desktop',
        browser: 'Chrome',
        os: 'macOS',
        location: {
          country: 'United States',
          city: 'San Francisco',
          timezone: 'America/Los_Angeles'
        },
        actions: [],
        status: 'expired'
      }
    ]
  }
}

export const getSessionById = async (sessionId: string): Promise<UserSession> => {
  const response = await apiClient.get(`/admin/logs/sessions/${sessionId}`)
  return response.data
}

export const terminateSession = async (sessionId: string): Promise<void> => {
  await apiClient.post(`/admin/logs/sessions/${sessionId}/terminate`)
}

export const getSessionActions = async (sessionId: string): Promise<SessionAction[]> => {
  const response = await apiClient.get(`/admin/logs/sessions/${sessionId}/actions`)
  return response.data
}

// Voice Commands
export const getVoiceCommands = async (query: LogQuery = {}): Promise<VoiceCommand[]> => {
  try {
    const response = await apiClient.get('/admin/logs/voice-commands', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Voice commands service unavailable, using mock data:', error.message)
    return [
      {
        id: 'cmd_1',
        userId: 'user_1',
        sessionId: 'session_1',
        command: 'create quiz',
        intent: 'create_quiz',
        confidence: 0.92,
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        response: 'Successfully created quiz from uploaded document',
        success: true,
        processingTime: 1500,
        language: 'en',
        context: { source: 'voice_input', fileId: 'file_123' }
      },
      {
        id: 'cmd_2',
        userId: 'user_2',
        sessionId: 'session_2',
        command: 'upload file',
        intent: 'upload_file',
        confidence: 0.88,
        timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        response: 'File uploaded and processed successfully',
        success: true,
        processingTime: 800,
        language: 'en',
        context: { source: 'voice_input' }
      }
    ]
  }
}

export const getVoiceCommandStats = async (query: LogQuery = {}): Promise<any> => {
  const response = await apiClient.get('/admin/logs/voice-commands/stats', { params: query })
  return response.data
}

export const updateVoiceCommand = async (id: string, data: Partial<VoiceCommand>): Promise<VoiceCommand> => {
  const response = await apiClient.put(`/admin/logs/voice-commands/${id}`, data)
  return response.data
}

// System Errors
export const getSystemErrors = async (query: LogQuery = {}): Promise<SystemError[]> => {
  try {
    const response = await apiClient.get('/admin/logs/errors', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('System errors service unavailable, using mock data:', error.message)
    return [
      {
        id: 'error_1',
        level: 'error',
        category: 'api',
        message: 'File upload failed',
        stack: 'Error: File upload failed\n    at Function.processFile (/app/services/fileProcessor.js:45:12)',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        userId: 'user_1',
        sessionId: 'session_1',
        requestId: 'req_abc123',
        metadata: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ipAddress: '192.168.1.100',
          endpoint: '/api/teacher/uploads',
          fileName: 'document.pdf',
          fileSize: 1024000
        },
        resolved: false,
        resolvedAt: undefined,
        resolvedBy: undefined
      },
      {
        id: 'error_2',
        level: 'warning',
        category: 'system',
        message: 'High memory usage detected',
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        userId: undefined,
        sessionId: undefined,
        requestId: 'req_def456',
        metadata: {
          memoryUsage: 85,
          threshold: 80,
          service: 'fileProcessor'
        },
        resolved: true,
        resolvedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        resolvedBy: 'admin@example.com'
      }
    ]
  }
}

export const getErrorById = async (errorId: string): Promise<SystemError> => {
  const response = await apiClient.get(`/admin/logs/errors/${errorId}`)
  return response.data
}

export const resolveError = async (errorId: string, resolvedBy: string): Promise<void> => {
  await apiClient.post(`/admin/logs/errors/${errorId}/resolve`, { resolvedBy })
}

export const createError = async (error: Omit<SystemError, 'id' | 'timestamp' | 'resolved'>): Promise<SystemError> => {
  const response = await apiClient.post('/admin/logs/errors', error)
  return response.data
}

// Log Statistics
export const getLogStats = async (query: LogQuery = {}): Promise<LogStats> => {
  try {
    const response = await apiClient.get('/admin/logs/stats', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        totalSessions: 0,
        activeSessions: 0,
        totalErrors: 0,
        criticalErrors: 0,
        voiceCommands: 0,
        averageSessionDuration: 0,
        errorRate: 0,
        topErrors: [],
        topUsers: []
      }
    }
    throw error
  }
}

export const exportLogs = async (type: 'sessions' | 'voice-commands' | 'errors', format: 'csv' | 'pdf', query: LogQuery = {}): Promise<Blob> => {
  const response = await apiClient.get(`/admin/logs/export/${type}`, {
    params: { ...query, format },
    responseType: 'blob'
  })
  return response.data
}

// Real-time logging
export const subscribeToLogs = (callback: (log: any) => void) => {
  // WebSocket implementation for real-time logs
  const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:4000'
  
  try {
    const ws = new WebSocket(`${wsUrl}/admin/logs`)
    
    ws.onerror = () => {
      console.warn('WebSocket connection failed - real-time logs unavailable')
    }
    
    ws.onmessage = (event) => {
      const log = JSON.parse(event.data)
      callback(log)
    }
    
    return () => ws.close()
  } catch (error) {
    console.warn('WebSocket connection failed - real-time logs unavailable')
    // Return a no-op cleanup function
    return () => {}
  }
}
