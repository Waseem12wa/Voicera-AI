import mongoose from 'mongoose'
import User from '../models/User.js'
import Institution from '../models/Institution.js'
import Program from '../models/Program.js'
import Course from '../models/Course.js'
import File from '../models/File.js'
import Quiz from '../models/Quiz.js'
import StudentInteraction from '../models/StudentInteraction.js'
import StudentNote from '../models/StudentNote.js'
import Student from '../models/Student.js'
import Notification from '../models/Notification.js'
import QuizAssignment from '../models/QuizAssignment.js'

// Real educational data from open sources
const realEducationalData = {
  institutions: [
    {
      adminEmail: 'admin@stanford.edu',
      name: 'Stanford University',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/b/b7/Stanford_University_seal_2003.svg',
      address: '450 Serra Mall, Stanford, CA 94305',
      institutionType: 'University',
      contactEmail: 'info@stanford.edu',
      contactPhone: '+1 (650) 723-2300'
    },
    {
      adminEmail: 'admin@mit.edu',
      name: 'Massachusetts Institute of Technology',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/4/44/MIT_Seal.svg',
      address: '77 Massachusetts Ave, Cambridge, MA 02139',
      institutionType: 'University',
      contactEmail: 'admissions@mit.edu',
      contactPhone: '+1 (617) 253-1000'
    },
    {
      adminEmail: 'admin@harvard.edu',
      name: 'Harvard University',
      logoUrl: 'https://upload.wikimedia.org/wikipedia/en/2/29/Harvard_shield_wreath.svg',
      address: 'Massachusetts Hall, Cambridge, MA 02138',
      institutionType: 'University',
      contactEmail: 'college@harvard.edu',
      contactPhone: '+1 (617) 495-1000'
    }
  ],

  programs: [
    { name: 'Computer Science' },
    { name: 'Data Science' },
    { name: 'Artificial Intelligence' },
    { name: 'Machine Learning' },
    { name: 'Software Engineering' },
    { name: 'Cybersecurity' },
    { name: 'Business Administration' },
    { name: 'Digital Marketing' },
    { name: 'Psychology' },
    { name: 'Education Technology' }
  ],

  courses: [
    { name: 'Introduction to Programming' },
    { name: 'Data Structures and Algorithms' },
    { name: 'Machine Learning Fundamentals' },
    { name: 'Web Development' },
    { name: 'Database Systems' },
    { name: 'Software Engineering Principles' },
    { name: 'Computer Networks' },
    { name: 'Operating Systems' },
    { name: 'Human-Computer Interaction' },
    { name: 'Project Management' }
  ],

  users: [
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@stanford.edu',
      role: 'teacher',
      password: 'hashedpassword123'
    },
    {
      name: 'Prof. Michael Chen',
      email: 'michael.chen@mit.edu',
      role: 'teacher',
      password: 'hashedpassword123'
    },
    {
      name: 'Dr. Emily Rodriguez',
      email: 'emily.rodriguez@harvard.edu',
      role: 'teacher',
      password: 'hashedpassword123'
    },
    {
      name: 'Alex Thompson',
      email: 'alex.thompson@student.edu',
      role: 'student',
      password: 'hashedpassword123'
    },
    {
      name: 'Maria Garcia',
      email: 'maria.garcia@student.edu',
      role: 'student',
      password: 'hashedpassword123'
    },
    {
      name: 'James Wilson',
      email: 'james.wilson@student.edu',
      role: 'student',
      password: 'hashedpassword123'
    },
    {
      name: 'Lisa Park',
      email: 'lisa.park@student.edu',
      role: 'student',
      password: 'hashedpassword123'
    },
    {
      name: 'David Brown',
      email: 'david.brown@student.edu',
      role: 'student',
      password: 'hashedpassword123'
    },
    {
      name: 'Admin User',
      email: 'admin@voicera.edu',
      role: 'admin',
      password: 'hashedpassword123'
    }
  ]
}

