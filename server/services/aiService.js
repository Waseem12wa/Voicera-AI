import groq from '../config/groq.js'

export class AIService {
	static async analyzeFileContent(content, fileName, fileType) {
		try {
			// Check if content is meaningful (not just placeholder text)
			const isPlaceholder = content.includes('placeholder') || 
								 content.includes('This is a placeholder') ||
								 content.length < 50
			
			if (isPlaceholder) {
				console.log('Content appears to be placeholder, using fallback analysis')
				return {
					summary: `Document: ${fileName}`,
					tags: ['document', 'material'],
					difficulty: 'medium',
					subject: 'General',
					quizQuestions: []
				}
			}

			const prompt = `
			Analyze this ${fileType} file named "${fileName}" and provide a comprehensive analysis:
			
			Content: ${content.substring(0, 3000)}
			
			Please provide:
			1. A detailed content summary (2-3 sentences)
			2. Key topics/tags (5-8 relevant tags)
			3. Difficulty level (easy/medium/hard)
			4. Subject category (e.g., Mathematics, Science, Literature, etc.)
			5. Suggested quiz questions (3-5 questions with answers)
			
			Respond in JSON format:
			{
				"summary": "detailed summary of the content",
				"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
				"difficulty": "easy|medium|hard",
				"subject": "subject category",
				"quizQuestions": [
					{
						"question": "question text",
						"options": ["Option A", "Option B", "Option C", "Option D"],
						"correctAnswer": 0,
						"explanation": "explanation for the correct answer"
					}
				]
			}
			`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.3,
				max_tokens: 1000
			})

