import { apiClient } from './apiClient'

export interface EmailAlert {
  id: string
  name: string
  description: string
  type: 'error' | 'performance' | 'security' | 'system' | 'user' | 'voice' | 'custom'
  condition: AlertCondition
  recipients: string[]
  template: string
  isActive: boolean
  cooldown: number // minutes
  lastTriggered?: string
  triggerCount: number
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface AlertCondition {
  metric: string
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'contains' | 'not_contains'
  threshold: number | string
  duration?: number // minutes
  aggregation?: 'sum' | 'avg' | 'max' | 'min' | 'count'
  timeWindow?: number // minutes
}

export interface AlertTemplate {
  id: string
  name: string
  type: string
  subject: string
  body: string
  variables: string[]
  isHtml: boolean
  createdAt: string
  updatedAt: string
}

export interface AlertHistory {
  id: string
  alertId: string
  alertName: string
  triggeredAt: string
  resolvedAt?: string
  status: 'triggered' | 'resolved' | 'acknowledged'
  value: number | string
  threshold: number | string
  message: string
  recipients: string[]
  acknowledgedBy?: string
  acknowledgedAt?: string
  resolution?: string
}

export interface EmailConfig {
  smtp: {
    host: string
    port: number
    secure: boolean
    username: string
    password: string
  }
  from: {
    name: string
    email: string
  }
  replyTo?: string
  templates: {
    default: string
    error: string
    performance: string
    security: string
  }
}

export interface AlertStats {
  totalAlerts: number
  activeAlerts: number
  triggeredToday: number
  resolvedToday: number
  averageResolutionTime: number
  topAlerts: Array<{ alert: string; count: number }>
  alertTrends: Array<{ date: string; triggered: number; resolved: number }>
}

// Email Alerts
export const getEmailAlerts = async (query: {
  type?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<EmailAlert[]> => {
  const response = await apiClient.get('/admin/alerts/email', { params: query })
  return response.data
}

export const getEmailAlertById = async (id: string): Promise<EmailAlert> => {
  const response = await apiClient.get(`/admin/alerts/email/${id}`)
  return response.data
}

export const createEmailAlert = async (alert: Omit<EmailAlert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>): Promise<EmailAlert> => {
  const response = await apiClient.post('/admin/alerts/email', alert)
  return response.data
}

export const updateEmailAlert = async (id: string, alert: Partial<EmailAlert>): Promise<EmailAlert> => {
  const response = await apiClient.put(`/admin/alerts/email/${id}`, alert)
  return response.data
}

export const deleteEmailAlert = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/alerts/email/${id}`)
}

export const toggleEmailAlert = async (id: string): Promise<EmailAlert> => {
  const response = await apiClient.post(`/admin/alerts/email/${id}/toggle`)
  return response.data
}

export const testEmailAlert = async (id: string, testRecipients?: string[]): Promise<{
  success: boolean
  message: string
  sentTo: string[]
}> => {
  const response = await apiClient.post(`/admin/alerts/email/${id}/test`, { testRecipients })
  return response.data
}

// Alert Templates
export const getAlertTemplates = async (): Promise<AlertTemplate[]> => {
  const response = await apiClient.get('/admin/alerts/templates')
  return response.data
}

export const getAlertTemplateById = async (id: string): Promise<AlertTemplate> => {
  const response = await apiClient.get(`/admin/alerts/templates/${id}`)
  return response.data
}

export const createAlertTemplate = async (template: Omit<AlertTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<AlertTemplate> => {
  const response = await apiClient.post('/admin/alerts/templates', template)
  return response.data
}

export const updateAlertTemplate = async (id: string, template: Partial<AlertTemplate>): Promise<AlertTemplate> => {
  const response = await apiClient.put(`/admin/alerts/templates/${id}`, template)
  return response.data
}

export const deleteAlertTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/alerts/templates/${id}`)
}

// Alert History
export const getAlertHistory = async (query: {
  alertId?: string
  status?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
} = {}): Promise<AlertHistory[]> => {
  const response = await apiClient.get('/admin/alerts/history', { params: query })
  return response.data
}

export const getAlertHistoryById = async (id: string): Promise<AlertHistory> => {
  const response = await apiClient.get(`/admin/alerts/history/${id}`)
  return response.data
}

export const acknowledgeAlert = async (id: string, acknowledgedBy: string, resolution?: string): Promise<AlertHistory> => {
  const response = await apiClient.post(`/admin/alerts/history/${id}/acknowledge`, {
    acknowledgedBy,
    resolution
  })
  return response.data
}

export const resolveAlert = async (id: string, resolvedBy: string, resolution: string): Promise<AlertHistory> => {
  const response = await apiClient.post(`/admin/alerts/history/${id}/resolve`, {
    resolvedBy,
    resolution
  })
  return response.data
}

// Email Configuration
export const getEmailConfig = async (): Promise<EmailConfig> => {
  const response = await apiClient.get('/admin/alerts/email/config')
  return response.data
}

export const updateEmailConfig = async (config: Partial<EmailConfig>): Promise<EmailConfig> => {
  const response = await apiClient.put('/admin/alerts/email/config', config)
  return response.data
}

export const testEmailConfig = async (testRecipients: string[]): Promise<{
  success: boolean
  message: string
  errors?: string[]
}> => {
  const response = await apiClient.post('/admin/alerts/email/config/test', { testRecipients })
  return response.data
}

// Alert Statistics
export const getAlertStats = async (query: {
  startDate?: string
  endDate?: string
} = {}): Promise<AlertStats> => {
  try {
    const response = await apiClient.get('/admin/alerts/stats', { params: query })
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        totalAlerts: 0,
        activeAlerts: 0,
        triggeredToday: 0,
        resolvedToday: 0,
        averageResolutionTime: 0,
        topAlerts: [],
        alertTrends: []
      }
    }
    throw error
  }
}