// Sample educational content
const sampleFiles = [
  {
    originalName: 'Introduction to Machine Learning.pdf',
    fileName: 'ml_intro_2025.pdf',
    mimeType: 'application/pdf',
    size: 2048576,
    section: 'lectures',
    status: 'processed',
    teacherEmail: 'sarah.johnson@stanford.edu',
    title: 'Introduction to Machine Learning',
    description: 'Comprehensive introduction to machine learning concepts, algorithms, and applications.',
    aiAnalysis: {
      summary: 'This document covers fundamental machine learning concepts including supervised learning, unsupervised learning, and reinforcement learning. It discusses popular algorithms like linear regression, decision trees, and neural networks.',
      keyTopics: ['Supervised Learning', 'Unsupervised Learning', 'Neural Networks', 'Model Evaluation'],
      difficulty: 'intermediate',
      estimatedReadTime: '45 minutes'
    }
  },
  {
    originalName: 'Data Structures and Algorithms.pptx',
    fileName: 'dsa_2025.pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    size: 1536000,
    section: 'lectures',
    status: 'processed',
    teacherEmail: 'michael.chen@mit.edu',
    title: 'Data Structures and Algorithms',
    description: 'Essential data structures and algorithms for computer science students.',
    aiAnalysis: {
      summary: 'Comprehensive coverage of fundamental data structures including arrays, linked lists, stacks, queues, trees, and graphs. Includes algorithmic analysis and complexity theory.',
      keyTopics: ['Arrays and Linked Lists', 'Stacks and Queues', 'Trees and Graphs', 'Algorithm Complexity'],
      difficulty: 'intermediate',
      estimatedReadTime: '60 minutes'
    }
  },
  {
    originalName: 'Web Development Assignment.docx',
    fileName: 'webdev_assignment_2025.docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    size: 512000,
    section: 'assignments',
    status: 'processed',
    teacherEmail: 'emily.rodriguez@harvard.edu',
    title: 'Web Development Assignment',
    description: 'Build a responsive web application using HTML, CSS, and JavaScript.',
    aiAnalysis: {
      summary: 'Assignment requiring students to create a responsive web application with modern HTML5, CSS3, and JavaScript. Includes requirements for accessibility and mobile responsiveness.',
      keyTopics: ['HTML5', 'CSS3', 'JavaScript', 'Responsive Design'],
      difficulty: 'beginner',
      estimatedReadTime: '30 minutes'
    }
  }
]

const sampleQuizzes = [
  {
    title: 'Machine Learning Fundamentals Quiz',
    description: 'Test your understanding of basic machine learning concepts',
    teacherEmail: 'sarah.johnson@stanford.edu',
    questions: [
      {
        question: 'What is supervised learning?',
        options: ['Learning without labeled data', 'Learning with labeled data', 'Learning through trial and error', 'Learning without any data'],
        correctAnswer: 1,
        explanation: 'Supervised learning uses labeled training data to learn a mapping from inputs to outputs.'
      },
      {
        question: 'Which algorithm is commonly used for classification?',
        options: ['Linear Regression', 'Decision Trees', 'K-Means', 'Principal Component Analysis'],
        correctAnswer: 1,
        explanation: 'Decision trees are widely used for classification tasks as they can handle both categorical and numerical data.'
      },
      {
        question: 'What is overfitting in machine learning?',
        options: ['Model performs well on training data but poorly on test data', 'Model performs poorly on training data', 'Model is too simple', 'Model has too few parameters'],
        correctAnswer: 0,
        explanation: 'Overfitting occurs when a model learns the training data too well, including noise, and fails to generalize to new data.'
      }
    ],
    isAIGenerated: true,
    difficulty: 'intermediate',
    totalAttempts: 45,
    averageScore: 78.5
  },
  {
    title: 'Data Structures Quiz',
    description: 'Test your knowledge of fundamental data structures',
    teacherEmail: 'michael.chen@mit.edu',
    questions: [
      {
        question: 'What is the time complexity of accessing an element in an array?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n²)'],
        correctAnswer: 2,
        explanation: 'Array access is O(1) because elements are stored in contiguous memory locations.'
      },
      {
        question: 'Which data structure follows LIFO principle?',
        options: ['Queue', 'Stack', 'Tree', 'Graph'],
        correctAnswer: 1,
        explanation: 'Stack follows Last In First Out (LIFO) principle.'
      }
    ],
    isAIGenerated: false,
    difficulty: 'beginner',
    totalAttempts: 32,
    averageScore: 85.2
  }
]

