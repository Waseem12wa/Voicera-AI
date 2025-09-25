import api from './apiClient'

// Translation services
export const translateText = async (text: string, fromLanguage: string = 'en', toLanguage: string = 'en') => {
  const response = await api.post('/translate/text', {
    text,
    fromLanguage,
    toLanguage
  })
  return response.data
}

export const translateContent = async (content: string, fromLanguage: string = 'en', toLanguage: string = 'en', contentType: string = 'general') => {
  const response = await api.post('/translate/content', {
    content,
    fromLanguage,
    toLanguage,
    contentType
  })
  return response.data
}

export const translateTranscript = async (transcript: string, fromLanguage: string = 'en', toLanguage: string = 'en', context: any = {}) => {
  const response = await api.post('/translate/transcript', {
    transcript,
    fromLanguage,
    toLanguage,
    context
  })
  return response.data
}

export const getSupportedLanguages = async () => {
  const response = await api.get('/translate/languages')
  return response.data
}

export const batchTranslate = async (texts: Array<{content: string, contentType?: string}>, fromLanguage: string = 'en', toLanguage: string = 'en') => {
  const response = await api.post('/translate/batch', {
    texts,
    fromLanguage,
    toLanguage
  })
  return response.data
}

// File translation services
export const translateFile = async (fileId: string, fromLanguage: string = 'en', toLanguage: string = 'en') => {
  const response = await api.post(`/files/${fileId}/translate`, {
    fromLanguage,
    toLanguage
  })
  return response.data
}

export const getFileTranslations = async (fileId: string) => {
  const response = await api.get(`/files/${fileId}/translations`)
  return response.data
}

export const downloadTranslatedFile = async (fileId: string, language: string) => {
  const response = await api.get(`/files/${fileId}/download`, {
    params: { language },
    responseType: 'blob'
  })
  return response.data
}

// Voice services
export const processVoiceCommand = async (command: string, language: string = 'en', context: any = {}) => {
  const response = await api.post('/voice/multilingual', {
    command,
    language,
    context
  })
  return response.data
}

export const transcribeAudio = async (audio: string, language: string = 'en', mimeType: string = 'audio/webm') => {
  const response = await api.post('/voice/transcribe', {
    audio,
    language,
    mimeType
  })
  return response.data
}

export const getVoiceSuggestions = async (language: string, userId?: string, limit: number = 5) => {
  const response = await api.get(`/voice/suggestions/${language}`, {
    params: { userId, limit }
  })
  return response.data
}

// Language detection
export const detectLanguage = async (text: string) => {
  const response = await api.post('/voice/detect-language', { text })
  return response.data
}

// Multilingual content management
export const createMultilingualContent = async (content: {
  title: string
  content: string
  originalLanguage: string
  contentType: string
  metadata?: any
}) => {
  const response = await api.post('/multilingual/content', content)
  return response.data
}

export const getMultilingualContent = async (contentId: string, language?: string) => {
  const response = await api.get(`/multilingual/content/${contentId}`, {
    params: { language }
  })
  return response.data
}

export const updateMultilingualContent = async (contentId: string, updates: {
  translations?: Array<{
    language: string
    title?: string
    content?: string
  }>
  metadata?: any
}) => {
  const response = await api.put(`/multilingual/content/${contentId}`, updates)
  return response.data
}

// Course multilingual support
export const translateCourseContent = async (courseId: string, fromLanguage: string = 'en', toLanguage: string = 'en') => {
  const response = await api.post(`/courses/${courseId}/translate`, {
    fromLanguage,
    toLanguage
  })
  return response.data
}

export const getCourseTranslations = async (courseId: string) => {
  const response = await api.get(`/courses/${courseId}/translations`)
  return response.data
}

// Quiz multilingual support
export const translateQuiz = async (quizId: string, fromLanguage: string = 'en', toLanguage: string = 'en') => {
  const response = await api.post(`/quizzes/${quizId}/translate`, {
    fromLanguage,
    toLanguage
  })
  return response.data
}

export const getQuizTranslations = async (quizId: string) => {
  const response = await api.get(`/quizzes/${quizId}/translations`)
  return response.data
}

// User language preferences
export const updateUserLanguagePreference = async (language: string, preferences: {
  interfaceLanguage?: string
  contentLanguage?: string
  voiceLanguage?: string
  autoTranslate?: boolean
}) => {
  const response = await api.put('/user/language-preferences', {
    language,
    preferences
  })
  return response.data
}

export const getUserLanguagePreferences = async () => {
  const response = await api.get('/user/language-preferences')
  return response.data
}

// Analytics for multilingual usage
export const getMultilingualAnalytics = async (timeframe: string = '30d') => {
  const response = await api.get('/analytics/multilingual', {
    params: { timeframe }
  })
  return response.data
}

// Language-specific content recommendations
export const getLanguageSpecificRecommendations = async (language: string, userId?: string) => {
  const response = await api.get('/recommendations/language-specific', {
    params: { language, userId }
  })
  return response.data
}

// Export utility functions
export const formatLanguageName = (code: string): string => {
  const languageMap: { [key: string]: string } = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'ur': 'Urdu',
    'bn': 'Bengali',
    'tr': 'Turkish',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish'
  }
  return languageMap[code] || code
}

export const getLanguageFlag = (code: string): string => {
  const flagMap: { [key: string]: string } = {
    'en': '🇺🇸',
    'es': '🇪🇸',
    'fr': '🇫🇷',
    'de': '🇩🇪',
    'it': '🇮🇹',
    'pt': '🇵🇹',
    'ru': '🇷🇺',
    'ja': '🇯🇵',
    'ko': '🇰🇷',
    'zh': '🇨🇳',
    'ar': '🇸🇦',
    'hi': '🇮🇳',
    'ur': '🇵🇰',
    'bn': '🇧🇩',
    'tr': '🇹🇷',
    'nl': '🇳🇱',
    'sv': '🇸🇪',
    'no': '🇳🇴',
    'da': '🇩🇰',
    'fi': '🇫🇮'
  }
  return flagMap[code] || '🌐'
}

export const isRTL = (code: string): boolean => {
  const rtlLanguages = ['ar', 'ur', 'he', 'fa']
  return rtlLanguages.includes(code)
}
