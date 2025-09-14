import { apiClient } from './apiClient'

export interface AnalyticsMetric {
  id: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  change: number
  changePercent: number
  timestamp: string
  category: 'users' | 'performance' | 'errors' | 'voice' | 'system'
}

export interface UserAnalytics {
  totalUsers: number
  activeUsers: number
  newUsers: number
  returningUsers: number
  userGrowth: Array<{ date: string; count: number }>
  userRetention: Array<{ period: string; rate: number }>
  userDistribution: Array<{ role: string; count: number }>
  topUsers: Array<{ userId: string; userName: string; sessions: number; lastActive: string }>
}

export interface VoiceAnalytics {
  totalCommands: number
  successfulCommands: number
  failedCommands: number
  averageConfidence: number
  averageProcessingTime: number
  topCommands: Array<{ command: string; count: number; successRate: number }>
  commandTrends: Array<{ date: string; count: number; successRate: number }>
  languageDistribution: Array<{ language: string; count: number }>
  categoryDistribution: Array<{ category: string; count: number }>
}

export interface PerformanceAnalytics {
  averageResponseTime: number
  systemUptime: number
  errorRate: number
  throughput: number
  memoryUsage: number
  cpuUsage: number
  databasePerformance: {
    averageQueryTime: number
    slowQueries: number
    connectionPool: number
  }
  apiPerformance: Array<{ endpoint: string; averageTime: number; errorRate: number }>
}

export interface ErrorAnalytics {
  totalErrors: number
  criticalErrors: number
  errorRate: number
  errorTrends: Array<{ date: string; count: number; level: string }>
  topErrors: Array<{ error: string; count: number; level: string; lastOccurred: string }>
  errorCategories: Array<{ category: string; count: number; percentage: number }>
  resolutionTime: Array<{ level: string; averageTime: number }>
}

export interface SystemAnalytics {
  systemHealth: 'healthy' | 'warning' | 'critical'
  uptime: number
  lastRestart: string
  version: string
  environment: string
  resources: {
    memory: { used: number; total: number; percentage: number }
    disk: { used: number; total: number; percentage: number }
    cpu: { usage: number; cores: number }
  }
  services: Array<{ name: string; status: 'running' | 'stopped' | 'error'; uptime: number }>
}

export interface AnalyticsQuery {
  startDate: string
  endDate: string
  granularity?: 'hour' | 'day' | 'week' | 'month'
  filters?: Record<string, any>
  groupBy?: string[]
}

export interface RealTimeMetrics {
  activeUsers: number
  currentSessions: number
  requestsPerMinute: number
  errorRate: number
  averageResponseTime: number
  systemLoad: number
  memoryUsage: number
  timestamp: string
}

// Real-time Analytics
export const getRealTimeMetrics = async (): Promise<RealTimeMetrics> => {
  try {
    const response = await apiClient.get('/admin/analytics/real-time')
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        activeUsers: 0,
        currentSessions: 0,
        requestsPerMinute: 0,
        errorRate: 0,
        averageResponseTime: 0,
        systemLoad: 0,
        memoryUsage: 0,
        timestamp: new Date().toISOString()
      }
    }
    throw error
  }
}

export const subscribeToRealTimeMetrics = (callback: (metrics: RealTimeMetrics) => void) => {
  // Use polling instead of WebSocket for now
  const interval = setInterval(async () => {
    try {
      const metrics = await getRealTimeMetrics()
      callback(metrics)
    } catch (error) {
      console.warn('Failed to fetch real-time metrics:', error)
    }
  }, 5000) // Poll every 5 seconds
  
  // Return cleanup function
  return () => clearInterval(interval)
}

// User Analytics
export const getUserAnalytics = async (query: AnalyticsQuery): Promise<UserAnalytics> => {
  try {
    const response = await apiClient.get('/admin/analytics/users', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Analytics service unavailable, using mock data:', error.message)
    // Return mock data when server is not available
    return {
      totalUsers: 25,
      activeUsers: 18,
      newUsers: 5,
      returningUsers: 13,
      userGrowth: [
        { date: '2025-01-07', count: 3 },
        { date: '2025-01-08', count: 5 },
        { date: '2025-01-09', count: 2 },
        { date: '2025-01-10', count: 4 },
        { date: '2025-01-11', count: 6 },
        { date: '2025-01-12', count: 3 },
        { date: '2025-01-13', count: 2 }
      ],
      userRetention: [
        { period: 'Day 1', rate: 0.85 },
        { period: 'Day 7', rate: 0.65 },
        { period: 'Day 30', rate: 0.45 }
      ],
      userDistribution: [
        { role: 'teacher', count: 8 },
        { role: 'student', count: 15 },
        { role: 'admin', count: 2 }
      ],
      topUsers: [
        { userId: '1', userName: 'Dr. Sarah Johnson', sessions: 12, lastActive: new Date().toISOString() },
        { userId: '2', userName: 'Prof. Michael Chen', sessions: 8, lastActive: new Date().toISOString() }
      ]
    }
  }
}

export const getUserGrowth = async (query: AnalyticsQuery): Promise<Array<{ date: string; count: number }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/users/growth', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export const getUserRetention = async (query: AnalyticsQuery): Promise<Array<{ period: string; rate: number }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/users/retention', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

// Voice Analytics
export const getVoiceAnalytics = async (query: AnalyticsQuery): Promise<VoiceAnalytics> => {
  try {
    const response = await apiClient.get('/admin/analytics/voice', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Voice analytics unavailable, using mock data:', error.message)
    return {
      totalCommands: 245,
      successfulCommands: 218,
      failedCommands: 27,
      averageConfidence: 0.87,
      averageProcessingTime: 1250,
      topCommands: [
        { command: 'create quiz', count: 45, successRate: 0.92 },
        { command: 'upload file', count: 38, successRate: 0.88 },
        { command: 'analyze document', count: 32, successRate: 0.85 }
      ],
      commandTrends: [
        { date: '2025-01-07', count: 35, successRate: 0.89 },
        { date: '2025-01-08', count: 42, successRate: 0.91 },
        { date: '2025-01-09', count: 38, successRate: 0.87 }
      ],
      languageDistribution: [
        { language: 'English', count: 85 },
        { language: 'Spanish', count: 10 },
        { language: 'French', count: 5 }
      ],
      categoryDistribution: [
        { category: 'Content Creation', count: 40 },
        { category: 'File Management', count: 30 },
        { category: 'Quiz Generation', count: 20 },
        { category: 'Analysis', count: 10 }
      ]
    }
  }
}

export const getVoiceCommandTrends = async (query: AnalyticsQuery): Promise<Array<{ date: string; count: number; successRate: number }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/voice/trends', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export const getTopVoiceCommands = async (query: AnalyticsQuery): Promise<Array<{ command: string; count: number; successRate: number }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/voice/top-commands', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

// Performance Analytics
export const getPerformanceAnalytics = async (query: AnalyticsQuery): Promise<PerformanceAnalytics> => {
  try {
    const response = await apiClient.get('/admin/analytics/performance', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Performance analytics unavailable, using mock data:', error.message)
    return {
      averageResponseTime: 145,
      systemUptime: 99.7,
      errorRate: 1.2,
      throughput: 68,
      memoryUsage: 72,
      cpuUsage: 45,
      databasePerformance: {
        averageQueryTime: 28,
        slowQueries: 3,
        connectionPool: 85
      },
      apiPerformance: [
        { endpoint: '/api/teacher/uploads', averageTime: 150, errorRate: 0.5 },
        { endpoint: '/api/teacher/generate-quiz', averageTime: 2000, errorRate: 2.1 },
        { endpoint: '/api/student/quizzes', averageTime: 80, errorRate: 0.8 },
        { endpoint: '/api/users', averageTime: 60, errorRate: 0.2 },
        { endpoint: '/api/institutions/me', averageTime: 45, errorRate: 0.1 }
      ]
    }
  }
}

export const getSystemHealth = async (): Promise<SystemAnalytics> => {
  try {
    const response = await apiClient.get('/admin/analytics/system')
    return response.data
  } catch (error: any) {
    console.warn('System health unavailable, using mock data:', error.message)
    return {
      systemHealth: 'healthy',
      uptime: 99.5,
      lastRestart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      version: '1.0.0',
      environment: 'development',
      resources: {
        memory: { used: 65, total: 100, percentage: 65 },
        disk: { used: 45, total: 100, percentage: 45 },
        cpu: { usage: 42, cores: 8 }
      },
      services: [
        { name: 'API Server', status: 'running', uptime: 99.5 },
        { name: 'Database', status: 'running', uptime: 99.8 },
        { name: 'AI Service', status: 'running', uptime: 98.9 },
        { name: 'File Processor', status: 'running', uptime: 99.2 },
        { name: 'WebSocket', status: 'running', uptime: 99.1 }
      ]
    }
  }
}

export const getApiPerformance = async (query: AnalyticsQuery): Promise<Array<{ endpoint: string; averageTime: number; errorRate: number }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/performance/api', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

// Error Analytics
export const getErrorAnalytics = async (query: AnalyticsQuery): Promise<ErrorAnalytics> => {
  try {
    const response = await apiClient.get('/admin/analytics/errors', { params: query })
    return response.data
  } catch (error: any) {
    console.warn('Error analytics unavailable, using mock data:', error.message)
    return {
      totalErrors: 67,
      criticalErrors: 5,
      errorRate: 2.1,
      errorTrends: [
        { date: '2025-01-07', count: 8, level: 'error' },
        { date: '2025-01-08', count: 12, level: 'warning' },
        { date: '2025-01-09', count: 5, level: 'critical' }
      ],
      topErrors: [
        { error: 'File upload failed', count: 15, level: 'error', lastOccurred: new Date().toISOString() },
        { error: 'AI service timeout', count: 12, level: 'warning', lastOccurred: new Date().toISOString() },
        { error: 'Database connection lost', count: 8, level: 'critical', lastOccurred: new Date().toISOString() }
      ],
      errorCategories: [
        { category: 'File Processing', count: 25, percentage: 40 },
        { category: 'AI Services', count: 20, percentage: 32 },
        { category: 'Database', count: 10, percentage: 16 },
        { category: 'Authentication', count: 7, percentage: 12 }
      ],
      resolutionTime: [
        { level: 'critical', averageTime: 5 },
        { level: 'error', averageTime: 15 },
        { level: 'warning', averageTime: 30 }
      ]
    }
  }
}

export const getErrorTrends = async (query: AnalyticsQuery): Promise<Array<{ date: string; count: number; level: string }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/errors/trends', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export const getTopErrors = async (query: AnalyticsQuery): Promise<Array<{ error: string; count: number; level: string; lastOccurred: string }>> => {
  try {
    const response = await apiClient.get('/admin/analytics/errors/top', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

// Custom Analytics
export const getCustomMetrics = async (query: AnalyticsQuery): Promise<AnalyticsMetric[]> => {
  try {
    const response = await apiClient.get('/admin/analytics/custom', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return []
    }
    throw error
  }
}

export const createCustomMetric = async (metric: Omit<AnalyticsMetric, 'id' | 'timestamp'>): Promise<AnalyticsMetric> => {
  try {
    const response = await apiClient.post('/admin/analytics/custom', metric)
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        ...metric,
        id: 'mock-id',
        timestamp: new Date().toISOString()
      }
    }
    throw error
  }
}

// Reports and Exports
export const generateAnalyticsReport = async (
  type: 'users' | 'voice' | 'performance' | 'errors' | 'system' | 'comprehensive',
  format: 'pdf' | 'csv' | 'excel',
  query: AnalyticsQuery
): Promise<Blob> => {
  const response = await apiClient.get(`/admin/analytics/reports/${type}`, {
    params: { ...query, format },
    responseType: 'blob'
  })
  return response.data
}

export const scheduleReport = async (report: {
  name: string
  type: string
  format: string
  schedule: string
  recipients: string[]
  query: AnalyticsQuery
}): Promise<{ id: string; nextRun: string }> => {
  const response = await apiClient.post('/admin/analytics/reports/schedule', report)
  return response.data
}

export const getScheduledReports = async (): Promise<Array<{
  id: string
  name: string
  type: string
  schedule: string
  nextRun: string
  lastRun?: string
  status: 'active' | 'paused' | 'error'
}>> => {
  const response = await apiClient.get('/admin/analytics/reports/scheduled')
  return response.data
}

// Analytics Configuration
export const getAnalyticsConfig = async (): Promise<{
  retentionPeriod: number
  realTimeEnabled: boolean
  alertThresholds: Record<string, number>
  autoReports: string[]
}> => {
  const response = await apiClient.get('/admin/analytics/config')
  return response.data
}

export const updateAnalyticsConfig = async (config: Partial<{
  retentionPeriod: number
  realTimeEnabled: boolean
  alertThresholds: Record<string, number>
  autoReports: string[]
}>): Promise<void> => {
  await apiClient.put('/admin/analytics/config', config)
}