			const response = completion.choices[0]?.message?.content || ''
			// Sanitize possible markdown fences before parsing
			let cleaned = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '')
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
			return jsonMatch ? JSON.parse(jsonMatch[0]) : {}
		} catch (error) {
			console.error('AI analysis error:', error)
			
			// Generate a meaningful fallback analysis based on content
			const contentLower = content.toLowerCase()
			let summary = 'Educational content ready for analysis'
			let tags = ['educational']
			let difficulty = 'medium'
			let subject = 'General'
			
			// Analyze content for keywords
			if (contentLower.includes('math') || contentLower.includes('calculus') || contentLower.includes('algebra')) {
				subject = 'Mathematics'
				tags.push('mathematics', 'math')
			}
			if (contentLower.includes('science') || contentLower.includes('physics') || contentLower.includes('chemistry')) {
				subject = 'Science'
				tags.push('science', 'physics')
			}
			if (contentLower.includes('history') || contentLower.includes('historical')) {
				subject = 'History'
				tags.push('history')
			}
			if (contentLower.includes('language') || contentLower.includes('english') || contentLower.includes('literature')) {
				subject = 'Language Arts'
				tags.push('language', 'literature')
			}
			
			// Determine difficulty
			if (contentLower.includes('advanced') || contentLower.includes('complex') || contentLower.includes('difficult')) {
				difficulty = 'hard'
			} else if (contentLower.includes('basic') || contentLower.includes('simple') || contentLower.includes('introductory')) {
				difficulty = 'easy'
			}
			
			// Generate summary
			const words = content.split(' ').slice(0, 20).join(' ')
			summary = `${words}... This content covers ${subject.toLowerCase()} topics and is suitable for ${difficulty} level learning.`
			
			return {
				summary: summary,
				tags: tags,
				difficulty: difficulty,
				subject: subject,
				quizQuestions: []
			}
		}
	}

	static async generateAIResponse(question, context = '') {
		try {
			const prompt = `
			You are an AI teaching assistant. Answer this student question based on the provided context.
			
			Context: ${context}
			Question: ${question}
			
			Provide a helpful, educational response that:
			1. Directly answers the question
			2. Provides additional context if helpful
			3. Suggests related topics for further learning
			4. Is appropriate for educational use
			
			Keep the response concise but informative (2-3 paragraphs max).
			`

		const completion = await groq.chat.completions.create({
			messages: [{ role: 'user', content: prompt }],
			model: 'llama-3.1-8b-instant',
			temperature: 0.5,
			max_tokens: 500
		})

			return completion.choices[0]?.message?.content || 'Unable to generate response'
		} catch (error) {
			console.error('AI response generation error:', error)
			return 'I apologize, but I encountered an error while generating a response. Please try again or contact your teacher.'
		}
	}

	static async generateQuizFromContent(content, topic) {
		try {
			// Check if we have valid content
			if (!content || content.length < 10) {
				console.log('Insufficient content for quiz generation, using fallback')
				return this.generateFallbackQuiz(topic)
			}

			// Check if content is meaningful (not just placeholder text)
			const isPlaceholder = content.includes('placeholder') || 
								 content.includes('This is a placeholder') ||
								 content.includes('Error extracting text') ||
								 content.includes('Content analysis failed') ||
								 content.length < 50
			
			if (isPlaceholder) {
				console.log('Content is placeholder text or too short, using fallback quiz')
				return this.generateFallbackQuiz(topic)
			}
			
			console.log(`Generating quiz from ${content.length} characters of real content`)

			const prompt = `
			Create a comprehensive quiz based on the ACTUAL CONTENT of this document. Read the content carefully and generate questions that test understanding of the specific information, concepts, and details mentioned in the text.
			
			Document Content:
			${content.substring(0, 2000)}
			
			Instructions:
			- Create 5 multiple choice questions that test knowledge of the ACTUAL CONTENT
			- Questions should be about specific facts, concepts, or details from the document
			- Each question should have 4 answer options
			- One correct answer (index 0-3)
			- Include explanations that reference the actual content
			- Make questions progressively more challenging
			
			Respond ONLY in valid JSON format:
			{
				"quizTitle": "Quiz: ${topic}",
				"questions": [
					{
						"question": "Based on the document content, what is...?",
						"options": ["Option A", "Option B", "Option C", "Option D"],
						"correctAnswer": 0,
						"explanation": "This is correct because the document states..."
					}
				]
			}
			`

			console.log('Generating quiz with Groq API...')
			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.4,
				max_tokens: 1000
			})

			const response = completion.choices[0]?.message?.content
			console.log('Groq API response:', response)
			
			if (!response) {
				throw new Error('No response from AI service')
			}

			// Try to parse the JSON response (sanitize common markdown wrapping)
			let quizData
			try {
				let cleaned = response.trim()
				// Remove markdown fenced code blocks if present
				cleaned = cleaned.replace(/^```(?:json)?/i, '').replace(/```$/i, '')
				// Find first JSON object
				const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
				if (jsonMatch) {
					quizData = JSON.parse(jsonMatch[0])
				} else {
					throw new Error('No valid JSON found in response')
				}
			} catch (parseError) {
				console.error('JSON parsing error:', parseError)
				console.log('Raw response:', response)
				return this.generateFallbackQuiz(topic)
			}

			// Validate the quiz data
			if (!quizData.questions || !Array.isArray(quizData.questions)) {
				console.log('Invalid quiz data structure, using fallback')
				return this.generateFallbackQuiz(topic)
			}

			// Clean title if it contains undesirable phrases
			if (quizData.quizTitle) {
				quizData.quizTitle = String(quizData.quizTitle)
					.replace(/content analysis failed/gi, 'Document Content')
					.replace(/quiz about\s*/i, 'Quiz: ')
					.trim()
			}
			return quizData
		} catch (error) {
			console.error('Quiz generation error:', error.message)
			return this.generateFallbackQuiz(topic)
		}
	}

	static generateFallbackQuiz(topic) {
		console.log('Generating fallback quiz for topic:', topic)
		
		// Clean up the topic name
		let cleanTopic = topic || 'General Knowledge'
		cleanTopic = cleanTopic.replace(/content analysis failed/gi, 'Document Content')
		cleanTopic = cleanTopic.replace(/quiz about/gi, '')
		cleanTopic = cleanTopic.trim()
		
		// Extract filename if available
		const fileName = cleanTopic.includes('.') ? cleanTopic : 'the document'
		
		return {
			quizTitle: `Quiz: ${cleanTopic}`,
			questions: [
				{
					question: `What type of document is ${fileName}?`,
					options: [
						"Educational material",
						"Technical documentation", 
						"Reference guide",
						"All of the above"
					],
					correctAnswer: 3,
					explanation: "Documents can serve multiple purposes including education, technical reference, and guidance."
				},
				{
					question: `What is the primary purpose of ${fileName}?`,
					options: [
						"To provide information and knowledge",
						"To entertain readers",
						"To sell products",
						"To confuse users"
					],
					correctAnswer: 0,
					explanation: "Educational documents are primarily designed to provide information and knowledge to readers."
				},
				{
					question: `How should you approach reading ${fileName}?`,
					options: [
						"Read actively and take notes",
						"Skim through quickly",
						"Read only the headings",
						"Skip difficult sections"
					],
					correctAnswer: 0,
					explanation: "Active reading with note-taking helps improve comprehension and retention of information."
				},
				{
					question: `What makes ${fileName} valuable for learning?`,
					options: [
						"Contains structured information",
						"Provides examples and explanations",
						"Helps build knowledge",
						"All of the above"
					],
					correctAnswer: 3,
					explanation: "Educational documents are valuable because they contain structured information, examples, and help build knowledge."
				},
				{
					question: `What should you do if you don't understand something in ${fileName}?`,
					options: [
						"Re-read the section carefully",
						"Ask questions or seek help",
						"Look up additional resources",
						"All of the above"
					],
					correctAnswer: 3,
					explanation: "When encountering difficult content, it's best to re-read, ask questions, and seek additional resources."
				}
			]
		}
	}

	static async identifyWeakTopics(studentResponses, courseContent) {
		try {
			const prompt = `
			Analyze these student responses and course content to identify weak topics:
			
			Student Responses: ${JSON.stringify(studentResponses)}
			Course Content: ${courseContent.substring(0, 1000)}...
			
			Identify:
			1. Topics with low performance
			2. Common misconceptions
			3. Areas needing more attention
			4. Suggested interventions
			
			Respond in JSON format:
			{
				"weakTopics": [
					{
						"topic": "topic name",
						"performance": "low|medium|high",
						"commonIssues": ["issue1", "issue2"],
						"suggestions": ["suggestion1", "suggestion2"]
					}
				],
				"overallPerformance": "percentage",
				"recommendations": ["recommendation1", "recommendation2"]
			}
			`

		const completion = await groq.chat.completions.create({
			messages: [{ role: 'user', content: prompt }],
			model: 'llama-3.1-8b-instant',
			temperature: 0.3,
			max_tokens: 600
		})

			const response = completion.choices[0]?.message?.content || ''
			// Sanitize possible markdown fences and parse
			let cleaned = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '')
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
			return jsonMatch 
				? JSON.parse(jsonMatch[0]) 
				: { weakTopics: [], overallPerformance: '0%', recommendations: [] }
		} catch (error) {
			console.error('Weak topic analysis error:', error)
			return { weakTopics: [], overallPerformance: '0%', recommendations: [] }
		}
	}

	// Student-specific AI methods
	static async generateStudentResponse(question, context, studentEmail) {
		try {
			const prompt = `
			You are an AI learning assistant helping a student. Answer their question based on the provided course content.
			
			Student Question: ${question}
			Course Context: ${context}
			
			Instructions:
			1. Provide a clear, educational answer based on the course content
			2. If the question is not covered in the course content, say so and offer to help with related topics
			3. Include specific examples or explanations when possible
			4. Suggest follow-up questions or related topics for deeper learning
			5. Keep the tone encouraging and supportive
			
			Respond in JSON format:
			{
				"content": "Your detailed answer here",
				"sources": ["source1", "source2"],
				"confidence": 0.8,
				"followUpSuggestions": ["suggestion1", "suggestion2"]
			}
			`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.5,
				max_tokens: 800
			})

			const response = completion.choices[0]?.message?.content || ''
			let cleaned = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '')
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
			
			if (jsonMatch) {
				return JSON.parse(jsonMatch[0])
			} else {
				return {
					content: "I understand your question, but I need more information to provide a comprehensive answer. Could you provide more details about what specific aspect you'd like to learn about?",
					sources: [],
					confidence: 0.3,
					followUpSuggestions: ["Could you clarify your question?", "What specific topic interests you?"]
				}
			}
		} catch (error) {
			console.error('Student response generation error:', error)
			return {
				content: "I apologize, but I'm having trouble processing your question right now. Please try rephrasing your question or contact your teacher for assistance.",
				sources: [],
				confidence: 0.1,
				followUpSuggestions: ["Try rephrasing your question", "Contact your teacher"]
			}
		}
	}

	static async generatePersonalizedRecommendations(progress, learningStyle, pace) {
		try {
			const prompt = `
			Analyze this student's learning progress and generate personalized recommendations:
			
			Student Progress: ${JSON.stringify(progress)}
			Learning Style: ${learningStyle}
			Learning Pace: ${pace}
			
			Generate recommendations for:
			1. Study strategies based on learning style
			2. Content difficulty adjustments based on pace
			3. Areas for improvement
			4. Next learning steps
			
			Respond in JSON format:
			{
				"studyStrategies": ["strategy1", "strategy2"],
				"contentRecommendations": ["content1", "content2"],
				"improvementAreas": ["area1", "area2"],
				"nextSteps": ["step1", "step2"],
				"personalizedMessage": "Encouraging message for the student"
			}
			`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.4,
				max_tokens: 600
			})

			const response = completion.choices[0]?.message?.content || ''
			let cleaned = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '')
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
			
			return jsonMatch 
				? JSON.parse(jsonMatch[0]) 
				: {
					studyStrategies: ["Review course materials regularly", "Practice with quizzes"],
					contentRecommendations: ["Focus on areas with lower scores"],
					improvementAreas: ["Continue practicing"],
					nextSteps: ["Complete more quizzes", "Ask questions when needed"],
					personalizedMessage: "Keep up the great work! Continue learning at your own pace."
				}
		} catch (error) {
			console.error('Personalized recommendations error:', error)
			return {
				studyStrategies: ["Review course materials regularly"],
				contentRecommendations: ["Focus on understanding concepts"],
				improvementAreas: ["Continue practicing"],
				nextSteps: ["Complete quizzes", "Ask questions"],
				personalizedMessage: "Keep learning and don't hesitate to ask questions!"
			}
		}
	}
}