const sampleInteractions = [
  {
    teacherEmail: 'sarah.johnson@stanford.edu',
    studentEmail: 'alex.thompson@student.edu',
    type: 'question',
    question: 'What is the difference between supervised and unsupervised learning?',
    context: 'Machine Learning Fundamentals course',
    aiResponse: {
      content: 'Supervised learning uses labeled data to train models, while unsupervised learning finds patterns in data without labels. Supervised learning is used for prediction tasks, while unsupervised learning is used for discovery tasks.',
      source: 'generated',
      confidence: 0.92,
      approved: true
    },
    status: 'answered'
  },
  {
    teacherEmail: 'michael.chen@mit.edu',
    studentEmail: 'maria.garcia@student.edu',
    type: 'question',
    question: 'How do I implement a binary search tree in Python?',
    context: 'Data Structures course',
    aiResponse: {
      content: 'A binary search tree can be implemented using a class with left and right child pointers. Here\'s a basic structure:\n\nclass TreeNode:\n    def __init__(self, val):\n        self.val = val\n        self.left = None\n        self.right = None',
      source: 'generated',
      confidence: 0.88,
      approved: true
    },
    status: 'answered'
  }
]

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Clear existing data
    await User.deleteMany({})
    await Institution.deleteMany({})
    await Program.deleteMany({})
    await Course.deleteMany({})
    await File.deleteMany({})
    await Quiz.deleteMany({})
    await StudentInteraction.deleteMany({})
    await StudentNote.deleteMany({})
    await Student.deleteMany({})
    await Notification.deleteMany({})
    await QuizAssignment.deleteMany({})
    
    console.log('🗑️ Cleared existing data')
    
    // Seed institutions
    const institutions = await Institution.insertMany(realEducationalData.institutions)
    console.log(`✅ Created ${institutions.length} institutions`)
    
    // Seed programs
    const programs = await Program.insertMany(realEducationalData.programs)
    console.log(`✅ Created ${programs.length} programs`)
    
    // Seed courses
    const courses = await Course.insertMany(realEducationalData.courses)
    console.log(`✅ Created ${courses.length} courses`)
    
    // Seed users
    const users = await User.insertMany(realEducationalData.users)
    console.log(`✅ Created ${users.length} users`)
    
    // Seed files
    const files = await File.insertMany(sampleFiles)
    console.log(`✅ Created ${files.length} files`)
    
    // Seed quizzes
    const quizzes = await Quiz.insertMany(sampleQuizzes)
    console.log(`✅ Created ${quizzes.length} quizzes`)
    
    // Seed interactions
    const interactions = await StudentInteraction.insertMany(sampleInteractions)
    console.log(`✅ Created ${interactions.length} interactions`)
    
    // Add some quiz attempts
    const quizAttempts = [
      {
        studentEmail: 'alex.thompson@student.edu',
        quizId: quizzes[0]._id,
        answers: { 0: 1, 1: 1, 2: 0 },
        score: 67,
        correctAnswers: 2,
        totalQuestions: 3,
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
      },
      {
        studentEmail: 'maria.garcia@student.edu',
        quizId: quizzes[0]._id,
        answers: { 0: 1, 1: 1, 2: 0 },
        score: 100,
        correctAnswers: 3,
        totalQuestions: 3,
        submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      }
    ]
    
    await Quiz.findByIdAndUpdate(quizzes[0]._id, {
      $push: { attempts: { $each: quizAttempts } }
    })
    
    console.log('✅ Added quiz attempts')
    
    // Create student records
    const studentUsers = users.filter(u => u.role === 'student')
    const studentRecords = await Promise.all(
      studentUsers.map(async (user, index) => {
        return await Student.create({
          userId: user._id,
          studentId: `STU${String(index + 1).padStart(3, '0')}`,
          status: 'active',
          isOnline: Math.random() > 0.5, // Random online status
          lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
          profile: {
            department: 'Computer Science',
            year: ['Freshman', 'Sophomore', 'Junior', 'Senior'][Math.floor(Math.random() * 4)],
            semester: 'Spring 2024',
            gpa: 3.0 + Math.random() * 1.5
          },
          preferences: {
            notifications: {
              email: true,
              push: true,
              quizAssignments: true,
              announcements: true
            },
            learningStyle: ['visual', 'auditory', 'kinesthetic'][Math.floor(Math.random() * 3)],
            pace: ['slow', 'medium', 'fast'][Math.floor(Math.random() * 3)]
          }
        })
      })
    )
    console.log(`✅ Created ${studentRecords.length} student records`)
    
    // Create sample notifications
    const sampleNotifications = [
      {
        recipientId: studentUsers[0]._id,
        recipientEmail: studentUsers[0].email,
        type: 'quiz_assignment',
        title: 'New Quiz Assignment',
        message: 'A quiz has been assigned to you. Please solve it.',
        data: {
          quizId: quizzes[0]._id,
          metadata: {
            quizTitle: quizzes[0].title,
            assignmentType: 'quiz'
          }
        },
        priority: 'high',
        read: false
      },
      {
        recipientId: studentUsers[1]._id,
        recipientEmail: studentUsers[1].email,
        type: 'announcement',
        title: 'Course Update',
        message: 'New materials have been uploaded to your course.',
        data: {
          courseId: courses[0]._id,
          metadata: {
            announcementType: 'course_update'
          }
        },
        priority: 'medium',
        read: true,
        readAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
      },
      {
        recipientId: studentUsers[2]._id,
        recipientEmail: studentUsers[2].email,
        type: 'quiz_assignment',
        title: 'New Quiz Assignment',
        message: 'A quiz has been assigned to you. Please solve it.',
        data: {
          quizId: quizzes[1]._id,
          metadata: {
            quizTitle: quizzes[1].title,
            assignmentType: 'quiz'
          }
        },
        priority: 'high',
        read: false
      }
    ]
    
    const notifications = await Notification.insertMany(sampleNotifications)
    console.log(`✅ Created ${notifications.length} notifications`)
    
    // Create sample quiz assignment
    const quizAssignment = await QuizAssignment.createAssignment(
      quizzes[0]._id,
      users.find(u => u.email === 'sarah.johnson@stanford.edu')._id,
      'sarah.johnson@stanford.edu',
      studentUsers.slice(0, 3).map(s => ({ studentId: s._id, studentEmail: s.email }))
    )
    console.log('✅ Created quiz assignment')
    
    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📊 Summary:')
    console.log(`- ${institutions.length} institutions`)
    console.log(`- ${programs.length} programs`)
    console.log(`- ${courses.length} courses`)
    console.log(`- ${users.length} users`)
    console.log(`- ${studentRecords.length} student records`)
    console.log(`- ${files.length} files`)
    console.log(`- ${quizzes.length} quizzes`)
    console.log(`- ${interactions.length} interactions`)
    console.log(`- ${notifications.length} notifications`)
    console.log(`- 1 quiz assignment`)
    
    return {
      institutions,
      programs,
      courses,
      users,
      studentRecords,
      files,
      quizzes,
      interactions,
      notifications,
      quizAssignment
    }
  } catch (error) {
    console.error('❌ Database seeding failed:', error)
    throw error
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/voicera'
  mongoose.connect(MONGO_URI)
    .then(() => seedDatabase())
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error)
      process.exit(1)
    })
}
