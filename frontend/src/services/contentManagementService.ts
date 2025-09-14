import { apiClient } from './apiClient'

export interface AppText {
  id: string
  key: string
  value: string
  language: string
  category: 'ui' | 'messages' | 'errors' | 'help' | 'voice' | 'tutorials'
  description: string
  isHtml: boolean
  variables?: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface AppPage {
  id: string
  name: string
  title: string
  description: string
  content: string
  language: string
  route: string
  isActive: boolean
  isPublic: boolean
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string[]
  template: string
  components: PageComponent[]
  createdAt: string
  updatedAt: string
  updatedBy: string
  publishedAt?: string
  publishedBy?: string
}

export interface PageComponent {
  id: string
  type: 'text' | 'image' | 'video' | 'form' | 'chart' | 'voice' | 'interactive'
  content: string
  props: Record<string, any>
  order: number
  isVisible: boolean
  conditions?: ComponentCondition[]
}

export interface ComponentCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than'
  value: any
}

export interface VoiceCommandTemplate {
  id: string
  name: string
  description: string
  command: string
  intent: string
  response: string
  category: 'navigation' | 'action' | 'query' | 'help' | 'tutorial'
  language: string
  isActive: boolean
  requiresAuth: boolean
  permissions?: string[]
  variables?: string[]
  examples: string[]
  createdAt: string
  updatedAt: string
  updatedBy: string
}

export interface ContentStats {
  totalTexts: number
  totalPages: number
  totalVoiceCommands: number
  languages: string[]
  categories: Array<{ category: string; count: number }>
  recentUpdates: Array<{
    type: 'text' | 'page' | 'voice-command'
    id: string
    name: string
    updatedAt: string
    updatedBy: string
  }>
}

// App Text Management
export const getAppTexts = async (query: {
  language?: string
  category?: string
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<AppText[]> => {
  const response = await apiClient.get('/admin/content/texts', { params: query })
  return response.data
}

export const getAppTextById = async (id: string): Promise<AppText> => {
  const response = await apiClient.get(`/admin/content/texts/${id}`)
  return response.data
}

export const createAppText = async (text: Omit<AppText, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppText> => {
  const response = await apiClient.post('/admin/content/texts', text)
  return response.data
}

export const updateAppText = async (id: string, text: Partial<AppText>): Promise<AppText> => {
  const response = await apiClient.put(`/admin/content/texts/${id}`, text)
  return response.data
}

export const deleteAppText = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/content/texts/${id}`)
}

export const bulkUpdateAppTexts = async (updates: Array<{ id: string; value: string }>): Promise<AppText[]> => {
  const response = await apiClient.post('/admin/content/texts/bulk-update', { updates })
  return response.data
}

// App Pages Management
export const getAppPages = async (query: {
  language?: string
  isActive?: boolean
  isPublic?: boolean
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<AppPage[]> => {
  const response = await apiClient.get('/admin/content/pages', { params: query })
  return response.data
}

export const getAppPageById = async (id: string): Promise<AppPage> => {
  const response = await apiClient.get(`/admin/content/pages/${id}`)
  return response.data
}

export const createAppPage = async (page: Omit<AppPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<AppPage> => {
  const response = await apiClient.post('/admin/content/pages', page)
  return response.data
}

export const updateAppPage = async (id: string, page: Partial<AppPage>): Promise<AppPage> => {
  const response = await apiClient.put(`/admin/content/pages/${id}`, page)
  return response.data
}

export const deleteAppPage = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/content/pages/${id}`)
}

export const publishPage = async (id: string): Promise<AppPage> => {
  const response = await apiClient.post(`/admin/content/pages/${id}/publish`)
  return response.data
}

export const unpublishPage = async (id: string): Promise<AppPage> => {
  const response = await apiClient.post(`/admin/content/pages/${id}/unpublish`)
  return response.data
}

export const duplicatePage = async (id: string, newName: string): Promise<AppPage> => {
  const response = await apiClient.post(`/admin/content/pages/${id}/duplicate`, { newName })
  return response.data
}

// Voice Command Templates
export const getVoiceCommandTemplates = async (query: {
  category?: string
  language?: string
  isActive?: boolean
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<VoiceCommandTemplate[]> => {
  const response = await apiClient.get('/admin/content/voice-commands', { params: query })
  return response.data
}

export const getVoiceCommandTemplateById = async (id: string): Promise<VoiceCommandTemplate> => {
  const response = await apiClient.get(`/admin/content/voice-commands/${id}`)
  return response.data
}

export const createVoiceCommandTemplate = async (template: Omit<VoiceCommandTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<VoiceCommandTemplate> => {
  const response = await apiClient.post('/admin/content/voice-commands', template)
  return response.data
}

export const updateVoiceCommandTemplate = async (id: string, template: Partial<VoiceCommandTemplate>): Promise<VoiceCommandTemplate> => {
  const response = await apiClient.put(`/admin/content/voice-commands/${id}`, template)
  return response.data
}

export const deleteVoiceCommandTemplate = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/content/voice-commands/${id}`)
}

export const testVoiceCommand = async (command: string, context?: Record<string, any>): Promise<{
  success: boolean
  response: string
  confidence: number
  processingTime: number
}> => {
  const response = await apiClient.post('/admin/content/voice-commands/test', {
    command,
    context
  })
  return response.data
}

// Content Statistics
export const getContentStats = async (): Promise<ContentStats> => {
  try {
    const response = await apiClient.get('/admin/content/stats')
    return response.data
  } catch (error: any) {
    // Return mock data when API is not available
    if (error.response?.status === 404) {
      return {
        totalTexts: 0,
        totalPages: 0,
        totalVoiceCommands: 0,
        languages: [],
        categories: [],
        recentUpdates: []
      }
    }
    throw error
  }
}

// Export/Import
export const exportContent = async (type: 'texts' | 'pages' | 'voice-commands', format: 'json' | 'csv', language?: string): Promise<Blob> => {
  const response = await apiClient.get(`/admin/content/export/${type}`, {
    params: { format, language },
    responseType: 'blob'
  })
  return response.data
}

export const importContent = async (type: 'texts' | 'pages' | 'voice-commands', file: File, options?: {
  overwrite?: boolean
  language?: string
}): Promise<{ imported: number; errors: string[] }> => {
  const formData = new FormData()
  formData.append('file', file)
  if (options) {
    formData.append('options', JSON.stringify(options))
  }
  
  const response = await apiClient.post(`/admin/content/import/${type}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// Content validation
export const validateContent = async (type: 'text' | 'page' | 'voice-command', content: any): Promise<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> => {
  const response = await apiClient.post(`/admin/content/validate/${type}`, content)
  return response.data
}
