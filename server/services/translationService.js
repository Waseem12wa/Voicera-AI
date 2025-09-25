import groq from '../config/groq.js'

export class TranslationService {
	static groq = groq

	/**
	 * Translate text content to target language
	 * @param {string} text - Text to translate
	 * @param {string} fromLanguage - Source language code
	 * @param {string} toLanguage - Target language code
	 * @returns {Promise<string>} - Translated text
	 */
	static async translateText(text, fromLanguage = 'en', toLanguage = 'en') {
		try {
			if (fromLanguage === toLanguage) {
				return text
			}

			const languageNames = {
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

			const fromLangName = languageNames[fromLanguage] || fromLanguage
			const toLangName = languageNames[toLanguage] || toLanguage

			const prompt = `Translate the following text from ${fromLangName} to ${toLangName}. 
			Maintain the original meaning, tone, and educational context. 
			If the text contains technical terms or educational concepts, provide accurate translations.
			
			Text to translate: ${text}
			
			Provide only the translation without any additional text or explanations.`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama3-8b-8192',
				temperature: 0.3,
				max_tokens: 1000
			})

			const translation = completion.choices[0]?.message?.content?.trim() || text
			return translation

		} catch (error) {
			console.error('Translation error:', error)
			return text // Return original text if translation fails
		}
	}

	/**
	 * Translate educational content (lectures, documents, etc.)
	 * @param {string} content - Educational content to translate
	 * @param {string} fromLanguage - Source language code
	 * @param {string} toLanguage - Target language code
	 * @param {string} contentType - Type of content (lecture, document, quiz, etc.)
	 * @returns {Promise<Object>} - Translated content with metadata
	 */
	static async translateEducationalContent(content, fromLanguage = 'en', toLanguage = 'en', contentType = 'general') {
		try {
			if (fromLanguage === toLanguage) {
				return {
					originalContent: content,
					translatedContent: content,
					fromLanguage,
					toLanguage,
					contentType,
					translationConfidence: 1.0,
					translatedAt: new Date().toISOString()
				}
			}

			const languageNames = {
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

			const fromLangName = languageNames[fromLanguage] || fromLanguage
			const toLangName = languageNames[toLanguage] || toLanguage

			// Content-specific translation prompts
			const contentPrompts = {
				'lecture': `Translate this educational lecture content from ${fromLangName} to ${toLangName}. 
				Maintain the educational structure, technical accuracy, and teaching style. 
				Preserve any examples, explanations, and educational terminology appropriately.`,
				
				'document': `Translate this educational document from ${fromLangName} to ${toLangName}. 
				Maintain the document structure, formatting, and educational content accuracy. 
				Preserve technical terms and educational concepts appropriately.`,
				
				'quiz': `Translate this quiz content from ${fromLangName} to ${toLangName}. 
				Maintain the question structure, answer options, and educational context. 
				Ensure questions remain clear and culturally appropriate.`,
				
				'assignment': `Translate this assignment content from ${fromLangName} to ${toLangName}. 
				Maintain the assignment structure, instructions, and educational objectives. 
				Preserve the academic tone and requirements.`,
				
				'general': `Translate this educational content from ${fromLangName} to ${toLangName}. 
				Maintain the original meaning, educational context, and appropriate tone.`
			}

			const basePrompt = contentPrompts[contentType] || contentPrompts['general']
			
			const prompt = `${basePrompt}
			
			Content to translate: ${content}
			
			Provide only the translation without any additional text or explanations.`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama3-8b-8192',
				temperature: 0.3,
				max_tokens: 2000
			})

			const translatedContent = completion.choices[0]?.message?.content?.trim() || content

			// Calculate translation confidence based on content length and complexity
			const confidence = this.calculateTranslationConfidence(content, translatedContent, fromLanguage, toLanguage)

			return {
				originalContent: content,
				translatedContent: translatedContent,
				fromLanguage,
				toLanguage,
				contentType,
				translationConfidence: confidence,
				translatedAt: new Date().toISOString()
			}

		} catch (error) {
			console.error('Educational content translation error:', error)
			return {
				originalContent: content,
				translatedContent: content,
				fromLanguage,
				toLanguage,
				contentType,
				translationConfidence: 0.1,
				translatedAt: new Date().toISOString(),
				error: error.message
			}
		}
	}

	/**
	 * Translate audio transcript with context
	 * @param {string} transcript - Audio transcript to translate
	 * @param {string} fromLanguage - Source language code
	 * @param {string} toLanguage - Target language code
	 * @param {Object} context - Additional context (course, subject, etc.)
	 * @returns {Promise<Object>} - Translated transcript with metadata
	 */
	static async translateAudioTranscript(transcript, fromLanguage = 'en', toLanguage = 'en', context = {}) {
		try {
			if (fromLanguage === toLanguage) {
				return {
					originalTranscript: transcript,
					translatedTranscript: transcript,
					fromLanguage,
					toLanguage,
					context,
					translationConfidence: 1.0,
					translatedAt: new Date().toISOString()
				}
			}

			const languageNames = {
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

			const fromLangName = languageNames[fromLanguage] || fromLanguage
			const toLangName = languageNames[toLanguage] || toLanguage

			const contextInfo = context.course ? `Course: ${context.course}` : ''
			const subjectInfo = context.subject ? `Subject: ${context.subject}` : ''

			const prompt = `Translate this audio transcript from ${fromLangName} to ${toLangName}. 
			This appears to be educational content from a lecture or presentation.
			${contextInfo ? `\n${contextInfo}` : ''}
			${subjectInfo ? `\n${subjectInfo}` : ''}
			
			Maintain the conversational tone, educational context, and technical accuracy.
			Preserve any examples, explanations, and educational terminology appropriately.
			
			Audio transcript: ${transcript}
			
			Provide only the translation without any additional text or explanations.`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama3-8b-8192',
				temperature: 0.3,
				max_tokens: 1500
			})

			const translatedTranscript = completion.choices[0]?.message?.content?.trim() || transcript

			const confidence = this.calculateTranslationConfidence(transcript, translatedTranscript, fromLanguage, toLanguage)

			return {
				originalTranscript: transcript,
				translatedTranscript: translatedTranscript,
				fromLanguage,
				toLanguage,
				context,
				translationConfidence: confidence,
				translatedAt: new Date().toISOString()
			}

		} catch (error) {
			console.error('Audio transcript translation error:', error)
			return {
				originalTranscript: transcript,
				translatedTranscript: transcript,
				fromLanguage,
				toLanguage,
				context,
				translationConfidence: 0.1,
				translatedAt: new Date().toISOString(),
				error: error.message
			}
		}
	}

	/**
	 * Calculate translation confidence based on various factors
	 * @param {string} originalText - Original text
	 * @param {string} translatedText - Translated text
	 * @param {string} fromLanguage - Source language
	 * @param {string} toLanguage - Target language
	 * @returns {number} - Confidence score between 0 and 1
	 */
	static calculateTranslationConfidence(originalText, translatedText, fromLanguage, toLanguage) {
		try {
			// Base confidence
			let confidence = 0.7

			// Length similarity check
			const originalLength = originalText.length
			const translatedLength = translatedText.length
			const lengthRatio = Math.min(originalLength, translatedLength) / Math.max(originalLength, translatedLength)
			
			if (lengthRatio > 0.8) {
				confidence += 0.1
			} else if (lengthRatio < 0.5) {
				confidence -= 0.2
			}

			// Language pair complexity
			const complexLanguagePairs = [
				['en', 'ja'], ['en', 'ko'], ['en', 'zh'], ['en', 'ar'],
				['ja', 'en'], ['ko', 'en'], ['zh', 'en'], ['ar', 'en']
			]
			
			const isComplexPair = complexLanguagePairs.some(pair => 
				(pair[0] === fromLanguage && pair[1] === toLanguage) ||
				(pair[1] === fromLanguage && pair[0] === toLanguage)
			)
			
			if (isComplexPair) {
				confidence -= 0.1
			}

			// Check for common translation issues
			if (translatedText.includes('[Translation Error]') || 
				translatedText.includes('Unable to translate') ||
				translatedText.length < originalText.length * 0.3) {
				confidence = 0.2
			}

			// Ensure confidence is within bounds
			return Math.max(0.1, Math.min(1.0, confidence))

		} catch (error) {
			console.error('Confidence calculation error:', error)
			return 0.5 // Default confidence
		}
	}

	/**
	 * Get supported languages for translation
	 * @returns {Object} - Supported languages with metadata
	 */
	static getSupportedLanguages() {
		return {
			'en': { name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
			'es': { name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
			'fr': { name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
			'de': { name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
			'it': { name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
			'pt': { name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
			'ru': { name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
			'ja': { name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
			'ko': { name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
			'zh': { name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
			'ar': { name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
			'hi': { name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
			'ur': { name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
			'bn': { name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', rtl: false },
			'tr': { name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
			'nl': { name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
			'sv': { name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false },
			'no': { name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false },
			'da': { name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false },
			'fi': { name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false }
		}
	}

	/**
	 * Batch translate multiple texts
	 * @param {Array} texts - Array of text objects with content and metadata
	 * @param {string} fromLanguage - Source language code
	 * @param {string} toLanguage - Target language code
	 * @returns {Promise<Array>} - Array of translated texts
	 */
	static async batchTranslate(texts, fromLanguage = 'en', toLanguage = 'en') {
		try {
			const results = []
			
			for (const textObj of texts) {
				const result = await this.translateEducationalContent(
					textObj.content,
					fromLanguage,
					toLanguage,
					textObj.contentType || 'general'
				)
				
				results.push({
					...textObj,
					...result
				})
			}
			
			return results
			
		} catch (error) {
			console.error('Batch translation error:', error)
			return texts.map(textObj => ({
				...textObj,
				translatedContent: textObj.content,
				fromLanguage,
				toLanguage,
				translationConfidence: 0.1,
				error: error.message
			}))
		}
	}
}
