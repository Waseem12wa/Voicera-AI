import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import winston from 'winston'

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  role: { 
    type: String, 
    enum: ['admin', 'institution_admin', 'teacher', 'student'], 
    required: true 
  },
  avatar: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['active', 'inactive', 'pending', 'suspended'], 
    default: 'active' 
  },
  lastActive: { type: Date, default: Date.now },
  preferences: {
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      voice: { type: Boolean, default: true }
    },
    theme: { type: String, default: 'light' }
  },
  profile: {
    bio: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String
    },
    socialLinks: {
      linkedin: String,
      twitter: String,
      github: String
    }
  },
  institution: {
    id: { type: String, ref: 'Institution' },
    name: String,
    department: String,
    position: String
  },
  courses: [{ type: String, ref: 'Course' }],
  permissions: [String],
  metadata: mongoose.Schema.Types.Mixed
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ status: 1 })
userSchema.index({ 'institution.id': 1 })
userSchema.index({ createdAt: -1 })

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name
})

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method to check password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password)
}

// Instance method to get public profile
userSchema.methods.getPublicProfile = function() {
  const user = this.toObject()
  delete user.password
  delete user.__v
  return user
}

const User = mongoose.model('User', userSchema)

export class UserService {
  constructor(cacheService, metricsService) {
    this.cacheService = cacheService
    this.metricsService = metricsService
    
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'user-service' },
      transports: [
        new winston.transports.Console()
      ]
    })
  }

  async createUser(userData) {
    try {
      this.logger.info(`Creating user: ${userData.email}`)
      
      // Check if user already exists
      const existingUser = await User.findOne({ email: userData.email })
      if (existingUser) {
        throw new Error('User with this email already exists')
      }

      // Create new user
      const user = new User(userData)
      await user.save()

      // Cache user data
      await this.cacheService.set(`user:${user._id}`, user.getPublicProfile(), 3600)
      await this.cacheService.set(`user:email:${user.email}`, user._id.toString(), 3600)

      // Update metrics
      this.metricsService.incrementUsersCreated()
      this.metricsService.incrementUserOperations('create')

      this.logger.info(`User created successfully: ${user._id}`)
      return user.getPublicProfile()

    } catch (error) {
      this.logger.error('Error creating user:', error)
      this.metricsService.incrementUserOperations('create', 'error')
      throw error
    }
  }

  async getUserById(userId) {
    try {
      // Check cache first
      const cacheKey = `user:${userId}`
      const cachedUser = await this.cacheService.get(cacheKey)
      
      if (cachedUser) {
        this.metricsService.incrementCacheHits()
        return cachedUser
      }

      // Fetch from database
      const user = await User.findById(userId)
      if (!user) {
        throw new Error('User not found')
      }

      const userProfile = user.getPublicProfile()
      
      // Cache user data
      await this.cacheService.set(cacheKey, userProfile, 3600)

      this.metricsService.incrementUserOperations('read')
      return userProfile

    } catch (error) {
      this.logger.error('Error getting user by ID:', error)
      this.metricsService.incrementUserOperations('read', 'error')
      throw error
    }
  }

  async getUserByEmail(email) {
    try {
      // Check cache first
      const cacheKey = `user:email:${email}`
      const cachedUserId = await this.cacheService.get(cacheKey)
      
      if (cachedUserId) {
        return await this.getUserById(cachedUserId)
      }

      // Fetch from database
      const user = await User.findOne({ email })
      if (!user) {
        throw new Error('User not found')
      }

      const userProfile = user.getPublicProfile()
      
      // Cache user data
      await this.cacheService.set(`user:${user._id}`, userProfile, 3600)
      await this.cacheService.set(cacheKey, user._id.toString(), 3600)

      this.metricsService.incrementUserOperations('read')
      return userProfile

    } catch (error) {
      this.logger.error('Error getting user by email:', error)
      this.metricsService.incrementUserOperations('read', 'error')
      throw error
    }
  }

  async updateUser(userId, updateData) {
    try {
      this.logger.info(`Updating user: ${userId}`)
      
      // Remove password from update data if present
      delete updateData.password
      
      const user = await User.findByIdAndUpdate(
        userId, 
        { $set: updateData }, 
        { new: true, runValidators: true }
      )

      if (!user) {
        throw new Error('User not found')
      }

      const userProfile = user.getPublicProfile()
      
      // Update cache
      await this.cacheService.set(`user:${userId}`, userProfile, 3600)
      await this.cacheService.set(`user:email:${user.email}`, userId, 3600)

      this.metricsService.incrementUserOperations('update')
      this.logger.info(`User updated successfully: ${userId}`)
      return userProfile

    } catch (error) {
      this.logger.error('Error updating user:', error)
      this.metricsService.incrementUserOperations('update', 'error')
      throw error
    }
  }

  async deleteUser(userId) {
    try {
      this.logger.info(`Deleting user: ${userId}`)
      
      const user = await User.findByIdAndDelete(userId)
      if (!user) {
        throw new Error('User not found')
      }

      // Remove from cache
      await this.cacheService.del(`user:${userId}`)
      await this.cacheService.del(`user:email:${user.email}`)

      this.metricsService.incrementUserOperations('delete')
      this.logger.info(`User deleted successfully: ${userId}`)
      return { message: 'User deleted successfully' }

    } catch (error) {
      this.logger.error('Error deleting user:', error)
      this.metricsService.incrementUserOperations('delete', 'error')
      throw error
    }
  }

  async getUsers(filters = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        role,
        status,
        institution,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters

      const query = {}
      
      if (role) query.role = role
      if (status) query.status = status
      if (institution) query['institution.id'] = institution
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ]
      }

      const sort = {}
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1

      const skip = (page - 1) * limit

      const [users, total] = await Promise.all([
        User.find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        User.countDocuments(query)
      ])

      // Remove passwords from results
      const sanitizedUsers = users.map(user => {
        const { password, __v, ...sanitized } = user
        return sanitized
      })

      this.metricsService.incrementUserOperations('list')
      
      return {
        users: sanitizedUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      this.logger.error('Error getting users:', error)
      this.metricsService.incrementUserOperations('list', 'error')
      throw error
    }
  }

  async updateUserStatus(userId, status) {
    try {
      const user = await User.findByIdAndUpdate(
        userId,
        { status, lastActive: new Date() },
        { new: true }
      )

      if (!user) {
        throw new Error('User not found')
      }

      // Update cache
      await this.cacheService.set(`user:${userId}`, user.getPublicProfile(), 3600)

      this.metricsService.incrementUserOperations('status_update')
      return user.getPublicProfile()

    } catch (error) {
      this.logger.error('Error updating user status:', error)
      this.metricsService.incrementUserOperations('status_update', 'error')
      throw error
    }
  }

  async getUserStats() {
    try {
      const cacheKey = 'user:stats'
      const cached = await this.cacheService.get(cacheKey)
      
      if (cached) {
        return cached
      }

      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            usersByRole: {
              $push: '$role'
            },
            usersByStatus: {
              $push: '$status'
            }
          }
        },
        {
          $project: {
            totalUsers: 1,
            activeUsers: 1,
            inactiveUsers: { $subtract: ['$totalUsers', '$activeUsers'] },
            roleDistribution: {
              $reduce: {
                input: '$usersByRole',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }]
                      ]
                    }
                  ]
                }
              }
            },
            statusDistribution: {
              $reduce: {
                input: '$usersByStatus',
                initialValue: {},
                in: {
                  $mergeObjects: [
                    '$$value',
                    {
                      $arrayToObject: [
                        [{
                          k: '$$this',
                          v: {
                            $add: [
                              { $ifNull: [{ $getField: { field: '$$this', input: '$$value' } }, 0] },
                              1
                            ]
                          }
                        }]
                      ]
                    }
                  ]
                }
              }
            }
          }
        }
      ])

      const result = stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        roleDistribution: {},
        statusDistribution: {}
      }

      await this.cacheService.set(cacheKey, result, 1800) // 30 minutes
      return result

    } catch (error) {
      this.logger.error('Error getting user stats:', error)
      return {
        totalUsers: 0,
        activeUsers: 0,
        inactiveUsers: 0,
        roleDistribution: {},
        statusDistribution: {}
      }
    }
  }
}
