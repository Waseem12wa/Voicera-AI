import groq from '../config/groq.js'

export class AIService {
	static groq = groq

	static async analyzeFileContent(content, fileName, fileType) {
		try {
			// Check if content is meaningful (not just placeholder text)
			const isPlaceholder = content.includes('placeholder') || 
								 content.includes('This is a placeholder') ||
								 content.includes('Error extracting text') ||
								 content.includes('Content analysis failed') ||
								 content.length < 50
			
			if (isPlaceholder) {
				console.log('Content appears to be placeholder, using enhanced fallback analysis')
				return this.generateEnhancedFallbackAnalysis(fileName, fileType, content)
			}

			const prompt = `
			Analyze this ${fileType} file named "${fileName}" and provide a comprehensive educational analysis:
			
			Content: ${content.substring(0, 3000)}
			
			Please provide:
			1. A detailed, engaging content summary (2-3 sentences that describe what students will learn)
			2. Key educational topics/tags (5-8 relevant academic tags)
			3. Difficulty level (easy/medium/hard based on complexity)
			4. Subject category (specific academic discipline)
			5. Suggested quiz questions (3-5 questions with answers)
			
			Make the summary educational and engaging for students. Focus on learning outcomes.
			
			Respond in JSON format:
			{
				"summary": "detailed educational summary describing learning outcomes",
				"tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
				"difficulty": "easy|medium|hard",
				"subject": "specific subject category",
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

	static generateEnhancedFallbackAnalysis(fileName, fileType, content) {
		const contentLower = fileName.toLowerCase()
		let subject = 'General Education'
		let difficulty = 'medium'
		let tags = ['educational', 'learning material']
		
		// Determine subject based on filename and content
		if (contentLower.includes('math') || contentLower.includes('algebra') || contentLower.includes('calculus') || contentLower.includes('geometry')) {
			subject = 'Mathematics'
			tags.push('mathematics', 'algebra', 'problem-solving')
		}
		if (contentLower.includes('science') || contentLower.includes('physics') || contentLower.includes('chemistry') || contentLower.includes('biology')) {
			subject = 'Science'
			tags.push('science', 'physics', 'chemistry', 'biology')
		}
		if (contentLower.includes('history') || contentLower.includes('historical') || contentLower.includes('social')) {
			subject = 'History & Social Studies'
			tags.push('history', 'social studies', 'culture')
		}
		if (contentLower.includes('language') || contentLower.includes('english') || contentLower.includes('literature') || contentLower.includes('writing')) {
			subject = 'Language Arts'
			tags.push('language', 'literature', 'writing', 'reading')
		}
		if (contentLower.includes('computer') || contentLower.includes('programming') || contentLower.includes('software') || contentLower.includes('technology')) {
			subject = 'Computer Science'
			tags.push('programming', 'technology', 'computer science', 'software')
		}
		if (contentLower.includes('quiz') || contentLower.includes('test') || contentLower.includes('exam')) {
			tags.push('assessment', 'quiz', 'testing')
		}
		if (contentLower.includes('lecture') || contentLower.includes('presentation') || contentLower.includes('slide')) {
			tags.push('lecture', 'presentation', 'slides')
		}
		
		// Determine difficulty
		if (contentLower.includes('advanced') || contentLower.includes('complex') || contentLower.includes('difficult') || contentLower.includes('expert')) {
			difficulty = 'hard'
		} else if (contentLower.includes('basic') || contentLower.includes('simple') || contentLower.includes('introductory') || contentLower.includes('beginner')) {
			difficulty = 'easy'
		}
		
		// Generate enhanced summary
		const fileExtension = fileName.split('.').pop()?.toUpperCase() || 'DOCUMENT'
		const summary = `This ${fileExtension} document covers ${subject.toLowerCase()} topics and provides educational content suitable for ${difficulty} level learning. Students will explore key concepts and develop understanding through this comprehensive learning material.`
		
		return {
			summary: summary,
			tags: tags,
			difficulty: difficulty,
			subject: subject,
			quizQuestions: []
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
				console.log('Insufficient content for quiz generation, using enhanced fallback')
				return this.generateEnhancedFallbackQuiz(topic)
			}

			// Check if content is meaningful (not just placeholder text)
			const isPlaceholder = content.includes('placeholder') || 
								 content.includes('This is a placeholder') ||
								 content.includes('Error extracting text') ||
								 content.includes('Content analysis failed') ||
								 content.includes('not found in uploads directory') ||
								 content.length < 50
			
			if (isPlaceholder) {
				console.log('Content is placeholder text or too short, using enhanced fallback quiz')
				return this.generateEnhancedFallbackQuiz(topic)
			}
			
			console.log(`Generating quiz from ${content.length} characters of real content`)

			const prompt = `
			Create a comprehensive educational quiz based on the ACTUAL CONTENT of this document. Read the content carefully and generate questions that test understanding of the specific information, concepts, and details mentioned in the text.
			
			Document Content:
			${content.substring(0, 2500)}
			
			Instructions:
			- Create 5 multiple choice questions that test knowledge of the ACTUAL CONTENT
			- Questions should be about specific facts, concepts, or details from the document
			- Each question should have 4 answer options
			- One correct answer (index 0-3)
			- Include explanations that reference the actual content
			- Make questions progressively more challenging
			- Focus on educational value and learning outcomes
			
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

	static generateEnhancedFallbackQuiz(topic) {
		console.log('Generating enhanced fallback quiz for topic:', topic)
		
		// Clean up the topic name
		let cleanTopic = topic || 'General Knowledge'
		cleanTopic = cleanTopic.replace(/content analysis failed/gi, 'Document Content')
		cleanTopic = cleanTopic.replace(/quiz about/gi, '')
		cleanTopic = cleanTopic.trim()
		
		// Extract filename if available
		const fileName = cleanTopic.includes('.') ? cleanTopic : 'the document'
		
		// Determine subject area for more relevant questions
		const topicLower = cleanTopic.toLowerCase()
		let subjectArea = 'General Education'
		if (topicLower.includes('math') || topicLower.includes('algebra') || topicLower.includes('calculus')) {
			subjectArea = 'Mathematics'
		} else if (topicLower.includes('science') || topicLower.includes('physics') || topicLower.includes('chemistry')) {
			subjectArea = 'Science'
		} else if (topicLower.includes('computer') || topicLower.includes('programming') || topicLower.includes('technology')) {
			subjectArea = 'Computer Science'
		} else if (topicLower.includes('history') || topicLower.includes('social')) {
			subjectArea = 'History & Social Studies'
		} else if (topicLower.includes('language') || topicLower.includes('english') || topicLower.includes('literature')) {
			subjectArea = 'Language Arts'
		}
		
		return {
			quizTitle: `Quiz: ${cleanTopic}`,
			questions: [
				{
					question: `What type of educational content is ${fileName}?`,
					options: [
						"Learning material for students",
						"Reference documentation",
						"Assessment tool",
						"All of the above"
					],
					correctAnswer: 3,
					explanation: "Educational documents can serve multiple purposes including learning, reference, and assessment."
				},
				{
					question: `What is the primary learning objective of ${fileName}?`,
					options: [
						"To enhance understanding and knowledge",
						"To provide entertainment",
						"To sell products",
						"To confuse learners"
					],
					correctAnswer: 0,
					explanation: "Educational materials are designed to enhance understanding and build knowledge in students."
				},
				{
					question: `How should students approach studying ${fileName}?`,
					options: [
						"Read actively and engage with the content",
						"Skim through quickly without focus",
						"Read only the headings",
						"Avoid difficult sections"
					],
					correctAnswer: 0,
					explanation: "Active reading and engagement with educational content leads to better learning outcomes."
				},
				{
					question: `What subject area does ${fileName} primarily cover?`,
					options: [
						subjectArea,
						"Physical Education",
						"Art and Design",
						"Music Theory"
					],
					correctAnswer: 0,
					explanation: `This document covers ${subjectArea.toLowerCase()} topics and concepts.`
				},
				{
					question: `What is the best way to retain information from ${fileName}?`,
					options: [
						"Take notes and review regularly",
						"Read once and forget",
						"Skip important sections",
						"Rush through quickly"
					],
					correctAnswer: 0,
					explanation: "Taking notes and regular review are proven methods for retaining educational information."
				}
			]
		}
	}

	static generateFallbackQuiz(topic) {
		return this.generateEnhancedFallbackQuiz(topic)
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
				content: "I apologize, but I encountered an error while processing your question. Please try again or contact your teacher for assistance.",
				sources: [],
				confidence: 0.1,
				followUpSuggestions: ["Try rephrasing your question", "Contact your teacher"]
			}
		}
	}

