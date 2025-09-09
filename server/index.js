import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const server = createServer(app)
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173'

const io = new Server(server, {
	cors: {
		origin: CLIENT_ORIGIN,
		methods: ['GET', 'POST']
	}
})

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(morgan('dev'))

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voicera'
await mongoose.connect(MONGO_URI)

// Socket.IO for real-time features
io.on('connection', (socket) => {
	console.log('User connected:', socket.id)
	
	socket.on('join-teacher-room', (teacherEmail) => {
		socket.join(`teacher-${teacherEmail}`)
		console.log(`Teacher ${teacherEmail} joined room`)
	})
	
	socket.on('disconnect', () => {
		console.log('User disconnected:', socket.id)
	})
})

// Make io available to routes
app.use((req, res, next) => {
	req.io = io
	next()
})

// Import enhanced models
import File from './models/File.js'
import Quiz from './models/Quiz.js'
import StudentInteraction from './models/StudentInteraction.js'
import StudentNote from './models/StudentNote.js'
import { FileProcessor } from './services/fileProcessor.js'
import { AIService } from './services/aiService.js'

// Legacy models for backward compatibility
const institutionSchema = new mongoose.Schema({
	adminEmail: { type: String, index: true, unique: true },
	name: String,
	logoUrl: String,
	address: String,
	institutionType: { type: String, enum: ['University','College','School','Institute'] },
	contactEmail: String,
	contactPhone: String,
}, { timestamps: true })

const programSchema = new mongoose.Schema({
	name: { type: String, required: true },
}, { timestamps: true })

const courseSchema = new mongoose.Schema({
	name: { type: String, required: true },
}, { timestamps: true })

const userSchema = new mongoose.Schema({
	name: { type: String, required: true },
	email: { type: String, required: true, unique: true },
	role: { type: String, enum: ['admin','institution_admin','teacher','student'], default: 'teacher' },
	password: { type: String },
}, { timestamps: true })

const Institution = mongoose.model('Institution', institutionSchema)
const Program = mongoose.model('Program', programSchema)
const Course = mongoose.model('Course', courseSchema)
const User = mongoose.model('User', userSchema)

// Simple auth stub: read admin email from header for demo; replace with JWT later
app.use((req, _res, next) => {
	req.adminEmail = req.header('x-admin-email') || 'admin@example.com'
	next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// Test Groq API connection
app.get('/api/test-groq', async (_req, res) => {
	try {
		const { AIService } = await import('./services/aiService.js')
		const testResponse = await AIService.generateAIResponse('What is 2+2?', 'Basic math question')
		res.json({ 
			ok: true, 
			message: 'Groq API is working',
			testResponse: testResponse.substring(0, 100) + '...'
		})
	} catch (error) {
		console.error('Groq API test failed:', error)
		res.status(500).json({ 
			ok: false, 
			error: error.message,
			message: 'Groq API connection failed'
		})
	}
})

// Institutions
app.get('/api/institutions/me', async (req, res) => {
	const doc = await Institution.findOne({ adminEmail: req.adminEmail })
	if (!doc) return res.json({
		name: '', logoUrl: '', address: '', institutionType: 'University', contactEmail: '', contactPhone: ''
	})
	return res.json({
		name: doc.name || '',
		logoUrl: doc.logoUrl || '',
		address: doc.address || '',
		institutionType: doc.institutionType || 'University',
		contactEmail: doc.contactEmail || '',
		contactPhone: doc.contactPhone || '',
	})
})

app.put('/api/institutions/me', async (req, res) => {
	const update = req.body
	const doc = await Institution.findOneAndUpdate(
		{ adminEmail: req.adminEmail },
		{ adminEmail: req.adminEmail, ...update },
		{ new: true, upsert: true }
	)
	return res.json({
		name: doc.name || '',
		logoUrl: doc.logoUrl || '',
		address: doc.address || '',
		institutionType: doc.institutionType || 'University',
		contactEmail: doc.contactEmail || '',
		contactPhone: doc.contactPhone || '',
	})
})

// Programs & Courses
app.post('/api/programs', async (req, res) => {
	const { name } = req.body
	if (!name) return res.status(400).json({ error: 'name required' })
	const doc = await Program.create({ name })
	return res.json(doc)
})

app.post('/api/courses', async (req, res) => {
	const { name } = req.body
	if (!name) return res.status(400).json({ error: 'name required' })
	const doc = await Course.create({ name })
	return res.json(doc)
})

app.get('/api/programs', async (_req, res) => {
	const docs = await Program.find().sort({ createdAt: -1 })
	res.json(docs)
})

app.get('/api/courses', async (_req, res) => {
	const docs = await Course.find().sort({ createdAt: -1 })
	res.json(docs)
})

// Users & Registration
app.get('/api/users', async (_req, res) => {
	const users = await User.find().sort({ createdAt: -1 })
	res.json(users)
})

app.post('/api/users', async (req, res) => {
	const { name, email } = req.body
	let { role } = req.body
	if (!name || !email) return res.status(400).json({ error: 'name and email required' })
	role = String(role || 'teacher').toLowerCase()
	const allowed = ['admin','institution_admin','teacher','student']
	if (!allowed.includes(role)) return res.status(400).json({ error: 'invalid role' })
	const doc = await User.findOneAndUpdate(
		{ email },
		{ name, email, role },
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	)
	res.json(doc)
})

app.post('/api/users/bulk', async (req, res) => {
	const { users } = req.body
	if (!Array.isArray(users)) return res.status(400).json({ error: 'users array required' })
	const allowed = new Set(['admin','institution_admin','teacher','student'])
	const ops = users
		.map(u => ({
			name: u.name?.trim(),
			email: u.email?.trim(),
			role: String(u.role || 'teacher').toLowerCase().trim(),
		}))
		.filter(u => u.name && u.email && allowed.has(u.role))
		.map(u => ({ updateOne: { filter: { email: u.email }, update: { $set: u }, upsert: true } }))

	if (ops.length === 0) return res.status(400).json({ error: 'no valid users' })

	const result = await User.bulkWrite(ops, { ordered: false })
	const inserted = (result.upsertedCount || 0) + (result.modifiedCount || 0)
	res.json({ processed: users.length, inserted })
})

app.post('/api/register', async (req, res) => {
	const { name, email, password } = req.body
	let { role } = req.body
	if (!name || !email || !password) return res.status(400).json({ error: 'name, email, password required' })
	role = String(role || 'admin').toLowerCase()
	if (!['admin','teacher','student'].includes(role)) role = 'admin'
	let user = await User.findOneAndUpdate(
		{ email },
		{ name, email, role, password },
		{ new: true, upsert: true, setDefaultsOnInsert: true }
	)
	if (role === 'admin') {
		await Institution.findOneAndUpdate(
			{ adminEmail: email },
			{ adminEmail: email },
			{ new: true, upsert: true }
		)
	}
	const token = 'dev-token'
	res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } })
})

