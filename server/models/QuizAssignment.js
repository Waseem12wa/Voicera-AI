import mongoose from 'mongoose'

const quizAssignmentSchema = new mongoose.Schema({
  quizId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Quiz', 
    required: true 
  },
  teacherId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  teacherEmail: { 
    type: String, 
    required: true 
  },
  students: [{
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    studentEmail: { 
      type: String, 
      required: true 
    },
    assignedAt: { 
      type: Date, 
      default: Date.now 
    },
    dueDate: Date,
    status: { 
      type: String, 
      enum: ['assigned', 'in_progress', 'completed', 'overdue'], 
      default: 'assigned' 
    },
    attempts: [{
      attemptNumber: { type: Number, default: 1 },
      answers: mongoose.Schema.Types.Mixed,
      score: Number,
      submittedAt: Date,
      timeSpent: Number // in minutes
    }],
    bestScore: Number,
    totalAttempts: { type: Number, default: 0 }
  }],
  settings: {
    allowMultipleAttempts: { type: Boolean, default: true },
    maxAttempts: { type: Number, default: 3 },
    timeLimit: Number, // in minutes
    shuffleQuestions: { type: Boolean, default: false },
    showCorrectAnswers: { type: Boolean, default: true },
    showResultsImmediately: { type: Boolean, default: true }
  },
  status: { 
    type: String, 
    enum: ['active', 'paused', 'completed', 'cancelled'], 
    default: 'active' 
  },
  assignedAt: { 
    type: Date, 
    default: Date.now 
  },
  expiresAt: Date
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for better performance
quizAssignmentSchema.index({ quizId: 1 })
quizAssignmentSchema.index({ teacherId: 1 })
quizAssignmentSchema.index({ 'students.studentId': 1 })
quizAssignmentSchema.index({ status: 1 })
quizAssignmentSchema.index({ assignedAt: -1 })

// Virtual for quiz details
quizAssignmentSchema.virtual('quiz', {
  ref: 'Quiz',
  localField: 'quizId',
  foreignField: '_id',
  justOne: true
})

// Virtual for teacher details
quizAssignmentSchema.virtual('teacher', {
  ref: 'User',
  localField: 'teacherId',
  foreignField: '_id',
  justOne: true
})

// Method to add student to assignment
quizAssignmentSchema.methods.addStudent = function(studentId, studentEmail, dueDate = null) {
  const existingStudent = this.students.find(s => s.studentId.toString() === studentId.toString())
  
  if (!existingStudent) {
    this.students.push({
      studentId,
      studentEmail,
      assignedAt: new Date(),
      dueDate,
      status: 'assigned'
    })
  }
  
  return this.save()
}

// Method to remove student from assignment
quizAssignmentSchema.methods.removeStudent = function(studentId) {
  this.students = this.students.filter(s => s.studentId.toString() !== studentId.toString())
  return this.save()
}

// Method to update student attempt
quizAssignmentSchema.methods.updateStudentAttempt = function(studentId, attemptData) {
  const student = this.students.find(s => s.studentId.toString() === studentId.toString())
  
  if (student) {
    student.attempts.push({
      attemptNumber: student.attempts.length + 1,
      ...attemptData,
      submittedAt: new Date()
    })
    
    student.totalAttempts = student.attempts.length
    student.bestScore = Math.max(...student.attempts.map(a => a.score || 0))
    
    // Update status based on attempts
    if (student.attempts.length >= this.settings.maxAttempts) {
      student.status = 'completed'
    } else if (student.attempts.length > 0) {
      student.status = 'in_progress'
    }
  }
  
  return this.save()
}

// Method to get assignment statistics
quizAssignmentSchema.methods.getStatistics = function() {
  const totalStudents = this.students.length
  const completedStudents = this.students.filter(s => s.status === 'completed').length
  const inProgressStudents = this.students.filter(s => s.status === 'in_progress').length
  const assignedStudents = this.students.filter(s => s.status === 'assigned').length
  
  const averageScore = this.students.reduce((sum, s) => sum + (s.bestScore || 0), 0) / totalStudents
  
  return {
    totalStudents,
    completedStudents,
    inProgressStudents,
    assignedStudents,
    completionRate: totalStudents > 0 ? (completedStudents / totalStudents) * 100 : 0,
    averageScore: Math.round(averageScore || 0)
  }
}

// Static method to create assignment
quizAssignmentSchema.statics.createAssignment = async function(quizId, teacherId, teacherEmail, studentIds, settings = {}) {
  const assignment = await this.create({
    quizId,
    teacherId,
    teacherEmail,
    students: studentIds.map(studentId => ({
      studentId: studentId.studentId,
      studentEmail: studentId.studentEmail,
      assignedAt: new Date()
    })),
    settings: {
      allowMultipleAttempts: true,
      maxAttempts: 3,
      ...settings
    }
  })
  
  return assignment
}

const QuizAssignment = mongoose.model('QuizAssignment', quizAssignmentSchema)

export default QuizAssignment