	static async generatePersonalizedStudyPlan(studentPerformance, courseContent, studentGoals) {
		try {
			const prompt = `
			Create a personalized study plan based on student performance and goals:
			
			Student Performance: ${JSON.stringify(studentPerformance)}
			Course Content: ${courseContent.substring(0, 1500)}...
			Student Goals: ${studentGoals}
			
			Create a study plan that:
			1. Addresses weak areas identified in performance
			2. Builds on strengths
			3. Aligns with student goals
			4. Includes specific activities and timelines
			5. Provides motivation and encouragement
			
			Respond in JSON format:
			{
				"studyPlan": {
					"weakAreas": ["area1", "area2"],
					"strengths": ["strength1", "strength2"],
					"weeklyGoals": ["goal1", "goal2"],
					"activities": [
						{
							"activity": "activity name",
							"duration": "time needed",
							"description": "what to do"
						}
					],
					"timeline": "overall timeline",
					"motivation": "encouraging message"
				}
			}
			`

			const completion = await groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.4,
				max_tokens: 1000
			})

			const response = completion.choices[0]?.message?.content || ''
			let cleaned = response.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '')
			const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
			
			return jsonMatch ? JSON.parse(jsonMatch[0]) : { studyPlan: {} }
		} catch (error) {
			console.error('Study plan generation error:', error)
			return { studyPlan: {} }
		}
	}

	// Generate additional information for file details page
	static async generateAdditionalInformation(content, fileName, mimeType) {
		try {
			console.log('Generating additional information for:', fileName)
			
			const prompt = `You are an expert educational content analyzer. Generate comprehensive additional information about the following content to help students and teachers understand it better.

Content: ${content}
File: ${fileName}
Type: ${mimeType}

Please provide detailed additional information using this EXACT format with proper headings and subheadings:

## Additional Information for ${fileName}

### Learning Objectives
[List 3-5 specific learning objectives that students will achieve after studying this content]

### Key Concepts Covered
[Identify and explain the main concepts, topics, and principles covered in this content]

### Prerequisites
[What foundational knowledge or skills students should have before studying this material]

### Real-world Applications
[How this knowledge applies in practical, real-world scenarios and professional contexts]

### Study Tips
[Provide 4-6 practical study strategies and best practices for mastering this content]

### Assessment Ideas
[Suggest different ways to test and evaluate student understanding of this material]

### Related Topics
[Other subjects, concepts, or areas of study that connect to or build upon this content]

### Additional Resources
[Recommendations for further learning, including books, websites, courses, or other materials]

### Summary
[Brief conclusion that ties everything together and emphasizes the educational value]

Make sure to use proper markdown formatting with ## for main headings and ### for subheadings. Be specific and detailed in your responses, tailoring the content to the actual file content and subject matter.

Response:`

			const completion = await this.groq.chat.completions.create({
				messages: [{ role: 'user', content: prompt }],
				model: 'llama-3.1-8b-instant',
				temperature: 0.7,
				max_tokens: 2000
			})

			const response = completion.choices[0]?.message?.content || ''
			
			if (!response || response.length < 100) {
				// Generate fallback additional information
				return this.generateFallbackAdditionalInfo(fileName, mimeType)
			}
			
			return response.trim()
		} catch (error) {
			console.error('Additional information generation error:', error)
			return this.generateFallbackAdditionalInfo(fileName, mimeType)
		}
	}

	// Generate fallback additional information
	static generateFallbackAdditionalInfo(fileName, mimeType) {
		const fileNameLower = fileName.toLowerCase()
		let subject = 'General Education'
		let learningObjectives = 'Understand key concepts and develop critical thinking skills'
		let keyConcepts = 'Core educational concepts and principles'
		let studyTips = 'Read actively, take notes, and practice regularly'
		
		// Determine subject-specific information
		if (fileNameLower.includes('math') || fileNameLower.includes('algebra') || fileNameLower.includes('calculus')) {
			subject = 'Mathematics'
			learningObjectives = 'Master mathematical concepts, problem-solving techniques, and analytical thinking'
			keyConcepts = 'Mathematical principles, equations, problem-solving methods, and logical reasoning'
			studyTips = 'Practice problems regularly, understand concepts before memorizing, and work through examples step by step'
		} else if (fileNameLower.includes('science') || fileNameLower.includes('physics') || fileNameLower.includes('chemistry')) {
			subject = 'Science'
			learningObjectives = 'Understand scientific principles, experimental methods, and natural phenomena'
			keyConcepts = 'Scientific theories, experimental design, data analysis, and scientific reasoning'
			studyTips = 'Connect concepts to real-world examples, understand the scientific method, and practice with experiments'
		} else if (fileNameLower.includes('history') || fileNameLower.includes('social')) {
			subject = 'History & Social Studies'
			learningObjectives = 'Understand historical events, social structures, and cultural developments'
			keyConcepts = 'Historical timelines, social movements, cultural analysis, and critical thinking'
			studyTips = 'Create timelines, understand cause and effect relationships, and connect past events to present situations'
		} else if (fileNameLower.includes('language') || fileNameLower.includes('english') || fileNameLower.includes('literature')) {
			subject = 'Language Arts'
			learningObjectives = 'Develop reading comprehension, writing skills, and literary analysis abilities'
			keyConcepts = 'Literary devices, writing techniques, grammar, and communication skills'
			studyTips = 'Read actively, practice writing regularly, analyze literary elements, and expand vocabulary'
		} else if (fileNameLower.includes('computer') || fileNameLower.includes('programming') || fileNameLower.includes('technology')) {
			subject = 'Computer Science'
			learningObjectives = 'Master programming concepts, computational thinking, and technology applications'
			keyConcepts = 'Programming languages, algorithms, data structures, and software development'
			studyTips = 'Practice coding regularly, understand algorithms step by step, and work on real projects'
		}

		return `## Additional Information for ${fileName}

### Learning Objectives
${learningObjectives}

### Key Concepts Covered
${keyConcepts}

### Prerequisites
Basic understanding of ${subject.toLowerCase()} fundamentals and critical thinking skills.

### Real-world Applications
This content applies to various real-world scenarios including problem-solving, decision-making, and professional development in ${subject.toLowerCase()} fields.

### Study Tips
${studyTips}

### Assessment Ideas
- Practice exercises and problem-solving
- Discussion and analysis of key concepts
- Application of knowledge to new situations
- Collaborative learning activities

### Related Topics
- Advanced ${subject.toLowerCase()} concepts
- Interdisciplinary connections
- Current research and developments
- Professional applications

### Additional Resources
- Online tutorials and courses
- Reference materials and textbooks
- Practice exercises and assessments
- Discussion forums and study groups

### Summary
This educational material is designed to enhance your understanding and provide a solid foundation for further learning in ${subject.toLowerCase()}. The content covers essential concepts and provides practical applications that will help you develop critical thinking skills and apply knowledge in real-world situations.`
	}
}