// Predefined Alert Types
export const PREDEFINED_ALERTS = {
  HIGH_ERROR_RATE: {
    name: 'High Error Rate',
    description: 'Alert when error rate exceeds threshold',
    type: 'error' as const,
    condition: {
      metric: 'error_rate',
      operator: 'greater_than' as const,
      threshold: 5,
      duration: 5
    }
  },
  LOW_RESPONSE_TIME: {
    name: 'Low Response Time',
    description: 'Alert when average response time is too high',
    type: 'performance' as const,
    condition: {
      metric: 'avg_response_time',
      operator: 'greater_than' as const,
      threshold: 2000,
      duration: 10
    }
  },
  HIGH_CPU_USAGE: {
    name: 'High CPU Usage',
    description: 'Alert when CPU usage exceeds threshold',
    type: 'system' as const,
    condition: {
      metric: 'cpu_usage',
      operator: 'greater_than' as const,
      threshold: 80,
      duration: 5
    }
  },
  HIGH_MEMORY_USAGE: {
    name: 'High Memory Usage',
    description: 'Alert when memory usage exceeds threshold',
    type: 'system' as const,
    condition: {
      metric: 'memory_usage',
      operator: 'greater_than' as const,
      threshold: 85,
      duration: 5
    }
  },
  FAILED_LOGIN_ATTEMPTS: {
    name: 'Failed Login Attempts',
    description: 'Alert on multiple failed login attempts',
    type: 'security' as const,
    condition: {
      metric: 'failed_logins',
      operator: 'greater_than' as const,
      threshold: 5,
      duration: 1
    }
  },
  VOICE_COMMAND_FAILURES: {
    name: 'Voice Command Failures',
    description: 'Alert when voice command failure rate is high',
    type: 'voice' as const,
    condition: {
      metric: 'voice_command_failure_rate',
      operator: 'greater_than' as const,
      threshold: 20,
      duration: 10
    }
  }
}

// Bulk Operations
export const bulkCreateAlerts = async (alerts: Array<Omit<EmailAlert, 'id' | 'createdAt' | 'updatedAt' | 'triggerCount'>>): Promise<EmailAlert[]> => {
  const response = await apiClient.post('/admin/alerts/email/bulk', { alerts })
  return response.data
}

export const bulkUpdateAlerts = async (updates: Array<{ id: string; updates: Partial<EmailAlert> }>): Promise<EmailAlert[]> => {
  const response = await apiClient.put('/admin/alerts/email/bulk', { updates })
  return response.data
}

export const bulkDeleteAlerts = async (ids: string[]): Promise<void> => {
  await apiClient.delete('/admin/alerts/email/bulk', { data: { ids } })
}

// Export/Import
export const exportAlerts = async (format: 'json' | 'csv', query: {
  type?: string
  isActive?: boolean
} = {}): Promise<Blob> => {
  const response = await apiClient.get('/admin/alerts/export', {
    params: { ...query, format },
    responseType: 'blob'
  })
  return response.data
}

export const importAlerts = async (file: File, options?: {
  overwrite?: boolean
  activate?: boolean
}): Promise<{ imported: number; errors: string[] }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (options) {
    formData.append('options', JSON.stringify(options))
  }
  
  const response = await apiClient.post('/admin/alerts/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}
