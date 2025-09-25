import { Groq } from 'groq-sdk'
import winston from 'winston'

export class MultilingualProcessor {
  constructor(cacheService, metricsService) {
    this.cacheService = cacheService
    this.metricsService = metricsService
    
    // Initialize Groq with fallback for missing API key
    const apiKey = process.env.GROQ_API_KEY || 'demo-key'
    this.groq = new Groq({
      apiKey: apiKey
    })
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'multilingual-processor' },
      transports: [
        new winston.transports.Console()
      ]
    })

    // Supported languages with their codes and names
    this.supportedLanguages = {
      'en': { name: 'English', nativeName: 'English', flag: '🇺🇸' },
      'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
      'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷' },
      'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
      'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
      'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
      'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
      'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
      'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
      'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
      'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
      'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
      'ur': { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
      'bn': { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
      'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
      'nl': { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
      'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
      'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
      'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
      'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' }
    }

    // Language-specific command patterns
    this.commandPatterns = {
      'en': {
        greetings: ['hello', 'hi', 'hey', 'good morning', 'good afternoon'],
        questions: ['what', 'how', 'when', 'where', 'why', 'who'],
        actions: ['show', 'get', 'find', 'create', 'delete', 'update'],
        courses: ['course', 'class', 'subject', 'lesson'],
        help: ['help', 'assist', 'support']
      },
      'es': {
        greetings: ['hola', 'buenos días', 'buenas tardes', 'buenas noches'],
        questions: ['qué', 'cómo', 'cuándo', 'dónde', 'por qué', 'quién'],
        actions: ['mostrar', 'obtener', 'encontrar', 'crear', 'eliminar', 'actualizar'],
        courses: ['curso', 'clase', 'materia', 'lección'],
        help: ['ayuda', 'asistir', 'soporte']
      },
      'fr': {
        greetings: ['bonjour', 'bonsoir', 'salut', 'bonne journée'],
        questions: ['quoi', 'comment', 'quand', 'où', 'pourquoi', 'qui'],
        actions: ['montrer', 'obtenir', 'trouver', 'créer', 'supprimer', 'mettre à jour'],
        courses: ['cours', 'classe', 'matière', 'leçon'],
        help: ['aide', 'assister', 'support']
      },
      'de': {
        greetings: ['hallo', 'guten morgen', 'guten tag', 'guten abend'],
        questions: ['was', 'wie', 'wann', 'wo', 'warum', 'wer'],
        actions: ['zeigen', 'erhalten', 'finden', 'erstellen', 'löschen', 'aktualisieren'],
        courses: ['kurs', 'klasse', 'fach', 'lektion'],
        help: ['hilfe', 'unterstützen', 'support']
      },
      'it': {
        greetings: ['ciao', 'buongiorno', 'buonasera', 'salve'],
        questions: ['cosa', 'come', 'quando', 'dove', 'perché', 'chi'],
        actions: ['mostrare', 'ottenere', 'trovare', 'creare', 'eliminare', 'aggiornare'],
        courses: ['corso', 'classe', 'materia', 'lezione'],
        help: ['aiuto', 'assistere', 'supporto']
      },
      'pt': {
        greetings: ['olá', 'bom dia', 'boa tarde', 'boa noite'],
        questions: ['o que', 'como', 'quando', 'onde', 'por que', 'quem'],
        actions: ['mostrar', 'obter', 'encontrar', 'criar', 'excluir', 'atualizar'],
        courses: ['curso', 'classe', 'matéria', 'lição'],
        help: ['ajuda', 'assistir', 'suporte']
      },
      'ru': {
        greetings: ['привет', 'доброе утро', 'добрый день', 'добрый вечер'],
        questions: ['что', 'как', 'когда', 'где', 'почему', 'кто'],
        actions: ['показать', 'получить', 'найти', 'создать', 'удалить', 'обновить'],
        courses: ['курс', 'класс', 'предмет', 'урок'],
        help: ['помощь', 'помочь', 'поддержка']
      },
      'ja': {
        greetings: ['こんにちは', 'おはよう', 'こんばんは', 'はじめまして'],
        questions: ['何', 'どう', 'いつ', 'どこ', 'なぜ', '誰'],
        actions: ['表示', '取得', '検索', '作成', '削除', '更新'],
        courses: ['コース', 'クラス', '科目', 'レッスン'],
        help: ['ヘルプ', '支援', 'サポート']
      },
      'ko': {
        greetings: ['안녕하세요', '좋은 아침', '안녕', '처음 뵙겠습니다'],
        questions: ['무엇', '어떻게', '언제', '어디', '왜', '누구'],
        actions: ['보여주다', '얻다', '찾다', '만들다', '삭제하다', '업데이트하다'],
        courses: ['과정', '수업', '과목', '레슨'],
        help: ['도움', '지원', '서포트']
      },
      'zh': {
        greetings: ['你好', '早上好', '下午好', '晚上好'],
        questions: ['什么', '怎么', '什么时候', '哪里', '为什么', '谁'],
        actions: ['显示', '获取', '查找', '创建', '删除', '更新'],
        courses: ['课程', '班级', '科目', '课程'],
        help: ['帮助', '协助', '支持']
      },
      'ar': {
        greetings: ['مرحبا', 'صباح الخير', 'مساء الخير', 'السلام عليكم'],
        questions: ['ماذا', 'كيف', 'متى', 'أين', 'لماذا', 'من'],
        actions: ['عرض', 'الحصول على', 'البحث', 'إنشاء', 'حذف', 'تحديث'],
        courses: ['دورة', 'فصل', 'مادة', 'درس'],
        help: ['مساعدة', 'مساعدة', 'دعم']
      },
      'hi': {
        greetings: ['नमस्ते', 'सुप्रभात', 'शुभ दोपहर', 'शुभ संध्या'],
        questions: ['क्या', 'कैसे', 'कब', 'कहाँ', 'क्यों', 'कौन'],
        actions: ['दिखाना', 'प्राप्त करना', 'खोजना', 'बनाना', 'हटाना', 'अपडेट करना'],
        courses: ['कोर्स', 'कक्षा', 'विषय', 'पाठ'],
        help: ['मदद', 'सहायता', 'समर्थन']
      },
      'ur': {
        greetings: ['السلام علیکم', 'صبح بخیر', 'شام بخیر', 'ہیلو'],
        questions: ['کیا', 'کیسے', 'کب', 'کہاں', 'کیوں', 'کون'],
        actions: ['دکھانا', 'حاصل کرنا', 'تلاش کرنا', 'بنانا', 'حذف کرنا', 'اپڈیٹ کرنا'],
        courses: ['کورس', 'کلاس', 'مضمون', 'سبق'],
        help: ['مدد', 'سہارا', 'حمایت']
      }
    }
  }

  async processMultilingualCommand(command, language, context = {}) {
    const startTime = Date.now()
    
    try {
      this.logger.info(`Processing multilingual command in ${language}: ${command}`)
      
      // Check cache first
      const cacheKey = `multilingual:${language}:${this.hashCommand(command)}`
      const cachedResult = await this.cacheService.get(cacheKey)
      
      if (cachedResult) {
        this.logger.info('Multilingual command served from cache')
        this.metricsService.incrementCacheHits()
        return cachedResult
      }

      // Detect if command is in the specified language
      const detectedLanguage = await this.detectLanguage(command)
      const isLanguageMatch = detectedLanguage === language

      // Process with AI in the specified language
      const result = await this.processWithAI(command, language, context, isLanguageMatch)
      
      // Cache result
      await this.cacheService.set(cacheKey, result, 1800) // 30 minutes
      
      // Record metrics
      const processingTime = Date.now() - startTime
      this.metricsService.recordProcessingTime(processingTime)
      this.metricsService.incrementVoiceCommandsProcessed()
      
      this.logger.info(`Multilingual command processed in ${processingTime}ms`)
      return result

    } catch (error) {
      this.logger.error('Error processing multilingual command:', error)
      this.metricsService.incrementVoiceCommandsFailed()
      throw error
    }
  }

  async processWithAI(command, language, context, isLanguageMatch) {
    try {
      const systemPrompt = this.buildMultilingualSystemPrompt(language, context, isLanguageMatch)
      
      const completion = await this.groq.chat.completions.create({
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: command
          }
        ],
        model: 'llama3-8b-8192',
        temperature: 0.7,
        max_tokens: 1000,
        top_p: 1,
        stream: false
      })

      const response = completion.choices[0]?.message?.content || 'I could not process that command.'
      
      return {
        command,
        response,
        language,
        detectedLanguage: await this.detectLanguage(command),
        intent: this.extractIntent(command, language),
        entities: this.extractEntities(command, language),
        confidence: this.calculateConfidence(response),
        timestamp: new Date().toISOString(),
        context
      }

    } catch (error) {
      this.logger.error('AI processing error:', error)
      throw new Error('Failed to process multilingual command with AI')
    }
  }

  buildMultilingualSystemPrompt(language, context, isLanguageMatch) {
    const languageInfo = this.supportedLanguages[language] || this.supportedLanguages['en']
    
    const basePrompt = `You are Voicera AI, an intelligent multilingual educational assistant. 
    You help students, teachers, and administrators with educational tasks in multiple languages.
    
    Current Language: ${languageInfo.nativeName} (${language})
    Language Match: ${isLanguageMatch ? 'Yes' : 'No - command may be in different language'}
    
    Available capabilities:
    - Answer questions about courses, assignments, and grades
    - Help with study planning and time management
    - Provide explanations of complex topics
    - Assist with quiz preparation
    - Help with file management and organization
    - Provide general educational guidance
    - Translate content between languages
    - Provide multilingual support
    
    Current context: ${JSON.stringify(context)}
    
    Instructions:
    1. Respond in ${languageInfo.nativeName} (${language}) unless the user specifically asks for another language
    2. If the command is in a different language, acknowledge it and respond appropriately
    3. Provide helpful, educational, and encouraging responses
    4. If you need more information, ask clarifying questions
    5. Always provide actionable advice when possible
    6. For educational content, ensure accuracy and provide sources when possible
    
    Language-specific considerations:
    - Be culturally sensitive and appropriate for ${languageInfo.nativeName} speakers
    - Use appropriate formal/informal tone based on context
    - Consider educational terminology in ${languageInfo.nativeName}
    - Provide examples relevant to ${languageInfo.name}-speaking educational systems when applicable`

    return basePrompt
  }

  async detectLanguage(text) {
    try {
      // Simple language detection based on character patterns and common words
      const textLower = text.toLowerCase()
      
      // Check for specific language indicators
      if (/[\u4e00-\u9fff]/.test(text)) return 'zh' // Chinese characters
      if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) return 'ja' // Japanese hiragana/katakana
      if (/[\uac00-\ud7af]/.test(text)) return 'ko' // Korean hangul
      if (/[\u0600-\u06ff]/.test(text)) return 'ar' // Arabic
      if (/[\u0900-\u097f]/.test(text)) return 'hi' // Hindi
      if (/[\u0600-\u06ff]/.test(text) && /[\u0750-\u077f]/.test(text)) return 'ur' // Urdu
      if (/[\u0980-\u09ff]/.test(text)) return 'bn' // Bengali
      if (/[\u0400-\u04ff]/.test(text)) return 'ru' // Cyrillic (Russian)
      
      // Check for common words in each language
      const languageChecks = {
        'es': ['hola', 'gracias', 'por favor', 'cómo', 'qué', 'dónde'],
        'fr': ['bonjour', 'merci', 's\'il vous plaît', 'comment', 'quoi', 'où'],
        'de': ['hallo', 'danke', 'bitte', 'wie', 'was', 'wo'],
        'it': ['ciao', 'grazie', 'per favore', 'come', 'cosa', 'dove'],
        'pt': ['olá', 'obrigado', 'por favor', 'como', 'o que', 'onde'],
        'tr': ['merhaba', 'teşekkür', 'lütfen', 'nasıl', 'ne', 'nerede'],
        'nl': ['hallo', 'dank je', 'alsjeblieft', 'hoe', 'wat', 'waar'],
        'sv': ['hej', 'tack', 'snälla', 'hur', 'vad', 'var'],
        'no': ['hei', 'takk', 'vær så snill', 'hvordan', 'hva', 'hvor'],
        'da': ['hej', 'tak', 'venligst', 'hvordan', 'hvad', 'hvor'],
        'fi': ['hei', 'kiitos', 'ole hyvä', 'miten', 'mitä', 'missä']
      }
      
      for (const [lang, words] of Object.entries(languageChecks)) {
        if (words.some(word => textLower.includes(word))) {
          return lang
        }
      }
      
      // Default to English if no specific language detected
      return 'en'
      
    } catch (error) {
      this.logger.error('Language detection error:', error)
      return 'en' // Default fallback
    }
  }

  extractIntent(command, language) {
    const commandLower = command.toLowerCase()
    const patterns = this.commandPatterns[language] || this.commandPatterns['en']
    
    // Check for greetings
    if (patterns.greetings.some(greeting => commandLower.includes(greeting))) {
      return 'greeting'
    }
    
    // Check for questions
    if (patterns.questions.some(question => commandLower.includes(question))) {
      return 'question'
    }
    
    // Check for actions
    if (patterns.actions.some(action => commandLower.includes(action))) {
      return 'action'
    }
    
    // Check for course-related commands
    if (patterns.courses.some(course => commandLower.includes(course))) {
      return 'course_query'
    }
    
    // Check for help requests
    if (patterns.help.some(help => commandLower.includes(help))) {
      return 'help_request'
    }
    
    return 'general_query'
  }

  extractEntities(command, language) {
    const entities = {
      courses: [],
      dates: [],
      numbers: [],
      subjects: [],
      languages: []
    }

    // Extract course names (language-specific patterns)
    const coursePatterns = {
      'en': /(?:course|class|subject)\s+([a-zA-Z\s]+)/gi,
      'es': /(?:curso|clase|materia)\s+([a-zA-Záéíóúñ\s]+)/gi,
      'fr': /(?:cours|classe|matière)\s+([a-zA-Zàâäéèêëïîôöùûüÿç\s]+)/gi,
      'de': /(?:kurs|klasse|fach)\s+([a-zA-Zäöüß\s]+)/gi,
      'it': /(?:corso|classe|materia)\s+([a-zA-Zàèéìíîòóù\s]+)/gi,
      'pt': /(?:curso|classe|matéria)\s+([a-zA-Záâãàéêíóôõú\s]+)/gi,
      'ru': /(?:курс|класс|предмет)\s+([а-яё\s]+)/gi,
      'ja': /(?:コース|クラス|科目)\s+([ひらがなカタカナ漢字\s]+)/gi,
      'ko': /(?:과정|수업|과목)\s+([가-힣\s]+)/gi,
      'zh': /(?:课程|班级|科目)\s+([\u4e00-\u9fff\s]+)/gi,
      'ar': /(?:دورة|فصل|مادة)\s+([\u0600-\u06ff\s]+)/gi,
      'hi': /(?:कोर्स|कक्षा|विषय)\s+([\u0900-\u097f\s]+)/gi,
      'ur': /(?:کورس|کلاس|مضمون)\s+([\u0600-\u06ff\s]+)/gi
    }

    const pattern = coursePatterns[language] || coursePatterns['en']
    let match
    while ((match = pattern.exec(command)) !== null) {
      entities.courses.push(match[1].trim())
    }

    // Extract dates (universal patterns)
    const datePattern = /(?:on|by|at|el|le|der|il|no|на|で|에서|在|في|में|میں)\s+([a-zA-Z0-9\s,]+)/gi
    while ((match = datePattern.exec(command)) !== null) {
      entities.dates.push(match[1].trim())
    }

    // Extract numbers
    const numberPattern = /\b(\d+)\b/g
    while ((match = numberPattern.exec(command)) !== null) {
      entities.numbers.push(parseInt(match[1]))
    }

    return entities
  }

  calculateConfidence(response) {
    // Enhanced confidence calculation for multilingual responses
    const minLength = 10
    const maxLength = 500
    
    if (response.length < minLength) return 0.3
    if (response.length > maxLength) return 0.8
    
    // Check for uncertainty indicators in multiple languages
    const uncertaintyWords = [
      'maybe', 'perhaps', 'might', 'could be', 'not sure',
      'tal vez', 'quizás', 'podría ser', 'no estoy seguro',
      'peut-être', 'peut être', 'je ne suis pas sûr',
      'vielleicht', 'könnte sein', 'ich bin mir nicht sicher',
      'forse', 'potrebbe essere', 'non sono sicuro',
      'talvez', 'pode ser', 'não tenho certeza',
      'возможно', 'может быть', 'не уверен',
      '多分', 'かもしれない', '分からない',
      '아마도', '일지도', '확실하지 않다',
      '也许', '可能', '不确定',
      'ربما', 'قد يكون', 'لست متأكداً',
      'शायद', 'हो सकता है', 'यकीन नहीं',
      'شاید', 'ہو سکتا ہے', 'یقین نہیں'
    ]
    
    const hasUncertainty = uncertaintyWords.some(word => 
      response.toLowerCase().includes(word)
    )
    
    if (hasUncertainty) return 0.6
    
    // Check for confidence indicators in multiple languages
    const confidenceWords = [
      'definitely', 'certainly', 'sure', 'exactly', 'precisely',
      'definitivamente', 'ciertamente', 'seguro', 'exactamente',
      'définitivement', 'certainement', 'sûr', 'exactement',
      'definitiv', 'sicherlich', 'sicher', 'genau',
      'definitivamente', 'certamente', 'sicuro', 'esattamente',
      'definitivamente', 'certamente', 'certo', 'exatamente',
      'определенно', 'конечно', 'уверен', 'точно',
      '確実に', 'もちろん', '確か', '正確に',
      '확실히', '물론', '확실한', '정확히',
      '肯定', '当然', '确定', '准确',
      'بالتأكيد', 'بالطبع', 'متأكد', 'بالضبط',
      'निश्चित रूप से', 'बेशक', 'यकीन', 'बिल्कुल',
      'یقیناً', 'بالکل', 'پکا', 'بالکل'
    ]
    
    const hasConfidence = confidenceWords.some(word => 
      response.toLowerCase().includes(word)
    )
    
    if (hasConfidence) return 0.9
    
    return 0.7 // Default confidence
  }

  hashCommand(command) {
    // Simple hash function for caching
    let hash = 0
    for (let i = 0; i < command.length; i++) {
      const char = command.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36)
  }

  getSupportedLanguages() {
    return this.supportedLanguages
  }

  async translateText(text, fromLanguage, toLanguage) {
    try {
      if (fromLanguage === toLanguage) {
        return text
      }

      const cacheKey = `translate:${fromLanguage}:${toLanguage}:${this.hashCommand(text)}`
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const prompt = `Translate the following text from ${this.supportedLanguages[fromLanguage]?.nativeName || fromLanguage} to ${this.supportedLanguages[toLanguage]?.nativeName || toLanguage}. 
      
      Text: ${text}
      
      Provide only the translation without any additional text or explanations.`

      const completion = await this.groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama3-8b-8192',
        temperature: 0.3,
        max_tokens: 500
      })

      const translation = completion.choices[0]?.message?.content?.trim() || text
      
      // Cache the translation
      await this.cacheService.set(cacheKey, translation, 3600) // 1 hour
      
      return translation

    } catch (error) {
      this.logger.error('Translation error:', error)
      return text // Return original text if translation fails
    }
  }

  async getLanguageSpecificSuggestions(language, userId, limit = 5) {
    try {
      const cacheKey = `voice:suggestions:${language}:${userId}`
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const suggestions = {
        'en': [
          'Show me my courses',
          'What are my grades?',
          'When is my next assignment due?',
          'Help me study for the math quiz',
          'What files do I have uploaded?'
        ],
        'es': [
          'Muéstrame mis cursos',
          '¿Cuáles son mis calificaciones?',
          '¿Cuándo vence mi próxima tarea?',
          'Ayúdame a estudiar para el examen de matemáticas',
          '¿Qué archivos tengo subidos?'
        ],
        'fr': [
          'Montrez-moi mes cours',
          'Quelles sont mes notes?',
          'Quand est-ce que mon prochain devoir est dû?',
          'Aidez-moi à étudier pour le quiz de mathématiques',
          'Quels fichiers ai-je téléchargés?'
        ],
        'de': [
          'Zeigen Sie mir meine Kurse',
          'Was sind meine Noten?',
          'Wann ist meine nächste Aufgabe fällig?',
          'Helfen Sie mir beim Lernen für das Mathe-Quiz',
          'Welche Dateien habe ich hochgeladen?'
        ],
        'it': [
          'Mostrami i miei corsi',
          'Quali sono i miei voti?',
          'Quando è dovuto il mio prossimo compito?',
          'Aiutami a studiare per il quiz di matematica',
          'Quali file ho caricato?'
        ],
        'pt': [
          'Mostre-me meus cursos',
          'Quais são minhas notas?',
          'Quando é o prazo da minha próxima tarefa?',
          'Me ajude a estudar para o quiz de matemática',
          'Quais arquivos eu carreguei?'
        ],
        'ru': [
          'Покажите мои курсы',
          'Какие у меня оценки?',
          'Когда срок следующего задания?',
          'Помогите мне подготовиться к тесту по математике',
          'Какие файлы я загрузил?'
        ],
        'ja': [
          '私のコースを見せてください',
          '私の成績は何ですか？',
          '次の課題の期限はいつですか？',
          '数学のクイズの勉強を手伝ってください',
          'アップロードしたファイルは何ですか？'
        ],
        'ko': [
          '내 과정을 보여주세요',
          '내 성적은 무엇인가요?',
          '다음 과제 마감일은 언제인가요?',
          '수학 퀴즈 공부를 도와주세요',
          '업로드한 파일은 무엇인가요?'
        ],
        'zh': [
          '显示我的课程',
          '我的成绩是什么？',
          '下一个作业的截止日期是什么时候？',
          '帮我准备数学测验',
          '我上传了哪些文件？'
        ],
        'ar': [
          'أظهر لي دوراتي',
          'ما هي درجاتي؟',
          'متى موعد واجبي التالي؟',
          'ساعدني في دراسة اختبار الرياضيات',
          'ما هي الملفات التي حملتها؟'
        ],
        'hi': [
          'मेरे पाठ्यक्रम दिखाएं',
          'मेरे ग्रेड क्या हैं?',
          'मेरा अगला असाइनमेंट कब देय है?',
          'गणित क्विज़ के लिए अध्ययन में मेरी मदद करें',
          'मैंने कौन से फाइल अपलोड की हैं?'
        ],
        'ur': [
          'میرے کورسز دکھائیں',
          'میرے گریڈ کیا ہیں؟',
          'میرا اگلا اسائنمنٹ کب ڈیو ہے؟',
          'ریاضی کے کوئز کے لیے پڑھنے میں میری مدد کریں',
          'میں نے کون سی فائلز اپ لوڈ کی ہیں؟'
        ]
      }

      const result = suggestions[language] || suggestions['en']
      await this.cacheService.set(cacheKey, result.slice(0, limit), 1800) // 30 minutes
      
      return result.slice(0, limit)

    } catch (error) {
      this.logger.error('Error getting language-specific suggestions:', error)
      return []
    }
  }
}
