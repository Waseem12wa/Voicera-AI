import { faker } from '@faker-js/faker'

export interface UserData {
  id: string
  name: string
  email: string
  role: 'admin' | 'teacher' | 'student'
  avatar?: string
  lastActive: string
  status: 'active' | 'inactive' | 'pending'
  department?: string
  phone?: string
  location?: string
}

export interface CourseData {
  id: string
  title: string
  description: string
  instructor: string
  students: number
  duration: string
  level: 'beginner' | 'intermediate' | 'advanced'
  category: string
  rating: number
  price: number
  status: 'active' | 'draft' | 'archived'
  createdAt: string
  updatedAt: string
}

export interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  totalCourses: number
  totalRevenue: number
  monthlyGrowth: number
  completionRate: number
  averageRating: number
  topCategories: Array<{ name: string; count: number; percentage: number }>
  recentActivity: Array<{
    id: string
    type: 'user_registration' | 'course_created' | 'quiz_completed' | 'file_uploaded'
    description: string
    timestamp: string
    user: string
  }>
}

export interface NotificationData {
  id: string
  title: string
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
  priority: 'low' | 'medium' | 'high'
  timestamp: string
  read: boolean
  actionUrl?: string
}

export interface SystemMetrics {
  cpuUsage: number
  memoryUsage: number
  diskUsage: number
  networkLatency: number
  activeConnections: number
  errorRate: number
  uptime: number
  lastBackup: string
}

export class DataGeneratorService {
  private static instance: DataGeneratorService
  public cache: Map<string, any> = new Map()

  static getInstance(): DataGeneratorService {
    if (!DataGeneratorService.instance) {
      DataGeneratorService.instance = new DataGeneratorService()
    }
    return DataGeneratorService.instance
  }