app.post('/api/login', async (req, res) => {
	const { email, password } = req.body
	if (!email) return res.status(400).json({ error: 'email required' })
	const user = await User.findOne({ email })
	if (!user) return res.status(401).json({ error: 'invalid credentials' })
	const token = 'dev-token'
	res.json({ token, user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role } })
})

// Check if email exists
app.get('/api/users/check-email', async (req, res) => {
	const { email } = req.query
	if (!email) return res.status(400).json({ error: 'email parameter required' })
	
	const user = await User.findOne({ email })
	res.json({ exists: !!user })
})

// Enhanced Teacher Routes with AI and Real-time Features
import multer from 'multer'
import { nanoid } from 'nanoid'
import path from 'path'
import fs from 'fs'

const uploadDir = path.resolve('./uploads')
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir)

const storage = multer.diskStorage({
	destination: function (_req, _file, cb) { cb(null, uploadDir) },
	filename: function (_req, file, cb) { cb(null, `${Date.now()}-${nanoid(6)}-${file.originalname}`) },
})
const upload = multer({ storage })

// File Upload with AI Processing
app.post('/api/teacher/uploads', upload.array('files', 10), async (req, res) => {
	try {
		const teacherEmail = req.adminEmail
		const files = req.files || []
		
		const saved = await Promise.all(files.map(async (f) => {
			const doc = await File.create({
				teacherEmail,
				originalName: f.originalname,
				fileName: f.filename,
				mimeType: f.mimetype,
				size: f.size,
				status: 'uploaded',
				uploadedBy: teacherEmail
			})
			
			// Process file asynchronously
			setImmediate(() => {
				FileProcessor.processFile(doc, teacherEmail).then((result) => {
					// Emit real-time update
					req.io.to(`teacher-${teacherEmail}`).emit('file-processed', {
						fileId: doc._id,
						status: result.success ? 'processed' : 'failed',
						analysis: result.analysis
					})
				})
			})
			
			return doc
		}))
		
		// Emit real-time upload notification
		req.io.to(`teacher-${teacherEmail}`).emit('files-uploaded', {
			count: saved.length,
			files: saved.map(f => ({ id: f._id, name: f.originalName }))
		})
		
		res.json({ uploaded: saved.length, items: saved })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Get files organized by sections
app.get('/api/teacher/files', async (req, res) => {
	try {
		const { section } = req.query
		const teacherEmail = req.adminEmail
		
		const filter = { teacherEmail }
		if (section) filter.section = section
		
		const files = await File.find(filter)
			.sort({ createdAt: -1 })
			.limit(50)
		
		// Group by sections
		const sections = {
			lectures: files.filter(f => f.section === 'lectures'),
			assignments: files.filter(f => f.section === 'assignments'),
			notes: files.filter(f => f.section === 'notes'),
			resources: files.filter(f => f.section === 'resources'),
			quizzes: files.filter(f => f.section === 'quizzes')
		}
		
		res.json({ files, sections })
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// AI Response Management
app.get('/api/teacher/interactions', async (req, res) => {
	try {
		const { type, status } = req.query
		const teacherEmail = req.adminEmail
		
		const filter = { teacherEmail }
		if (type) filter.type = type
		if (status) filter.status = status
		
		const interactions = await StudentInteraction.find(filter)
			.populate('fileId', 'originalName title')
			.populate('quizId', 'title')
			.sort({ createdAt: -1 })
			.limit(100)
		
		res.json(interactions)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Generate AI Response
app.post('/api/teacher/generate-response', async (req, res) => {
	try {
		const { question, context, studentEmail } = req.body
		const teacherEmail = req.adminEmail
		
		if (!question) {
			return res.status(400).json({ error: 'Question is required' })
		}
		
		// Generate AI response
		const aiResponse = await AIService.generateAIResponse(question, context)
		
		// Save interaction
		const interaction = await StudentInteraction.create({
			teacherEmail,
			studentEmail: studentEmail || 'anonymous',
			type: 'question',
			question,
			context,
			aiResponse: {
				content: aiResponse,
				source: 'generated',
				confidence: 0.8
			},
			status: 'answered'
		})
		
		// Emit real-time notification
		req.io.to(`teacher-${teacherEmail}`).emit('new-interaction', {
			interaction,
			message: 'New student question received'
		})
		
		res.json(interaction)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Approve AI Response
app.post('/api/teacher/interactions/:id/approve', async (req, res) => {
	try {
		const interaction = await StudentInteraction.findByIdAndUpdate(
			req.params.id,
			{ 
				'aiResponse.approved': true,
				'aiResponse.approvedAt': new Date(),
				status: 'approved'
			},
			{ new: true }
		)
		
		if (!interaction) {
			return res.status(404).json({ error: 'Interaction not found' })
		}
		
		// Emit real-time update
		req.io.to(`teacher-${interaction.teacherEmail}`).emit('response-approved', {
			interactionId: interaction._id,
			message: 'AI response approved'
		})
		
		res.json(interaction)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Generate Quiz from File Content
app.post('/api/teacher/generate-quiz', async (req, res) => {
	try {
		console.log('Quiz generation request received:', req.body)
		const { fileId, topic, questionCount = 5 } = req.body
		const teacherEmail = req.adminEmail
		
		if (!fileId) {
			return res.status(400).json({ error: 'File ID is required' })
		}
		
		const file = await File.findById(fileId)
		if (!file) {
			console.log('File not found:', fileId)
			return res.status(404).json({ error: 'File not found' })
		}
		
		if (file.teacherEmail !== teacherEmail) {
			console.log('Unauthorized access to file:', fileId, 'by teacher:', teacherEmail)
			return res.status(403).json({ error: 'Unauthorized access to file' })
		}
		
		console.log('File found:', file.originalName, 'Content available:', !!file.aiAnalysis?.summary)
		
		// Extract content from file analysis or use file content directly
		let content = file.aiAnalysis?.summary || file.description || file.originalName
		
		// If we have the actual file content, use it for better quiz generation
		if (file.aiAnalysis?.rawContent) {
			content = file.aiAnalysis.rawContent
		}
		
		console.log('Content length:', content?.length || 0)
		console.log('Using content for quiz generation:', content?.substring(0, 100) + '...')
		
		const quizData = await AIService.generateQuizFromContent(content, topic || file.title)
		console.log('Quiz data generated:', quizData.questions?.length || 0, 'questions')
		
		// Validate quiz data
		if (!quizData.questions || quizData.questions.length === 0) {
			console.log('No questions generated, creating fallback quiz')
			return res.status(400).json({ 
				error: 'Failed to generate quiz questions. Please try again or contact support.',
				details: 'AI service may be unavailable or content insufficient'
			})
		}
		
		// Create quiz
		const quiz = await Quiz.create({
			teacherEmail,
			title: quizData.quizTitle || `Quiz: ${topic || file.title}`,
			description: `Auto-generated quiz from ${file.originalName}`,
			questions: quizData.questions,
			isAIGenerated: true,
			sourceFile: fileId,
			difficulty: file.aiAnalysis?.difficulty || 'medium'
		})
		
		console.log('Quiz created successfully:', quiz._id)
		
		// Emit real-time notification
		req.io.to(`teacher-${teacherEmail}`).emit('quiz-generated', {
			quiz,
			message: 'New quiz generated from file content'
		})
		
		res.json(quiz)
	} catch (error) {
		console.error('Quiz generation error:', error)
		res.status(500).json({ 
			error: 'Failed to generate quiz',
			details: error.message,
			timestamp: new Date().toISOString()
		})
	}
})

// Enhanced Analytics
app.get('/api/teacher/analytics', async (req, res) => {
	try {
		const teacherEmail = req.adminEmail
		
		const [
			totalFiles,
			filesBySection,
			totalInteractions,
			approvedResponses,
			quizStats,
			recentActivity
		] = await Promise.all([
			File.countDocuments({ teacherEmail }),
			File.aggregate([
				{ $match: { teacherEmail } },
				{ $group: { _id: '$section', count: { $sum: 1 } } }
			]),
			StudentInteraction.countDocuments({ teacherEmail }),
			StudentInteraction.countDocuments({ teacherEmail, 'aiResponse.approved': true }),
			Quiz.aggregate([
				{ $match: { teacherEmail } },
				{ $group: { 
					_id: null, 
					totalQuizzes: { $sum: 1 },
					totalAttempts: { $sum: '$totalAttempts' },
					avgScore: { $avg: '$averageScore' }
				}}
			]),
			StudentInteraction.find({ teacherEmail })
				.sort({ createdAt: -1 })
				.limit(10)
				.select('type question createdAt status')
		])
		
		// Calculate participation index
		const participationIndex = Math.min(100, 
			(totalInteractions * 2) + 
			(approvedResponses * 3) + 
			(totalFiles * 1)
		)
		
		// Get weak topics analysis
		const studentResponses = await StudentInteraction.find({ 
			teacherEmail, 
			type: 'quiz_attempt' 
		}).limit(50)
		
		const weakTopics = await AIService.identifyWeakTopics(
			studentResponses, 
			'Course content analysis'
		)
		
		res.json({
			overview: {
				totalFiles,
				totalInteractions,
				approvedResponses,
				participationIndex
			},
			filesBySection: filesBySection.reduce((acc, item) => {
				acc[item._id] = item.count
				return acc
			}, {}),
			quizStats: quizStats[0] || { totalQuizzes: 0, totalAttempts: 0, avgScore: 0 },
			weakTopics: weakTopics.weakTopics || [],
			recentActivity,
			recommendations: weakTopics.recommendations || []
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Get Quizzes
app.get('/api/teacher/quizzes', async (req, res) => {
	try {
		const teacherEmail = req.adminEmail
		const quizzes = await Quiz.find({ teacherEmail })
			.populate('sourceFile', 'originalName title')
			.sort({ createdAt: -1 })
		res.json(quizzes)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/teacher/quizzes/:id', async (req, res) => {
	try {
		const teacherEmail = req.adminEmail
		const quiz = await Quiz.findOne({ _id: req.params.id, teacherEmail })
			.populate('sourceFile', 'originalName title')
		
		if (!quiz) {
			return res.status(404).json({ error: 'Quiz not found' })
		}
		
		res.json(quiz)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Legacy endpoints for backward compatibility
app.get('/api/teacher/uploads', async (req, res) => {
	const items = await File.find({ teacherEmail: req.adminEmail }).sort({ createdAt: -1 })
	res.json(items)
})

app.get('/api/teacher/responses', async (req, res) => {
	const items = await StudentInteraction.find({ teacherEmail: req.adminEmail }).sort({ createdAt: -1 })
	res.json(items)
})

// Student Routes
app.get('/api/student/courses', async (req, res) => {
	try {
		const studentEmail = req.adminEmail
		
		// Get all courses with documents and quizzes
		const courses = await Course.find()
			.populate('documents')
			.populate('quizzes')
		
		// Filter courses that have content
		const coursesWithContent = courses.filter(course => 
			course.documents?.length > 0 || course.quizzes?.length > 0
		)
		
		res.json(coursesWithContent)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/student/quizzes', async (req, res) => {
	try {
		const studentEmail = req.adminEmail
		
		// Get all available quizzes
		const quizzes = await Quiz.find({ isActive: true })
			.populate('sourceFile', 'originalName title')
			.sort({ createdAt: -1 })
		
		res.json(quizzes)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/student/quizzes/:id/submit', async (req, res) => {
	try {
		const { answers } = req.body
		const quizId = req.params.id
		const studentEmail = req.adminEmail
		
		const quiz = await Quiz.findById(quizId)
		if (!quiz) {
			return res.status(404).json({ error: 'Quiz not found' })
		}
		
		// Calculate score
		let correctAnswers = 0
		const totalQuestions = quiz.questions.length
		
		quiz.questions.forEach((question, index) => {
			if (answers[question._id] === question.correctAnswer) {
				correctAnswers++
			}
		})
		
		const score = Math.round((correctAnswers / totalQuestions) * 100)
		
		// Save quiz attempt
		const attempt = {
			studentEmail,
			quizId,
			answers,
			score,
			correctAnswers,
			totalQuestions,
			submittedAt: new Date()
		}
		
		// Update quiz statistics
		await Quiz.findByIdAndUpdate(quizId, {
			$inc: { totalAttempts: 1 },
			$push: { attempts: attempt }
		})
		
		res.json({
			score,
			correctAnswers,
			totalQuestions,
			attempt
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/student/progress', async (req, res) => {
	try {
		const studentEmail = req.adminEmail
		
		// Get quiz attempts
		const quizzes = await Quiz.find({ 'attempts.studentEmail': studentEmail })
		
		let totalQuizzes = 0
		let totalScore = 0
		let quizzesCompleted = 0
		
		quizzes.forEach(quiz => {
			const studentAttempts = quiz.attempts.filter(attempt => attempt.studentEmail === studentEmail)
			if (studentAttempts.length > 0) {
				quizzesCompleted++
				totalScore += studentAttempts[studentAttempts.length - 1].score
			}
		})
		
		const averageScore = quizzesCompleted > 0 ? Math.round(totalScore / quizzesCompleted) : 0
		
		// Get notes count
		const notesCount = await StudentNote.countDocuments({ studentEmail })
		
		// Get questions asked count
		const questionsCount = await StudentInteraction.countDocuments({ studentEmail })
		
		res.json({
			quizzesCompleted,
			averageScore,
			notesSaved: notesCount,
			questionsAsked: questionsCount,
			totalQuizzes: quizzes.length
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/student/notes', async (req, res) => {
	try {
		const { title, content, courseId } = req.body
		const studentEmail = req.adminEmail
		
		const note = await StudentNote.create({
			studentEmail,
			title,
			content,
			courseId
		})
		
		res.json(note)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/student/notes', async (req, res) => {
	try {
		const studentEmail = req.adminEmail
		
		const notes = await StudentNote.find({ studentEmail })
			.sort({ createdAt: -1 })
		
		res.json(notes)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/student/ai/ask', async (req, res) => {
	try {
		const { question, courseId } = req.body
		const studentEmail = req.adminEmail
		
		// Get course-specific content if courseId provided
		let context = ''
		if (courseId) {
			const course = await Course.findById(courseId).populate('documents')
			if (course && course.documents) {
				context = course.documents.map(doc => doc.aiAnalysis?.summary || doc.title).join(' ')
			}
		}
		
		// Generate AI response
		const aiResponse = await AIService.generateStudentResponse(question, context, studentEmail)
		
		// Save interaction
		const interaction = await StudentInteraction.create({
			studentEmail,
			courseId,
			question,
			aiResponse: {
				content: aiResponse.content,
				sources: aiResponse.sources || [],
				confidence: aiResponse.confidence || 0.8
			},
			status: 'answered'
		})
		
		res.json(interaction)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/student/ai/interactions', async (req, res) => {
	try {
		const studentEmail = req.adminEmail
		
		const interactions = await StudentInteraction.find({ studentEmail })
			.populate('courseId', 'name')
			.sort({ createdAt: -1 })
		
		res.json(interactions)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/student/ai/personalized', async (req, res) => {
	try {
		const { learningStyle, pace } = req.body
		const studentEmail = req.adminEmail
		
		// Get student's performance data
		const progress = await Quiz.find({ 'attempts.studentEmail': studentEmail })
		
		// Analyze performance and generate personalized recommendations
		const recommendations = await AIService.generatePersonalizedRecommendations(
			progress, 
			learningStyle, 
			pace
		)
		
		res.json(recommendations)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))


