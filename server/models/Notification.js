import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  recipientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  recipientEmail: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ['quiz_assignment', 'announcement', 'system', 'course_update', 'grade_update'], 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  message: { 
    type: String, 
    required: true 
  },
  data: {
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz' },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
    assignmentId: { type: mongoose.Schema.Types.ObjectId },
    grade: Number,
    metadata: mongoose.Schema.Types.Mixed
  },
  read: { 
    type: Boolean, 
    default: false 
  },
  readAt: Date,
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  expiresAt: Date,
  sentVia: [{
    method: { type: String, enum: ['in_app', 'email', 'push', 'sms'] },
    sentAt: Date,
    status: { type: String, enum: ['pending', 'sent', 'failed', 'delivered'] }
  }]
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
notificationSchema.index({ recipientId: 1 })
notificationSchema.index({ recipientEmail: 1 })
notificationSchema.index({ type: 1 })
notificationSchema.index({ read: 1 })
notificationSchema.index({ createdAt: -1 })
notificationSchema.index({ expiresAt: 1 })

// Virtual for quiz details
notificationSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: 'data.quizId',
  foreignField: '_id',
  justOne: true
})

// Virtual for course details
notificationSchema.virtual('course', {
  ref: 'Course',
  localField: 'data.courseId',
  foreignField: '_id',
  justOne: true
})

// Method to mark as read
notificationSchema.methods.markAsRead = function() {
  this.read = true
  this.readAt = new Date()
  return this.save()
}

// Method to send notification
notificationSchema.methods.send = async function(method = 'in_app') {
  try {
    const sentVia = {
      method,
      sentAt: new Date(),
      status: 'sent'
    }
    
    this.sentVia.push(sentVia)
    await this.save()
    
    return { success: true, sentVia }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Static method to create quiz assignment notification
notificationSchema.statics.createQuizAssignment = async function(recipientId, recipientEmail, quizId, quizTitle) {
  const notification = await this.create({
    recipientId,
    recipientEmail,
    type: 'quiz_assignment',
    title: 'New Quiz Assignment',
    message: 'A quiz has been assigned to you. Please solve it.',
    data: {
      quizId,
      metadata: {
        quizTitle,
        assignmentType: 'quiz'
      }
    },
    priority: 'high'
  })
  
  return notification
}

// Static method to create announcement notification
notificationSchema.statics.createAnnouncement = async function(recipientId, recipientEmail, title, message, courseId = null) {
  const notification = await this.create({
    recipientId,
    recipientEmail,
    type: 'announcement',
    title,
    message,
    data: {
      courseId,
      metadata: {
        announcementType: 'general'
      }
    },
    priority: 'medium'
  })
  
  return notification
}

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification
