import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { createServer } from 'http'
import { Server } from 'socket.io'
import integrationRoutes from './api/routes/integrationRoutes.js'

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

// Seed database with educational data
try {
	const userCount = await User.countDocuments()
	if (userCount === 0) {
		console.log('🌱 No users found, seeding database with educational data...')
		await seedDatabase()
		console.log('✅ Database seeded successfully!')
	} else {
		console.log(`📊 Database already contains ${userCount} users`)
	}
} catch (error) {
	console.error('❌ Database seeding error:', error.message)
}

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
import User from './models/User.js'
import { FileProcessor } from './services/fileProcessor.js'
import { AIService } from './services/aiService.js'
import { seedDatabase } from './seeds/educationalData.js'
import Institution from './models/Institution.js'
import Program from './models/Program.js'
import Course from './models/Course.js'

// Admin Content Management Models
const appTextSchema = new mongoose.Schema({
	key: { type: String, required: true, unique: true },
	value: { type: String, required: true },
	language: { type: String, required: true, default: 'en' },
	category: { type: String, enum: ['ui', 'messages', 'errors', 'help', 'voice', 'tutorials'], required: true },
	description: String,
	isHtml: { type: Boolean, default: false },
	variables: [String],
	updatedBy: String
}, { timestamps: true })

const appPageSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	title: { type: String, required: true },
	description: String,
	content: { type: String, required: true },
	language: { type: String, required: true, default: 'en' },
	route: { type: String, required: true, unique: true },
	isActive: { type: Boolean, default: true },
	isPublic: { type: Boolean, default: false },
	metaTitle: String,
	metaDescription: String,
	metaKeywords: [String],
	template: { type: String, default: 'default' },
	components: [{
		id: String,
		type: { type: String, enum: ['text', 'image', 'video', 'form', 'chart', 'voice', 'interactive'] },
		content: String,
		props: mongoose.Schema.Types.Mixed,
		order: Number,
		isVisible: { type: Boolean, default: true },
		conditions: [{
			field: String,
			operator: { type: String, enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'] },
			value: mongoose.Schema.Types.Mixed
		}]
	}],
	updatedBy: String,
	publishedAt: Date,
	publishedBy: String
}, { timestamps: true })

const voiceCommandTemplateSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: String,
	command: { type: String, required: true },
	intent: { type: String, required: true },
	response: { type: String, required: true },
	category: { type: String, enum: ['navigation', 'action', 'query', 'help', 'tutorial'], required: true },
	language: { type: String, required: true, default: 'en' },
	isActive: { type: Boolean, default: true },
	requiresAuth: { type: Boolean, default: false },
	permissions: [String],
	variables: [String],
	examples: [String],
	updatedBy: String
}, { timestamps: true })

const AppText = mongoose.model('AppText', appTextSchema)
const AppPage = mongoose.model('AppPage', appPageSchema)
const VoiceCommandTemplate = mongoose.model('VoiceCommandTemplate', voiceCommandTemplateSchema)

// Email Alerts Models
const emailAlertSchema = new mongoose.Schema({
	name: { type: String, required: true },
	description: String,
	type: { type: String, enum: ['error', 'performance', 'security', 'system', 'user', 'voice', 'custom'], required: true },
	condition: {
		metric: { type: String, required: true },
		operator: { type: String, enum: ['greater_than', 'less_than', 'equals', 'not_equals', 'contains', 'not_contains'], required: true },
		threshold: mongoose.Schema.Types.Mixed,
		duration: Number,
		aggregation: { type: String, enum: ['sum', 'avg', 'max', 'min', 'count'] },
		timeWindow: Number
	},
	recipients: [String],
	template: { type: String, required: true },
	isActive: { type: Boolean, default: true },
	cooldown: { type: Number, default: 60 }, // minutes
	lastTriggered: Date,
	triggerCount: { type: Number, default: 0 },
	createdBy: String
}, { timestamps: true })

const alertTemplateSchema = new mongoose.Schema({
	name: { type: String, required: true },
	type: { type: String, required: true },
	subject: { type: String, required: true },
	body: { type: String, required: true },
	variables: [String],
	isHtml: { type: Boolean, default: false }
}, { timestamps: true })

const alertHistorySchema = new mongoose.Schema({
	alertId: { type: String, required: true },
	alertName: { type: String, required: true },
	triggeredAt: { type: Date, required: true },
	resolvedAt: Date,
	status: { type: String, enum: ['triggered', 'resolved', 'acknowledged'], default: 'triggered' },
	value: mongoose.Schema.Types.Mixed,
	threshold: mongoose.Schema.Types.Mixed,
	message: String,
	recipients: [String],
	acknowledgedBy: String,
	acknowledgedAt: Date,
	resolution: String
}, { timestamps: true })

const emailConfigSchema = new mongoose.Schema({
	smtp: {
		host: { type: String, required: true },
		port: { type: Number, required: true },
		secure: { type: Boolean, default: false },
		username: { type: String, required: true },
		password: { type: String, required: true }
	},
	from: {
		name: { type: String, required: true },
		email: { type: String, required: true }
	},
	replyTo: String,
	templates: {
		default: String,
		error: String,
		performance: String,
		security: String
	}
}, { timestamps: true })

const EmailAlert = mongoose.model('EmailAlert', emailAlertSchema)
const AlertTemplate = mongoose.model('AlertTemplate', alertTemplateSchema)
const AlertHistory = mongoose.model('AlertHistory', alertHistorySchema)
const EmailConfig = mongoose.model('EmailConfig', emailConfigSchema)

// RBAC Models
const roleSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	description: String,
	permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
	isActive: { type: Boolean, default: true },
	createdBy: String
}, { timestamps: true })

const permissionSchema = new mongoose.Schema({
	name: { type: String, required: true, unique: true },
	description: String,
	category: { type: String, required: true },
	resource: { type: String, required: true },
	action: { type: String, required: true },
	isActive: { type: Boolean, default: true },
	createdBy: String
}, { timestamps: true })

const userRoleSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
	roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role', required: true },
	assignedBy: String,
	assignedAt: { type: Date, default: Date.now },
	isActive: { type: Boolean, default: true },
	expiresAt: Date
}, { timestamps: true })

const Role = mongoose.model('Role', roleSchema)
const Permission = mongoose.model('Permission', permissionSchema)
const UserRole = mongoose.model('UserRole', userRoleSchema)

// Simple logging models (not used in simple implementation)

// Simple auth stub: read admin email from header for demo; replace with JWT later
app.use((req, _res, next) => {
	req.adminEmail = req.header('x-admin-email') || 'admin@example.com'
	next()
})

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// API Integration Routes
app.use('/api', integrationRoutes)

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

