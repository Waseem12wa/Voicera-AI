import api from './apiClient'

export interface TranslationRequest {
  text: string
  fromLanguage: string
  toLanguage: string
  contentType?: 'general' | 'educational' | 'technical'
}

export interface TranslationResponse {
  translatedText: string
  confidence: number
  detectedLanguage?: string
  originalText: string
  fromLanguage: string
  toLanguage: string
}

export interface LanguageInfo {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

// Translate text using OpenAI
export const translateText = async (request: TranslationRequest): Promise<TranslationResponse> => {
  try {
    const response = await api.post('/translate/text', request)
    return response.data
  } catch (error: any) {
    console.error('Translation error:', error)
    
    // Check if it's a network error (server not running)
    if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      throw new Error('Translation service is not available. Please ensure the server is running.')
    }
    
    // Check if it's a server error
    if (error.response?.status >= 500) {
      throw new Error('Translation service is experiencing issues. Please try again later.')
    }
    
    throw new Error(error.response?.data?.error || 'Failed to translate text')
  }
}

// Translate educational content with context
export const translateEducationalContent = async (
  content: string,
  fromLanguage: string,
  toLanguage: string,
  context?: string
): Promise<TranslationResponse> => {
  try {
    const response = await api.post('/translate/content', {
      content,
      fromLanguage,
      toLanguage,
      context,
      contentType: 'educational'
    })
    return response.data
  } catch (error) {
    console.error('Educational translation error:', error)
    throw new Error('Failed to translate educational content')
  }
}

// Get supported languages
export const getSupportedLanguages = async (): Promise<LanguageInfo[]> => {
  try {
    const response = await api.get('/translate/languages')
    return response.data
  } catch (error) {
    console.error('Error fetching languages:', error)
    // Return fallback languages if API fails
    return getFallbackLanguages()
  }
}

// Batch translate multiple texts
export const batchTranslate = async (
  texts: string[],
  fromLanguage: string,
  toLanguage: string
): Promise<TranslationResponse[]> => {
  try {
    const response = await api.post('/translate/batch', {
      texts,
      fromLanguage,
      toLanguage
    })
    return response.data
  } catch (error) {
    console.error('Batch translation error:', error)
    throw new Error('Failed to translate multiple texts')
  }
}

// Fallback languages if API is not available
export const getFallbackLanguages = (): LanguageInfo[] => [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false }
]

// Detect language of text
export const detectLanguage = async (text: string): Promise<string> => {
  try {
    const response = await api.post('/translate/detect', { text })
    return response.data.language
  } catch (error) {
    console.error('Language detection error:', error)
    return 'en' // Default to English
  }
}