  // Generate random users
  generateUsers(count: number = 10): UserData[] {
    const cacheKey = `users_${count}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const users: UserData[] = Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      role: faker.helpers.arrayElement(['admin', 'teacher', 'student']),
      avatar: faker.image.avatar(),
      lastActive: faker.date.recent({ days: 7 }).toISOString(),
      status: faker.helpers.arrayElement(['active', 'inactive', 'pending']),
      department: faker.helpers.arrayElement([
        'Computer Science',
        'Mathematics',
        'Physics',
        'Chemistry',
        'Biology',
        'Engineering',
        'Business',
        'Arts'
      ]),
      phone: faker.phone.number(),
      location: faker.location.city()
    }))

    this.cache.set(cacheKey, users)
    return users
  }

  // Generate random courses
  generateCourses(count: number = 10): CourseData[] {
    const cacheKey = `courses_${count}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const courses: CourseData[] = Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        'Introduction to Machine Learning',
        'Advanced React Development',
        'Data Structures and Algorithms',
        'Web Design Fundamentals',
        'Database Management Systems',
        'Mobile App Development',
        'Cybersecurity Basics',
        'Cloud Computing Essentials'
      ]),
      description: faker.lorem.paragraph(),
      instructor: faker.person.fullName(),
      students: faker.number.int({ min: 5, max: 500 }),
      duration: faker.helpers.arrayElement(['4 weeks', '8 weeks', '12 weeks', '16 weeks']),
      level: faker.helpers.arrayElement(['beginner', 'intermediate', 'advanced']),
      category: faker.helpers.arrayElement([
        'Programming',
        'Data Science',
        'Web Development',
        'Mobile Development',
        'Design',
        'Business',
        'Mathematics',
        'Science'
      ]),
      rating: parseFloat(faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }).toFixed(1)),
      price: faker.number.int({ min: 0, max: 500 }),
      status: faker.helpers.arrayElement(['active', 'draft', 'archived']),
      createdAt: faker.date.past().toISOString(),
      updatedAt: faker.date.recent().toISOString()
    }))

    this.cache.set(cacheKey, courses)
    return courses
  }

  // Generate analytics data
  generateAnalytics(): AnalyticsData {
    const cacheKey = 'analytics'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const analytics: AnalyticsData = {
      totalUsers: faker.number.int({ min: 100, max: 10000 }),
      activeUsers: faker.number.int({ min: 50, max: 1000 }),
      totalCourses: faker.number.int({ min: 20, max: 500 }),
      totalRevenue: faker.number.int({ min: 10000, max: 1000000 }),
      monthlyGrowth: faker.number.float({ min: -10, max: 50, fractionDigits: 1 }),
      completionRate: faker.number.float({ min: 60, max: 95, fractionDigits: 1 }),
      averageRating: faker.number.float({ min: 3.5, max: 5.0, fractionDigits: 1 }),
      topCategories: [
        { name: 'Programming', count: faker.number.int({ min: 50, max: 200 }), percentage: 35 },
        { name: 'Data Science', count: faker.number.int({ min: 30, max: 150 }), percentage: 25 },
        { name: 'Web Development', count: faker.number.int({ min: 20, max: 100 }), percentage: 20 },
        { name: 'Design', count: faker.number.int({ min: 10, max: 80 }), percentage: 15 },
        { name: 'Business', count: faker.number.int({ min: 5, max: 50 }), percentage: 5 }
      ],
      recentActivity: Array.from({ length: 10 }, () => ({
        id: faker.string.uuid(),
        type: faker.helpers.arrayElement([
          'user_registration',
          'course_created',
          'quiz_completed',
          'file_uploaded'
        ]),
        description: faker.helpers.arrayElement([
          'New user registered',
          'Course created successfully',
          'Quiz completed with high score',
          'File uploaded and processed'
        ]),
        timestamp: faker.date.recent({ days: 7 }).toISOString(),
        user: faker.person.fullName()
      }))
    }

    this.cache.set(cacheKey, analytics)
    return analytics
  }

  // Generate notifications
  generateNotifications(count: number = 5): NotificationData[] {
    const cacheKey = `notifications_${count}`
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const notifications: NotificationData[] = Array.from({ length: count }, () => ({
      id: faker.string.uuid(),
      title: faker.helpers.arrayElement([
        'New user registration',
        'Course enrollment',
        'System maintenance scheduled',
        'File upload completed',
        'Quiz submission received',
        'Payment processed',
        'Account verification required',
        'Password reset requested'
      ]),
      message: faker.lorem.sentence(),
      type: faker.helpers.arrayElement(['info', 'success', 'warning', 'error']),
      priority: faker.helpers.arrayElement(['low', 'medium', 'high']),
      timestamp: faker.date.recent({ days: 3 }).toISOString(),
      read: faker.datatype.boolean(),
      actionUrl: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.3 })
    }))

    this.cache.set(cacheKey, notifications)
    return notifications
  }

  // Generate system metrics
  generateSystemMetrics(): SystemMetrics {
    const cacheKey = 'system_metrics'
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)
    }

    const metrics: SystemMetrics = {
      cpuUsage: faker.number.float({ min: 10, max: 90, fractionDigits: 1 }),
      memoryUsage: faker.number.float({ min: 20, max: 85, fractionDigits: 1 }),
      diskUsage: faker.number.float({ min: 30, max: 80, fractionDigits: 1 }),
      networkLatency: faker.number.int({ min: 10, max: 200 }),
      activeConnections: faker.number.int({ min: 50, max: 1000 }),
      errorRate: faker.number.float({ min: 0.1, max: 5.0, fractionDigits: 1 }),
      uptime: faker.number.float({ min: 95, max: 99.9, fractionDigits: 1 }),
      lastBackup: faker.date.recent({ days: 1 }).toISOString()
    }

    this.cache.set(cacheKey, metrics)
    return metrics
  }

  // Generate random insights/tips
  generateInsights(): string[] {
    const insights = [
      'Consider implementing two-factor authentication for enhanced security',
      'Regular data backups are crucial for system reliability',
      'Monitor user engagement metrics to improve course completion rates',
      'Optimize database queries to improve system performance',
      'Implement caching strategies to reduce server load',
      'Regular security audits help identify potential vulnerabilities',
      'User feedback is valuable for continuous improvement',
      'Consider implementing automated testing for better code quality',
      'Monitor system resources to prevent performance bottlenecks',
      'Regular updates ensure you have the latest security patches'
    ]

    return faker.helpers.arrayElements(insights, { min: 3, max: 6 })
  }

  // Generate random statistics
  generateStatistics(): Record<string, any> {
    return {
      totalFiles: faker.number.int({ min: 100, max: 10000 }),
      totalQuizzes: faker.number.int({ min: 50, max: 1000 }),
      totalDownloads: faker.number.int({ min: 500, max: 50000 }),
      averageSessionTime: faker.number.int({ min: 15, max: 120 }),
      peakUsageTime: faker.helpers.arrayElement(['9:00 AM', '2:00 PM', '7:00 PM']),
      mostPopularFeature: faker.helpers.arrayElement([
        'Voice Commands',
        'File Upload',
        'Quiz Generation',
        'Analytics Dashboard'
      ]),
      systemHealth: faker.helpers.arrayElement(['Excellent', 'Good', 'Fair', 'Needs Attention']),
      lastMaintenance: faker.date.recent({ days: 30 }).toISOString()
    }
  }

  // Clear cache (useful for refreshing data)
  clearCache(): void {
    this.cache.clear()
  }

  // Get cached data
  getCachedData(key: string): any {
    return this.cache.get(key)
  }

  // Check if data is cached
  isCached(key: string): boolean {
    return this.cache.has(key)
  }
}

// Export singleton instance
export const dataGenerator = DataGeneratorService.getInstance()

// Export utility functions
export const generateRandomData = {
  users: (count?: number) => dataGenerator.generateUsers(count),
  courses: (count?: number) => dataGenerator.generateCourses(count),
  analytics: () => dataGenerator.generateAnalytics(),
  notifications: (count?: number) => dataGenerator.generateNotifications(count),
  systemMetrics: () => dataGenerator.generateSystemMetrics(),
  insights: () => dataGenerator.generateInsights(),
  statistics: () => dataGenerator.generateStatistics()
}
