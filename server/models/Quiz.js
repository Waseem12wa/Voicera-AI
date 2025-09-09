import mongoose from 'mongoose'

const quizSchema = new mongoose.Schema({
	teacherEmail: { type: String, required: true, index: true },
	title: { type: String, required: true },
	description: String,
	questions: [{
		question: { type: String, required: true },
		options: [String],
		correctAnswer: { type: Number, required: true },
		explanation: String,
		points: { type: Number, default: 1 }
	}],
	// Quiz Settings
	timeLimit: Number, // in minutes
	totalPoints: { type: Number, default: 0 },
	difficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
	// AI Generated
	isAIGenerated: { type: Boolean, default: false },
	sourceFile: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
	// Student Attempts
	attempts: [{
		studentEmail: String,
		answers: [Number],
		score: Number,
		completedAt: Date,
		timeSpent: Number // in seconds
	}],
	// Analytics
	totalAttempts: { type: Number, default: 0 },
	averageScore: { type: Number, default: 0 },
	// Status
	isActive: { type: Boolean, default: true },
	dueDate: Date
}, { 
	timestamps: true 
})

// Calculate total points before saving
quizSchema.pre('save', function(next) {
	if (this.questions && this.questions.length > 0) {
		this.totalPoints = this.questions.reduce((sum, q) => sum + (q.points || 1), 0)
	}
	next()
})

// Indexes
quizSchema.index({ teacherEmail: 1, isActive: 1 })
quizSchema.index({ teacherEmail: 1, createdAt: -1 })

export default mongoose.model('Quiz', quizSchema)