// Admin Analytics Endpoints
app.get('/api/admin/analytics/users', async (req, res) => {
	try {
		const { startDate, endDate, granularity = 'day' } = req.query
		
		// Get user analytics from real database
		const totalUsers = await User.countDocuments()
		const activeUsers = await User.countDocuments({
			lastLogin: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
		})
		
		const start = new Date(startDate)
		const end = new Date(endDate)
		const newUsers = await User.countDocuments({
			createdAt: { $gte: start, $lte: end }
		})
		
		// Get user distribution by role from real data
		const userDistribution = await User.aggregate([
			{ $group: { _id: '$role', count: { $sum: 1 } } },
			{ $project: { role: '$_id', count: 1, _id: 0 } }
		])
		
		// Get top users by activity
		const topUsers = await User.aggregate([
			{ $match: { lastLogin: { $exists: true } } },
			{ $sort: { lastLogin: -1 } },
			{ $limit: 5 },
			{ $project: { 
				userId: '$_id', 
				userName: '$name', 
				sessions: { $add: [1, { $floor: { $divide: [{ $subtract: [new Date(), '$lastLogin'] }, 86400000] } }] },
				lastActive: '$lastLogin',
				_id: 0
			}}
		])
		
		// Generate user growth data based on actual user creation dates
		const userGrowth = await User.aggregate([
			{ $match: { createdAt: { $gte: start, $lte: end } } },
			{ $group: { 
				_id: { 
					$dateToString: { 
						format: granularity === 'day' ? '%Y-%m-%d' : 
							   granularity === 'week' ? '%Y-%U' : 
							   granularity === 'month' ? '%Y-%m' : '%Y-%m-%d',
						date: '$createdAt'
					}
				},
				count: { $sum: 1 }
			}},
			{ $sort: { _id: 1 } },
			{ $project: { date: '$_id', count: 1, _id: 0 } }
		])
		
		res.json({
			totalUsers,
			activeUsers,
			newUsers,
			returningUsers: Math.max(0, activeUsers - newUsers),
			userGrowth,
			userRetention: [
				{ period: 'Day 1', rate: 0.85 },
				{ period: 'Day 7', rate: 0.65 },
				{ period: 'Day 30', rate: 0.45 }
			],
			userDistribution,
			topUsers
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/analytics/voice', async (req, res) => {
	try {
		const { startDate, endDate, granularity = 'day' } = req.query
		
		// Generate mock voice analytics data
		const start = new Date(startDate)
		const end = new Date(endDate)
		
		const commandTrends = generateMockTimeSeriesData(start, end, granularity, 10, 100, 'successRate')
		
		res.json({
			totalCommands: Math.floor(Math.random() * 1000) + 500,
			successfulCommands: Math.floor(Math.random() * 800) + 400,
			failedCommands: Math.floor(Math.random() * 100) + 50,
			averageConfidence: 0.85 + Math.random() * 0.1,
			averageProcessingTime: 150 + Math.random() * 100,
			topCommands: [
				{ command: 'Create quiz', count: 45, successRate: 0.92 },
				{ command: 'Upload file', count: 38, successRate: 0.88 },
				{ command: 'Generate content', count: 32, successRate: 0.85 },
				{ command: 'Analyze document', count: 28, successRate: 0.90 },
				{ command: 'Answer question', count: 25, successRate: 0.87 }
			],
			commandTrends,
			languageDistribution: [
				{ language: 'English', count: 85 },
				{ language: 'Spanish', count: 10 },
				{ language: 'French', count: 5 }
			],
			categoryDistribution: [
				{ category: 'Content Creation', count: 40 },
				{ category: 'File Management', count: 30 },
				{ category: 'Quiz Generation', count: 20 },
				{ category: 'Analysis', count: 10 }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/analytics/performance', async (req, res) => {
	try {
		const { startDate, endDate, granularity = 'day' } = req.query
		
		// Generate mock performance data
		res.json({
			averageResponseTime: 120 + Math.random() * 80,
			systemUptime: 99.5 + Math.random() * 0.4,
			errorRate: Math.random() * 2,
			throughput: 50 + Math.random() * 30,
			memoryUsage: 60 + Math.random() * 20,
			cpuUsage: 40 + Math.random() * 30,
			databasePerformance: {
				averageQueryTime: 25 + Math.random() * 15,
				slowQueries: Math.floor(Math.random() * 10),
				connectionPool: 80 + Math.random() * 15
			},
			apiPerformance: [
				{ endpoint: '/api/teacher/uploads', averageTime: 150, errorRate: 0.5 },
				{ endpoint: '/api/teacher/generate-quiz', averageTime: 2000, errorRate: 2.1 },
				{ endpoint: '/api/student/quizzes', averageTime: 80, errorRate: 0.8 },
				{ endpoint: '/api/users', averageTime: 60, errorRate: 0.2 },
				{ endpoint: '/api/institutions/me', averageTime: 45, errorRate: 0.1 }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/analytics/errors', async (req, res) => {
	try {
		const { startDate, endDate, granularity = 'day' } = req.query
		
		// Generate mock error analytics
		const start = new Date(startDate)
		const end = new Date(endDate)
		const errorTrends = generateMockTimeSeriesData(start, end, granularity, 0, 20, 'level')
		
		res.json({
			totalErrors: Math.floor(Math.random() * 100) + 50,
			criticalErrors: Math.floor(Math.random() * 10) + 5,
			errorRate: Math.random() * 3,
			errorTrends,
			topErrors: [
				{ error: 'File upload failed', count: 15, level: 'error', lastOccurred: new Date().toISOString() },
				{ error: 'AI service timeout', count: 12, level: 'warning', lastOccurred: new Date().toISOString() },
				{ error: 'Database connection lost', count: 8, level: 'critical', lastOccurred: new Date().toISOString() },
				{ error: 'Quiz generation failed', count: 6, level: 'error', lastOccurred: new Date().toISOString() },
				{ error: 'Authentication failed', count: 4, level: 'warning', lastOccurred: new Date().toISOString() }
			],
			errorCategories: [
				{ category: 'File Processing', count: 25, percentage: 40 },
				{ category: 'AI Services', count: 20, percentage: 32 },
				{ category: 'Database', count: 10, percentage: 16 },
				{ category: 'Authentication', count: 7, percentage: 12 }
			],
			resolutionTime: [
				{ level: 'critical', averageTime: 5 },
				{ level: 'error', averageTime: 15 },
				{ level: 'warning', averageTime: 30 }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/analytics/system', async (req, res) => {
	try {
		// Generate mock system health data
		const memoryUsage = 65 + Math.random() * 20
		const cpuUsage = 45 + Math.random() * 25
		const diskUsage = 55 + Math.random() * 15
		
		res.json({
			systemHealth: memoryUsage > 90 || cpuUsage > 90 ? 'critical' : 
				memoryUsage > 80 || cpuUsage > 80 ? 'warning' : 'healthy',
			uptime: 99.2 + Math.random() * 0.7,
			lastRestart: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
			version: '1.0.0',
			environment: 'production',
			resources: {
				memory: { 
					used: memoryUsage, 
					total: 100, 
					percentage: memoryUsage 
				},
				disk: { 
					used: diskUsage, 
					total: 100, 
					percentage: diskUsage 
				},
				cpu: { 
					usage: cpuUsage, 
					cores: 8 
				}
			},
			services: [
				{ name: 'API Server', status: 'running', uptime: 99.5 },
				{ name: 'Database', status: 'running', uptime: 99.8 },
				{ name: 'AI Service', status: 'running', uptime: 98.9 },
				{ name: 'File Processor', status: 'running', uptime: 99.2 },
				{ name: 'WebSocket', status: 'running', uptime: 99.1 }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Helper function to generate mock time series data
function generateMockTimeSeriesData(startDate, endDate, granularity, minValue = 0, maxValue = 100, extraField = null) {
	const data = []
	const start = new Date(startDate)
	const end = new Date(endDate)
	
	let current = new Date(start)
	const increment = granularity === 'hour' ? 60 * 60 * 1000 : 
		granularity === 'day' ? 24 * 60 * 60 * 1000 :
		granularity === 'week' ? 7 * 24 * 60 * 60 * 1000 :
		30 * 24 * 60 * 60 * 1000 // month
	
	while (current <= end) {
		const point = {
			date: current.toISOString().split('T')[0],
			count: Math.floor(Math.random() * (maxValue - minValue) + minValue)
		}
		
		if (extraField === 'successRate') {
			point.successRate = Math.random() * 0.2 + 0.8
		} else if (extraField === 'level') {
			point.level = ['critical', 'error', 'warning'][Math.floor(Math.random() * 3)]
		}
		
		data.push(point)
		current = new Date(current.getTime() + increment)
	}
	
	return data
}

// Additional Admin Stats Endpoints
app.get('/api/admin/analytics/real-time', async (req, res) => {
	try {
		// Generate real-time metrics
		res.json({
			activeUsers: Math.floor(Math.random() * 50) + 10,
			currentSessions: Math.floor(Math.random() * 100) + 20,
			requestsPerMinute: Math.floor(Math.random() * 200) + 50,
			errorRate: Math.random() * 2,
			averageResponseTime: 100 + Math.random() * 100,
			systemLoad: 40 + Math.random() * 40,
			memoryUsage: 60 + Math.random() * 20,
			timestamp: new Date().toISOString()
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/stats', async (req, res) => {
	try {
		res.json({
			totalLogs: Math.floor(Math.random() * 1000) + 500,
			errorLogs: Math.floor(Math.random() * 100) + 50,
			warningLogs: Math.floor(Math.random() * 200) + 100,
			infoLogs: Math.floor(Math.random() * 700) + 300,
			criticalLogs: Math.floor(Math.random() * 20) + 5,
			recentLogs: [
				{ level: 'error', message: 'File upload failed', timestamp: new Date().toISOString() },
				{ level: 'warning', message: 'High memory usage detected', timestamp: new Date().toISOString() },
				{ level: 'info', message: 'User login successful', timestamp: new Date().toISOString() }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/content/stats', async (req, res) => {
	try {
		const totalFiles = await File.countDocuments()
		const totalQuizzes = await Quiz.countDocuments()
		const totalCourses = await Course.countDocuments()
		const totalPrograms = await Program.countDocuments()
		
		// Get files by type with proper formatting
		const filesByType = await File.aggregate([
			{ $group: { _id: '$mimeType', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 5 },
			{ $project: { 
				type: { 
					$switch: {
						branches: [
							{ case: { $eq: ['$_id', 'application/pdf'] }, then: 'PDF' },
							{ case: { $eq: ['$_id', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'] }, then: 'Word Document' },
							{ case: { $eq: ['$_id', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'] }, then: 'PowerPoint' },
							{ case: { $eq: ['$_id', 'text/plain'] }, then: 'Text File' },
							{ case: { $eq: ['$_id', 'image/jpeg'] }, then: 'JPEG Image' },
							{ case: { $eq: ['$_id', 'image/png'] }, then: 'PNG Image' }
						],
						default: 'Other'
					}
				},
				count: 1,
				_id: 0
			}}
		])
		
		// Get recent uploads with better formatting
		const recentUploads = await File.find()
			.sort({ createdAt: -1 })
			.limit(5)
			.select('originalName createdAt status section teacherEmail')
			.populate('teacherEmail', 'name', 'User')
		
		res.json({
			totalFiles,
			totalQuizzes,
			totalCourses,
			totalPrograms,
			filesByType,
			recentUploads: recentUploads.map(file => ({
				...file.toObject(),
				teacherName: file.teacherEmail?.name || 'Unknown'
			})),
			// Additional stats
			processedFiles: await File.countDocuments({ status: 'processed' }),
			failedFiles: await File.countDocuments({ status: 'failed' }),
			activeQuizzes: await Quiz.countDocuments({ isActive: true }),
			averageQuizScore: await Quiz.aggregate([
				{ $match: { averageScore: { $exists: true } } },
				{ $group: { _id: null, avgScore: { $avg: '$averageScore' } } }
			])
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/alerts/stats', async (req, res) => {
	try {
		res.json({
			totalAlerts: Math.floor(Math.random() * 50) + 20,
			activeAlerts: Math.floor(Math.random() * 10) + 5,
			criticalAlerts: Math.floor(Math.random() * 5) + 2,
			alertsByType: [
				{ type: 'System', count: Math.floor(Math.random() * 20) + 10 },
				{ type: 'User', count: Math.floor(Math.random() * 15) + 8 },
				{ type: 'Security', count: Math.floor(Math.random() * 10) + 5 },
				{ type: 'Performance', count: Math.floor(Math.random() * 12) + 6 }
			],
			recentAlerts: [
				{ type: 'System', message: 'High CPU usage detected', level: 'warning', timestamp: new Date().toISOString() },
				{ type: 'Security', message: 'Multiple failed login attempts', level: 'critical', timestamp: new Date().toISOString() }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/rbac/stats', async (req, res) => {
	try {
		const userStats = await User.aggregate([
			{ $group: { _id: '$role', count: { $sum: 1 } } }
		])
		
		res.json({
			totalUsers: await User.countDocuments(),
			usersByRole: userStats,
			activePermissions: Math.floor(Math.random() * 100) + 50,
			totalRoles: 4, // admin, institution_admin, teacher, student
			recentActivity: [
				{ action: 'User created', user: 'admin@example.com', timestamp: new Date().toISOString() },
				{ action: 'Role updated', user: 'teacher@example.com', timestamp: new Date().toISOString() },
				{ action: 'Permission granted', user: 'student@example.com', timestamp: new Date().toISOString() }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Socket.IO namespace for real-time analytics
const analyticsNamespace = io.of('/admin/analytics/real-time')

analyticsNamespace.on('connection', (socket) => {
	console.log('Real-time analytics client connected:', socket.id)
	
	// Send real-time updates every 5 seconds
	const interval = setInterval(() => {
		const metrics = {
			activeUsers: Math.floor(Math.random() * 50) + 10,
			currentSessions: Math.floor(Math.random() * 100) + 20,
			requestsPerMinute: Math.floor(Math.random() * 200) + 50,
			errorRate: Math.random() * 2,
			averageResponseTime: 100 + Math.random() * 100,
			systemLoad: 40 + Math.random() * 40,
			memoryUsage: 60 + Math.random() * 20,
			timestamp: new Date().toISOString()
		}
		socket.emit('metrics', metrics)
	}, 5000)
	
	socket.on('disconnect', () => {
		console.log('Real-time analytics client disconnected:', socket.id)
		clearInterval(interval)
	})
})

// Logging Endpoints
app.get('/api/admin/logs/sessions', async (req, res) => {
	try {
		const { startDate, endDate, limit = 50, offset = 0, sortBy = 'sessionStart', sortOrder = 'desc' } = req.query
		
		// Generate mock session data
		const sessions = []
		const sessionCount = Math.min(parseInt(limit), 50)
		
		for (let i = 0; i < sessionCount; i++) {
			const startTime = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
			const endTime = Math.random() > 0.3 ? new Date(startTime.getTime() + Math.random() * 2 * 60 * 60 * 1000) : null
			
			sessions.push({
				id: `session_${Date.now()}_${i}`,
				userId: `user_${Math.floor(Math.random() * 10) + 1}`,
				userName: `User ${Math.floor(Math.random() * 10) + 1}`,
				userRole: ['admin', 'teacher', 'student'][Math.floor(Math.random() * 3)],
				sessionStart: startTime.toISOString(),
				sessionEnd: endTime?.toISOString(),
				duration: endTime ? Math.floor((endTime - startTime) / 1000 / 60) : null,
				ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
				userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				deviceType: ['desktop', 'mobile', 'tablet'][Math.floor(Math.random() * 3)],
				browser: 'Chrome',
				os: 'Windows 10',
				location: {
					country: 'United States',
					city: 'New York',
					timezone: 'America/New_York'
				},
				actions: [],
				status: endTime ? 'expired' : 'active'
			})
		}
		
		res.json(sessions)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/sessions/:sessionId', async (req, res) => {
	try {
		const sessionId = req.params.sessionId
		
		// Generate mock session detail
		const session = {
			id: sessionId,
			userId: 'user_1',
			userName: 'John Doe',
			userRole: 'teacher',
			sessionStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			sessionEnd: null,
			duration: null,
			ipAddress: '192.168.1.100',
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			deviceType: 'desktop',
			browser: 'Chrome',
			os: 'Windows 10',
			location: {
				country: 'United States',
				city: 'New York',
				timezone: 'America/New_York'
			},
			actions: [
				{
					id: 'action_1',
					sessionId: sessionId,
					action: 'login',
					timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
					details: { method: 'email' },
					success: true,
					duration: 150
				},
				{
					id: 'action_2',
					sessionId: sessionId,
					action: 'upload_file',
					timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
					details: { fileName: 'document.pdf', size: 1024000 },
					success: true,
					duration: 2000
				}
			],
			status: 'active'
		}
		
		res.json(session)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/logs/sessions/:sessionId/terminate', async (req, res) => {
	try {
		const sessionId = req.params.sessionId
		
		// Mock session termination
		res.json({ 
			success: true, 
			message: `Session ${sessionId} terminated successfully`,
			terminatedAt: new Date().toISOString()
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/sessions/:sessionId/actions', async (req, res) => {
	try {
		const sessionId = req.params.sessionId
		
		// Generate mock session actions
		const actions = [
			{
				id: 'action_1',
				sessionId: sessionId,
				action: 'login',
				timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
				details: { method: 'email' },
				success: true,
				duration: 150
			},
			{
				id: 'action_2',
				sessionId: sessionId,
				action: 'upload_file',
				timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
				details: { fileName: 'document.pdf', size: 1024000 },
				success: true,
				duration: 2000
			},
			{
				id: 'action_3',
				sessionId: sessionId,
				action: 'generate_quiz',
				timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
				details: { fileId: 'file_123', questions: 5 },
				success: true,
				duration: 5000
			}
		]
		
		res.json(actions)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/voice-commands', async (req, res) => {
	try {
		const { startDate, endDate, limit = 50, offset = 0 } = req.query
		
		// Generate mock voice command data
		const commands = []
		const commandCount = Math.min(parseInt(limit), 50)
		const commandTypes = ['create_quiz', 'upload_file', 'analyze_document', 'generate_content', 'answer_question']
		
		for (let i = 0; i < commandCount; i++) {
			const command = commandTypes[Math.floor(Math.random() * commandTypes.length)]
			const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
			
			commands.push({
				id: `cmd_${Date.now()}_${i}`,
				userId: `user_${Math.floor(Math.random() * 10) + 1}`,
				sessionId: `session_${Math.floor(Math.random() * 20) + 1}`,
				command: command.replace('_', ' '),
				intent: command,
				confidence: 0.7 + Math.random() * 0.3,
				timestamp: timestamp.toISOString(),
				response: `Successfully executed ${command.replace('_', ' ')}`,
				success: Math.random() > 0.1,
				processingTime: 500 + Math.random() * 2000,
				language: 'en',
				context: { source: 'voice_input' }
			})
		}
		
		res.json(commands)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/voice-commands/stats', async (req, res) => {
	try {
		res.json({
			totalCommands: Math.floor(Math.random() * 1000) + 500,
			successfulCommands: Math.floor(Math.random() * 800) + 400,
			failedCommands: Math.floor(Math.random() * 100) + 50,
			averageConfidence: 0.8 + Math.random() * 0.15,
			averageProcessingTime: 1000 + Math.random() * 1000,
			topCommands: [
				{ command: 'create quiz', count: 45 },
				{ command: 'upload file', count: 38 },
				{ command: 'analyze document', count: 32 },
				{ command: 'generate content', count: 28 },
				{ command: 'answer question', count: 25 }
			],
			languageDistribution: [
				{ language: 'English', count: 85 },
				{ language: 'Spanish', count: 10 },
				{ language: 'French', count: 5 }
			]
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/logs/voice-commands/:id', async (req, res) => {
	try {
		const commandId = req.params.id
		const updateData = req.body
		
		// Mock command update
		res.json({
			id: commandId,
			...updateData,
			updatedAt: new Date().toISOString()
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/errors', async (req, res) => {
	try {
		const { startDate, endDate, limit = 50, offset = 0, level, category } = req.query
		
		// Generate mock error data
		const errors = []
		const errorCount = Math.min(parseInt(limit), 50)
		const errorTypes = [
			{ level: 'error', category: 'api', message: 'File upload failed' },
			{ level: 'warning', category: 'system', message: 'High memory usage detected' },
			{ level: 'critical', category: 'database', message: 'Database connection lost' },
			{ level: 'error', category: 'voice', message: 'Voice command processing failed' },
			{ level: 'warning', category: 'ui', message: 'Component rendering issue' },
			{ level: 'info', category: 'authentication', message: 'User login attempt' }
		]
		
		for (let i = 0; i < errorCount; i++) {
			const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)]
			const timestamp = new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
			
			errors.push({
				id: `error_${Date.now()}_${i}`,
				level: errorType.level,
				category: errorType.category,
				message: errorType.message,
				stack: errorType.level === 'error' || errorType.level === 'critical' ? 
					`Error: ${errorType.message}\n    at Function.processFile (/app/services/fileProcessor.js:45:12)\n    at async FileProcessor.process (/app/services/fileProcessor.js:23:8)` : undefined,
				timestamp: timestamp.toISOString(),
				userId: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 10) + 1}` : undefined,
				sessionId: Math.random() > 0.3 ? `session_${Math.floor(Math.random() * 20) + 1}` : undefined,
				requestId: `req_${Math.random().toString(36).substr(2, 9)}`,
				metadata: {
					userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
					ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
					endpoint: '/api/teacher/uploads'
				},
				resolved: Math.random() > 0.7,
				resolvedAt: Math.random() > 0.7 ? new Date(timestamp.getTime() + Math.random() * 60 * 60 * 1000).toISOString() : undefined,
				resolvedBy: Math.random() > 0.7 ? 'admin@example.com' : undefined
			})
		}
		
		res.json(errors)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/errors/:errorId', async (req, res) => {
	try {
		const errorId = req.params.errorId
		
		// Generate mock error detail
		const error = {
			id: errorId,
			level: 'error',
			category: 'api',
			message: 'File upload failed',
			stack: `Error: File upload failed\n    at Function.processFile (/app/services/fileProcessor.js:45:12)\n    at async FileProcessor.process (/app/services/fileProcessor.js:23:8)`,
			timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			userId: 'user_1',
			sessionId: 'session_1',
			requestId: 'req_abc123',
			metadata: {
				userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
				ipAddress: '192.168.1.100',
				endpoint: '/api/teacher/uploads',
				fileName: 'document.pdf',
				fileSize: 1024000
			},
			resolved: false,
			resolvedAt: undefined,
			resolvedBy: undefined
		}
		
		res.json(error)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/logs/errors/:errorId/resolve', async (req, res) => {
	try {
		const errorId = req.params.errorId
		const { resolvedBy } = req.body
		
		// Mock error resolution
		res.json({
			success: true,
			message: `Error ${errorId} resolved successfully`,
			resolvedBy: resolvedBy,
			resolvedAt: new Date().toISOString()
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/logs/errors', async (req, res) => {
	try {
		const errorData = req.body
		
		// Mock error creation
		const newError = {
			id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			...errorData,
			timestamp: new Date().toISOString(),
			resolved: false
		}
		
		res.status(201).json(newError)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/logs/export/:type', async (req, res) => {
	try {
		const { type } = req.params
		const { format = 'csv' } = req.query
		
		// Mock export functionality
		const exportData = {
			type: type,
			format: format,
			generatedAt: new Date().toISOString(),
			recordCount: Math.floor(Math.random() * 1000) + 100,
			downloadUrl: `/downloads/logs_${type}_${Date.now()}.${format}`
		}
		
		res.json(exportData)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Admin Content Management Endpoints
// App Text Management
app.get('/api/admin/content/texts', async (req, res) => {
	try {
		const { language, category, search, limit = 50, offset = 0 } = req.query
		
		let filter = {}
		if (language) filter.language = language
		if (category) filter.category = category
		if (search) {
			filter.$or = [
				{ key: { $regex: search, $options: 'i' } },
				{ value: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			]
		}
		
		const texts = await AppText.find(filter)
			.sort({ updatedAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset))
		
		res.json(texts)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/content/texts/:id', async (req, res) => {
	try {
		const text = await AppText.findById(req.params.id)
		if (!text) return res.status(404).json({ error: 'Text not found' })
		res.json(text)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/content/texts', async (req, res) => {
	try {
		const text = await AppText.create({
			...req.body,
			updatedBy: req.adminEmail
		})
		res.status(201).json(text)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/content/texts/:id', async (req, res) => {
	try {
		const text = await AppText.findByIdAndUpdate(
			req.params.id,
			{ ...req.body, updatedBy: req.adminEmail },
			{ new: true }
		)
		if (!text) return res.status(404).json({ error: 'Text not found' })
		res.json(text)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/content/texts/:id', async (req, res) => {
	try {
		const text = await AppText.findByIdAndDelete(req.params.id)
		if (!text) return res.status(404).json({ error: 'Text not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// App Pages Management
app.get('/api/admin/content/pages', async (req, res) => {
	try {
		const { language, isActive, isPublic, search, limit = 50, offset = 0 } = req.query
		
		let filter = {}
		if (language) filter.language = language
		if (isActive !== undefined) filter.isActive = isActive === 'true'
		if (isPublic !== undefined) filter.isPublic = isPublic === 'true'
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ title: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			]
		}
		
		const pages = await AppPage.find(filter)
			.sort({ updatedAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset))
		
		res.json(pages)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/content/pages/:id', async (req, res) => {
	try {
		const page = await AppPage.findById(req.params.id)
		if (!page) return res.status(404).json({ error: 'Page not found' })
		res.json(page)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/content/pages', async (req, res) => {
	try {
		const page = await AppPage.create({
			...req.body,
			updatedBy: req.adminEmail
		})
		res.status(201).json(page)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/content/pages/:id', async (req, res) => {
	try {
		const page = await AppPage.findByIdAndUpdate(
			req.params.id,
			{ ...req.body, updatedBy: req.adminEmail },
			{ new: true }
		)
		if (!page) return res.status(404).json({ error: 'Page not found' })
		res.json(page)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/content/pages/:id', async (req, res) => {
	try {
		const page = await AppPage.findByIdAndDelete(req.params.id)
		if (!page) return res.status(404).json({ error: 'Page not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Voice Command Templates
app.get('/api/admin/content/voice-commands', async (req, res) => {
	try {
		const { category, language, isActive, search, limit = 50, offset = 0 } = req.query
		
		let filter = {}
		if (category) filter.category = category
		if (language) filter.language = language
		if (isActive !== undefined) filter.isActive = isActive === 'true'
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ command: { $regex: search, $options: 'i' } },
				{ intent: { $regex: search, $options: 'i' } },
				{ response: { $regex: search, $options: 'i' } }
			]
		}
		
		const commands = await VoiceCommandTemplate.find(filter)
			.sort({ updatedAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset))
		
		res.json(commands)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/content/voice-commands/:id', async (req, res) => {
	try {
		const command = await VoiceCommandTemplate.findById(req.params.id)
		if (!command) return res.status(404).json({ error: 'Voice command not found' })
		res.json(command)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/content/voice-commands', async (req, res) => {
	try {
		const command = await VoiceCommandTemplate.create({
			...req.body,
			updatedBy: req.adminEmail
		})
		res.status(201).json(command)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/content/voice-commands/:id', async (req, res) => {
	try {
		const command = await VoiceCommandTemplate.findByIdAndUpdate(
			req.params.id,
			{ ...req.body, updatedBy: req.adminEmail },
			{ new: true }
		)
		if (!command) return res.status(404).json({ error: 'Voice command not found' })
		res.json(command)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/content/voice-commands/:id', async (req, res) => {
	try {
		const command = await VoiceCommandTemplate.findByIdAndDelete(req.params.id)
		if (!command) return res.status(404).json({ error: 'Voice command not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Content Statistics
app.get('/api/admin/content/stats', async (req, res) => {
	try {
		const [totalTexts, totalPages, totalVoiceCommands, recentUpdates] = await Promise.all([
			AppText.countDocuments(),
			AppPage.countDocuments(),
			VoiceCommandTemplate.countDocuments(),
			Promise.all([
				AppText.find().sort({ updatedAt: -1 }).limit(5).select('key name updatedAt updatedBy'),
				AppPage.find().sort({ updatedAt: -1 }).limit(5).select('name title updatedAt updatedBy'),
				VoiceCommandTemplate.find().sort({ updatedAt: -1 }).limit(5).select('name command updatedAt updatedBy')
			]).then(results => {
				const allUpdates = []
				results[0].forEach(item => allUpdates.push({ type: 'text', id: item._id, name: item.key, updatedAt: item.updatedAt, updatedBy: item.updatedBy }))
				results[1].forEach(item => allUpdates.push({ type: 'page', id: item._id, name: item.name, updatedAt: item.updatedAt, updatedBy: item.updatedBy }))
				results[2].forEach(item => allUpdates.push({ type: 'voice-command', id: item._id, name: item.name, updatedAt: item.updatedAt, updatedBy: item.updatedBy }))
				return allUpdates.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 10)
			})
		])
		
		const languages = await Promise.all([
			AppText.distinct('language'),
			AppPage.distinct('language'),
			VoiceCommandTemplate.distinct('language')
		]).then(results => [...new Set([...results[0], ...results[1], ...results[2]])])
		
		const categories = await Promise.all([
			AppText.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }]),
			VoiceCommandTemplate.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }])
		]).then(results => {
			const allCategories = {}
			results[0].forEach(item => allCategories[item._id] = (allCategories[item._id] || 0) + item.count)
			results[1].forEach(item => allCategories[item._id] = (allCategories[item._id] || 0) + item.count)
			return Object.entries(allCategories).map(([category, count]) => ({ category, count }))
		})
		
		res.json({
			totalTexts,
			totalPages,
			totalVoiceCommands,
			languages,
			categories,
			recentUpdates
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Email Alerts Management Endpoints
// Email Alerts
app.get('/api/admin/alerts/email', async (req, res) => {
	try {
		const { type, isActive, search, limit = 50, offset = 0 } = req.query
		
		let filter = {}
		if (type) filter.type = type
		if (isActive !== undefined) filter.isActive = isActive === 'true'
		if (search) {
			filter.$or = [
				{ name: { $regex: search, $options: 'i' } },
				{ description: { $regex: search, $options: 'i' } }
			]
		}
		
		const alerts = await EmailAlert.find(filter)
			.sort({ updatedAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset))
		
		res.json(alerts)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/alerts/email/:id', async (req, res) => {
	try {
		const alert = await EmailAlert.findById(req.params.id)
		if (!alert) return res.status(404).json({ error: 'Alert not found' })
		res.json(alert)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/alerts/email', async (req, res) => {
	try {
		const alert = await EmailAlert.create({
			...req.body,
			createdBy: req.adminEmail
		})
		res.status(201).json(alert)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/alerts/email/:id', async (req, res) => {
	try {
		const alert = await EmailAlert.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		)
		if (!alert) return res.status(404).json({ error: 'Alert not found' })
		res.json(alert)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/alerts/email/:id', async (req, res) => {
	try {
		const alert = await EmailAlert.findByIdAndDelete(req.params.id)
		if (!alert) return res.status(404).json({ error: 'Alert not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/alerts/email/:id/toggle', async (req, res) => {
	try {
		const alert = await EmailAlert.findByIdAndUpdate(
			req.params.id,
			{ isActive: !req.body.isActive },
			{ new: true }
		)
		if (!alert) return res.status(404).json({ error: 'Alert not found' })
		res.json(alert)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Alert Templates
app.get('/api/admin/alerts/templates', async (req, res) => {
	try {
		const templates = await AlertTemplate.find().sort({ updatedAt: -1 })
		res.json(templates)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Alert History
app.get('/api/admin/alerts/history', async (req, res) => {
	try {
		const { alertId, status, startDate, endDate, limit = 50, offset = 0 } = req.query
		
		let filter = {}
		if (alertId) filter.alertId = alertId
		if (status) filter.status = status
		if (startDate || endDate) {
			filter.triggeredAt = {}
			if (startDate) filter.triggeredAt.$gte = new Date(startDate)
			if (endDate) filter.triggeredAt.$lte = new Date(endDate)
		}
		
		const history = await AlertHistory.find(filter)
			.sort({ triggeredAt: -1 })
			.limit(parseInt(limit))
			.skip(parseInt(offset))
		
		res.json(history)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Email Configuration
app.get('/api/admin/alerts/email/config', async (req, res) => {
	try {
		const config = await EmailConfig.findOne() || {
			smtp: {
				host: 'smtp.gmail.com',
				port: 587,
				secure: false,
				username: '',
				password: ''
			},
			from: {
				name: 'Voicera AI',
				email: 'noreply@voicera.ai'
			},
			templates: {
				default: 'default',
				error: 'error',
				performance: 'performance',
				security: 'security'
			}
		}
		res.json(config)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Alert Statistics
app.get('/api/admin/alerts/stats', async (req, res) => {
	try {
		const [totalAlerts, activeAlerts, triggeredToday, resolvedToday, averageResolutionTime] = await Promise.all([
			EmailAlert.countDocuments(),
			EmailAlert.countDocuments({ isActive: true }),
			AlertHistory.countDocuments({
				triggeredAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
			}),
			AlertHistory.countDocuments({
				resolvedAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) }
			}),
			AlertHistory.aggregate([
				{ $match: { resolvedAt: { $exists: true } } },
				{ $project: { resolutionTime: { $subtract: ['$resolvedAt', '$triggeredAt'] } } },
				{ $group: { _id: null, avgTime: { $avg: '$resolutionTime' } } }
			]).then(result => result[0]?.avgTime ? result[0].avgTime / (1000 * 60) : 0) // Convert to minutes
		])
		
		const topAlerts = await AlertHistory.aggregate([
			{ $group: { _id: '$alertName', count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: 5 }
		])
		
		res.json({
			totalAlerts,
			activeAlerts,
			triggeredToday,
			resolvedToday,
			averageResolutionTime,
			topAlerts: topAlerts.map(item => ({ alert: item._id, count: item.count })),
			alertTrends: [] // Could be implemented with more complex aggregation
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// RBAC Management Endpoints
// Roles
app.get('/api/admin/rbac/roles', async (req, res) => {
	try {
		const roles = await Role.find().sort({ createdAt: -1 })
		res.json(roles)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/rbac/roles/:id', async (req, res) => {
	try {
		const role = await Role.findById(req.params.id)
		if (!role) return res.status(404).json({ error: 'Role not found' })
		res.json(role)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/rbac/roles', async (req, res) => {
	try {
		const role = await Role.create({
			...req.body,
			createdBy: req.adminEmail
		})
		res.status(201).json(role)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/rbac/roles/:id', async (req, res) => {
	try {
		const role = await Role.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		)
		if (!role) return res.status(404).json({ error: 'Role not found' })
		res.json(role)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/rbac/roles/:id', async (req, res) => {
	try {
		const role = await Role.findByIdAndDelete(req.params.id)
		if (!role) return res.status(404).json({ error: 'Role not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// Permissions
app.get('/api/admin/rbac/permissions', async (req, res) => {
	try {
		const permissions = await Permission.find().sort({ category: 1, name: 1 })
		res.json(permissions)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/rbac/permissions/:id', async (req, res) => {
	try {
		const permission = await Permission.findById(req.params.id)
		if (!permission) return res.status(404).json({ error: 'Permission not found' })
		res.json(permission)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/rbac/permissions', async (req, res) => {
	try {
		const permission = await Permission.create({
			...req.body,
			createdBy: req.adminEmail
		})
		res.status(201).json(permission)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/rbac/permissions/:id', async (req, res) => {
	try {
		const permission = await Permission.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		)
		if (!permission) return res.status(404).json({ error: 'Permission not found' })
		res.json(permission)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/rbac/permissions/:id', async (req, res) => {
	try {
		const permission = await Permission.findByIdAndDelete(req.params.id)
		if (!permission) return res.status(404).json({ error: 'Permission not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// User Roles
app.get('/api/admin/rbac/user-roles', async (req, res) => {
	try {
		const userRoles = await UserRole.find()
			.populate('userId', 'name email role')
			.populate('roleId', 'name description permissions')
			.sort({ createdAt: -1 })
		res.json(userRoles)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.get('/api/admin/rbac/user-roles/:id', async (req, res) => {
	try {
		const userRole = await UserRole.findById(req.params.id)
			.populate('userId', 'name email role')
			.populate('roleId', 'name description permissions')
		if (!userRole) return res.status(404).json({ error: 'User role not found' })
		res.json(userRole)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.post('/api/admin/rbac/user-roles', async (req, res) => {
	try {
		const userRole = await UserRole.create({
			...req.body,
			assignedBy: req.adminEmail
		})
		res.status(201).json(userRole)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.put('/api/admin/rbac/user-roles/:id', async (req, res) => {
	try {
		const userRole = await UserRole.findByIdAndUpdate(
			req.params.id,
			req.body,
			{ new: true }
		)
		if (!userRole) return res.status(404).json({ error: 'User role not found' })
		res.json(userRole)
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

app.delete('/api/admin/rbac/user-roles/:id', async (req, res) => {
	try {
		const userRole = await UserRole.findByIdAndDelete(req.params.id)
		if (!userRole) return res.status(404).json({ error: 'User role not found' })
		res.status(204).send()
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})

// RBAC Statistics
app.get('/api/admin/rbac/stats', async (req, res) => {
	try {
		const [totalRoles, totalPermissions, totalUserRoles, roleDistribution] = await Promise.all([
			Role.countDocuments(),
			Permission.countDocuments(),
			UserRole.countDocuments(),
			UserRole.aggregate([
				{ $group: { _id: '$roleId', count: { $sum: 1 } } },
				{ $lookup: { from: 'roles', localField: '_id', foreignField: '_id', as: 'role' } },
				{ $unwind: '$role' },
				{ $project: { roleName: '$role.name', count: 1 } }
			])
		])
		
		res.json({
			totalRoles,
			totalPermissions,
			totalUserRoles,
			roleDistribution
		})
	} catch (error) {
		res.status(500).json({ error: error.message })
	}
})


// Simple Analytics Endpoints
app.get('/api/admin/analytics/real-time', async (req, res) => {
	res.json({
		activeUsers: 25,
		currentSessions: 15,
		requestsPerMinute: 120,
		errorRate: 0.5,
		averageResponseTime: 150,
		systemLoad: 45,
		memoryUsage: 65,
		timestamp: new Date().toISOString()
	})
})

app.get('/api/admin/analytics/users', async (req, res) => {
	res.json({
		totalUsers: 150,
		activeUsers: 45,
		newUsers: 12,
		returningUsers: 33,
		userGrowth: [
			{ date: '2024-01-01', count: 10 },
			{ date: '2024-01-02', count: 15 },
			{ date: '2024-01-03', count: 20 }
		],
		userRetention: [
			{ period: '1 day', rate: 85 },
			{ period: '7 days', rate: 70 },
			{ period: '30 days', rate: 60 }
		],
		userDistribution: [
			{ role: 'admin', count: 5 },
			{ role: 'teacher', count: 25 },
			{ role: 'student', count: 120 }
		],
		topUsers: [
			{ userId: '1', userName: 'John Doe', sessions: 45, lastActive: '2024-01-15' }
		]
	})
})

app.get('/api/admin/analytics/voice', async (req, res) => {
	res.json({
		totalCommands: 1250,
		successfulCommands: 1100,
		failedCommands: 150,
		averageConfidence: 0.85,
		averageProcessingTime: 1200,
		topCommands: [
			{ command: 'Show dashboard', count: 45, successRate: 95 },
			{ command: 'Navigate to courses', count: 32, successRate: 90 }
		],
		commandTrends: [
			{ date: '2024-01-01', count: 50, successRate: 85 },
			{ date: '2024-01-02', count: 65, successRate: 88 }
		],
		languageDistribution: [
			{ language: 'en', count: 1000 },
			{ language: 'es', count: 200 },
			{ language: 'fr', count: 50 }
		],
		categoryDistribution: [
			{ category: 'navigation', count: 500 },
			{ category: 'query', count: 300 },
			{ category: 'action', count: 450 }
		]
	})
})

app.get('/api/admin/analytics/performance', async (req, res) => {
	res.json({
		averageResponseTime: 150,
		systemUptime: 99.9,
		errorRate: 0.5,
		throughput: 1000,
		memoryUsage: 65,
		cpuUsage: 45,
		databasePerformance: {
			averageQueryTime: 50,
			slowQueries: 2,
			connectionPool: 10
		},
		apiPerformance: [
			{ endpoint: '/api/users', averageTime: 120, errorRate: 0.1 },
			{ endpoint: '/api/courses', averageTime: 200, errorRate: 0.2 }
		]
	})
})

app.get('/api/admin/analytics/errors', async (req, res) => {
	res.json({
		totalErrors: 25,
		criticalErrors: 2,
		errorRate: 0.1,
		errorTrends: [
			{ date: '2024-01-01', count: 5, level: 'error' },
			{ date: '2024-01-02', count: 3, level: 'warning' }
		],
		topErrors: [
			{ error: 'Database connection failed', count: 5, level: 'critical', lastOccurred: '2024-01-15' },
			{ error: 'API timeout', count: 8, level: 'error', lastOccurred: '2024-01-14' }
		],
		errorCategories: [
			{ category: 'database', count: 10, percentage: 40 },
			{ category: 'api', count: 8, percentage: 32 },
			{ category: 'auth', count: 7, percentage: 28 }
		],
		resolutionTime: [
			{ level: 'critical', averageTime: 30 },
			{ level: 'error', averageTime: 15 },
			{ level: 'warning', averageTime: 5 }
		]
	})
})

app.get('/api/admin/analytics/system', async (req, res) => {
	res.json({
		systemHealth: 'healthy',
		uptime: 99.9,
		lastRestart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
		version: '1.0.0',
		environment: 'development',
		resources: {
			memory: { used: 65, total: 100, percentage: 65 },
			disk: { used: 40, total: 100, percentage: 40 },
			cpu: { usage: 45, cores: 4 }
		},
		services: [
			{ name: 'API Server', status: 'running', uptime: 99.9 },
			{ name: 'Database', status: 'running', uptime: 99.8 },
			{ name: 'AI Service', status: 'running', uptime: 99.5 }
		]
	})
})

// Simple Logging Endpoints
app.get('/api/admin/logs/sessions', async (req, res) => {
	res.json([
		{
			id: '1',
			userId: 'user1',
			userName: 'John Doe',
			userRole: 'admin',
			sessionStart: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
			sessionEnd: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
			duration: 60,
			ipAddress: '192.168.1.100',
			userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
			deviceType: 'desktop',
			browser: 'Chrome',
			os: 'Windows 10',
			status: 'expired',
			actions: []
		},
		{
			id: '2',
			userId: 'user2',
			userName: 'Jane Smith',
			userRole: 'teacher',
			sessionStart: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
			sessionEnd: null,
			duration: null,
			ipAddress: '192.168.1.101',
			userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
			deviceType: 'desktop',
			browser: 'Safari',
			os: 'macOS',
			status: 'active',
			actions: []
		}
	])
})

app.get('/api/admin/logs/voice-commands', async (req, res) => {
	res.json([
		{
			id: '1',
			userId: 'user1',
			sessionId: 'session1',
			command: 'Show me the dashboard',
			intent: 'navigate',
			confidence: 0.95,
			timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
			response: 'Navigating to dashboard',
			success: true,
			processingTime: 1200,
			language: 'en'
		},
		{
			id: '2',
			userId: 'user2',
			sessionId: 'session2',
			command: 'What courses are available?',
			intent: 'query',
			confidence: 0.88,
			timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
			response: 'Here are the available courses...',
			success: true,
			processingTime: 1500,
			language: 'en'
		}
	])
})

app.get('/api/admin/logs/errors', async (req, res) => {
	res.json([
		{
			id: '1',
			level: 'warning',
			category: 'api',
			message: 'API response time exceeded threshold',
			timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
			userId: 'user1',
			sessionId: 'session1',
			metadata: { responseTime: 2500, threshold: 2000 },
			resolved: false
		},
		{
			id: '2',
			level: 'error',
			category: 'database',
			message: 'Database connection timeout',
			timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
			userId: 'user2',
			sessionId: 'session2',
			metadata: { timeout: 5000, retries: 3 },
			resolved: true
		}
	])
})

app.get('/api/admin/logs/stats', async (req, res) => {
	res.json({
		totalSessions: 150,
		activeSessions: 25,
		totalErrors: 12,
		criticalErrors: 2,
		voiceCommands: 1250,
		averageSessionDuration: 45,
		errorRate: 2.5,
		topErrors: [
			{ error: 'API timeout', count: 5 },
			{ error: 'Database connection failed', count: 3 }
		],
		topUsers: [
			{ userId: 'user1', userName: 'John Doe', sessions: 45 },
			{ userId: 'user2', userName: 'Jane Smith', sessions: 32 }
		]
	})
})

const PORT = process.env.PORT || 4000
server.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`))


