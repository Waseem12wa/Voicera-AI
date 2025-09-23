import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema({
	teacherEmail: { type: String, required: true, index: true },
	originalName: { type: String, required: true },
	fileName: { type: String, required: true },
	mimeType: { type: String, required: true },
	size: { type: Number, required: true },
	section: { 
		type: String, 
		enum: ['lectures', 'assignments', 'notes', 'resources', 'quizzes', 'voice', 'audio'],
		default: 'lectures'
	},
	status: { 
		type: String, 
		enum: ['uploaded', 'processing', 'processed', 'failed'],
		default: 'uploaded'
	},
	// AI Analysis Results
	aiAnalysis: {
		summary: String,
		tags: [String],
		difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
		subject: String,
		quizQuestions: [{
			question: String,
			answer: String,
			options: [String]
		}],
		analyzedAt: Date
	},
	// File Organization
	title: String,
	description: String,
	topics: [String],
	// Student Interaction
	downloads: { type: Number, default: 0 },
	views: { type: Number, default: 0 },
	// Voice/Audio specific fields
	transcript: String,
	isVoiceContent: { type: Boolean, default: false },
	audioDuration: Number, // in seconds
	recordingQuality: { type: String, enum: ['low', 'medium', 'high'] },
	
	// File content (for voice/audio files)
	content: String,
	
	// Metadata
	uploadedBy: String,
	lastModified: Date
}, { 
	timestamps: true 
})

// Indexes for better performance
fileSchema.index({ teacherEmail: 1, section: 1 })
fileSchema.index({ teacherEmail: 1, 'aiAnalysis.tags': 1 })
fileSchema.index({ teacherEmail: 1, createdAt: -1 })

export default mongoose.model('File', fileSchema)
