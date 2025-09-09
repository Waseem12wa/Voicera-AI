import groq from '../config/groq.js'

export class AIService {
	static async analyzeFileContent(content, fileName, fileType) {
		try {
			const prompt = `
			Analyze this ${fileType} file named "${fileName}" and provide:
			1. Content summary (2-3 sentences)
			2. Key topics/tags (comma-separated)
			3. Difficulty level (easy/medium/hard)
			4. Subject category (e.g., Mathematics, Science, Literature, etc.)
			5. Suggested quiz questions (3-5 questions with answers)
			
			Content: ${content.substring(0, 2000)}...
			
			Respond in JSON format:
			{
				"summary": "brief summary",
				"tags": ["tag1", "tag2", "tag3"],
				"difficulty": "easy|medium|hard",
				"subject": "subject category",
				"quizQuestions": [
					{"question": "question text", "answer": "correct answer", "options": ["A", "B", "C", "D"]}
				]
			}
			`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama3-8b-8192',
				temperature: 0.3,
				max_tokens: 1000
			})

			const response = completion.choices[0]?.message?.content
			return JSON.parse(response || '{}')
		} catch (error) {
			console.error('AI analysis error:', error)
			return {
				summary: 'Content analysis failed',
				tags: ['material'],
				difficulty: 'medium',
				subject: 'General',
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

			const prompt = `
			Generate a comprehensive quiz about "${topic}" based on this content:
			
			${content.substring(0, 1500)}...
			
			Create 5 multiple choice questions with:
			- Clear, concise questions
			- 4 answer options each
			- One correct answer (index 0-3)
			- Varying difficulty levels
			
			Respond ONLY in valid JSON format:
			{
				"quizTitle": "Quiz about ${topic}",
				"questions": [
					{
						"question": "What is the main topic discussed?",
						"options": ["Option A", "Option B", "Option C", "Option D"],
						"correctAnswer": 0,
						"explanation": "This is correct because..."
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

			// Try to parse the JSON response
			let quizData
			try {
				// Clean the response to extract JSON
				const jsonMatch = response.match(/\{[\s\S]*\}/)
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

			return quizData
		} catch (error) {
			console.error('Quiz generation error:', error.message)
			return this.generateFallbackQuiz(topic)
		}
	}

	static generateFallbackQuiz(topic) {
		console.log('Generating fallback quiz for topic:', topic)
		return {
			quizTitle: `Quiz: ${topic || 'General Knowledge'}`,
			questions: [
				{
					question: `What is the main focus of ${topic || 'this topic'}?`,
					options: [
						"Understanding key concepts",
						"Memorizing facts",
						"Practical application",
						"Theoretical knowledge"
					],
					correctAnswer: 0,
					explanation: "Understanding key concepts is fundamental to learning any topic effectively."
				},
				{
					question: `Which approach is most effective for learning ${topic || 'this subject'}?`,
					options: [
						"Active engagement and practice",
						"Passive reading only",
						"Cramming before exams",
						"Rote memorization"
					],
					correctAnswer: 0,
					explanation: "Active engagement and practice lead to better retention and understanding."
				},
				{
					question: `What is an important skill when studying ${topic || 'this material'}?`,
					options: [
						"Critical thinking",
						"Speed reading",
						"Multitasking",
						"Memorization only"
					],
					correctAnswer: 0,
					explanation: "Critical thinking helps analyze and understand complex concepts deeply."
				},
				{
					question: `How should you approach difficult concepts in ${topic || 'this subject'}?`,
					options: [
						"Break them down into smaller parts",
						"Skip them entirely",
						"Memorize without understanding",
						"Ask someone else to explain"
					],
					correctAnswer: 0,
					explanation: "Breaking down complex concepts makes them more manageable and understandable."
				},
				{
					question: `What is the best way to retain information about ${topic || 'this topic'}?`,
					options: [
						"Regular review and practice",
						"One-time reading",
						"Highlighting everything",
						"Copying notes"
					],
					correctAnswer: 0,
					explanation: "Regular review and practice strengthen neural pathways and improve retention."
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

			const response = completion.choices[0]?.message?.content
			return JSON.parse(response || '{"weakTopics": [], "overallPerformance": "0%", "recommendations": []}')
		} catch (error) {
			console.error('Weak topic analysis error:', error)
			return { weakTopics: [], overallPerformance: '0%', recommendations: [] }
		}
	}
}
