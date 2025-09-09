import mongoose from 'mongoose'

const studentInteractionSchema = new mongoose.Schema({
	teacherEmail: { type: String, required: true, index: true },
	studentEmail: { type: String, required: true, index: true },
	// Interaction Types
	type: { 
		type: String, 
		enum: ['question', 'file_view', 'quiz_attempt', 'download', 'participation'],
		required: true 
	},
	// Content
	question: String,
	answer: String,
	context: String,
	// File/Quiz References
	fileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
	quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
	// AI Response
	aiResponse: {
		content: String,
		source: { type: String, enum: ['repository', 'web', 'generated'] },
		confidence: Number,
		approved: { type: Boolean, default: false },
		approvedAt: Date
	},
	// Performance Metrics
	score: Number,
	timeSpent: Number, // in seconds
	// Analytics
	sentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
	difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
	// Status
	status: { 
		type: String, 
		enum: ['pending', 'answered', 'approved', 'rejected'],
		default: 'pending'
	}
}, { 
	timestamps: true 
})

// Indexes for analytics queries
studentInteractionSchema.index({ teacherEmail: 1, type: 1, createdAt: -1 })
studentInteractionSchema.index({ studentEmail: 1, createdAt: -1 })
studentInteractionSchema.index({ teacherEmail: 1, 'aiResponse.approved': 1 })

export default mongoose.model('StudentInteraction', studentInteractionSchema)
