import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  studentId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  enrollmentDate: { 
    type: Date, 
    default: Date.now 
  },
  courses: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Course' 
  }],
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'suspended', 'graduated'], 
    default: 'active' 
  },
  lastActive: { 
    type: Date, 
    default: Date.now 
  },
  isOnline: { 
    type: Boolean, 
    default: false 
  },
  profile: {
    department: String,
    year: String,
    semester: String,
    gpa: Number,
    advisor: String
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      quizAssignments: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true }
    },
    learningStyle: String,
    pace: String
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
studentSchema.index({ userId: 1 })
studentSchema.index({ studentId: 1 })
studentSchema.index({ status: 1 })
studentSchema.index({ isOnline: 1 })
studentSchema.index({ lastActive: 1 })

// Virtual for user details
studentSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true
})

// Method to update online status
studentSchema.methods.updateOnlineStatus = function(isOnline) {
  this.isOnline = isOnline
  this.lastActive = new Date()
  return this.save()
}

// Method to get public profile
studentSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    studentId: this.studentId,
    status: this.status,
    isOnline: this.isOnline,
    lastActive: this.lastActive,
    profile: this.profile,
    user: this.user ? {
      name: this.user.name,
      email: this.user.email
    } : null
  }
}

const Student = mongoose.model('Student', studentSchema)

export default Student
