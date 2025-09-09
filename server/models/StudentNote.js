import mongoose from 'mongoose'

const studentNoteSchema = new mongoose.Schema({
	studentEmail: { type: String, required: true, index: true },
	title: { type: String, required: true },
	content: { type: String, required: true },
	courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
	tags: [String],
	isPublic: { type: Boolean, default: false },
	createdAt: { type: Date, default: Date.now },
	updatedAt: { type: Date, default: Date.now }
})

// Update the updatedAt field before saving
studentNoteSchema.pre('save', function(next) {
	this.updatedAt = new Date()
	next()
})

export default mongoose.model('StudentNote', studentNoteSchema)
