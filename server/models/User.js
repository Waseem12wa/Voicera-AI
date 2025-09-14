import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    trim: true
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    lowercase: true,
    trim: true
  },
  role: { 
    type: String, 
    enum: ['admin', 'institution_admin', 'teacher', 'student'], 
    default: 'teacher' 
  },
  password: { 
    type: String,
    required: true
  },
  profile: {
    avatar: String,
    bio: String,
    department: String,
    studentId: String,
    enrollmentDate: Date,
    graduationDate: Date
  },
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      sms: { type: Boolean, default: false }
    }
  },
  lastLogin: Date,
  isActive: { type: Boolean, default: true },
  emailVerified: { type: Boolean, default: false },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ isActive: 1 })
userSchema.index({ lastLogin: 1 })

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name
})

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    profile: this.profile,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  }
}

// Pre-save middleware
userSchema.pre('save', function(next) {
  if (this.isModified('email')) {
    this.email = this.email.toLowerCase()
  }
  next()
})

const User = mongoose.model('User', userSchema)

export default User
