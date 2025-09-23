# Student Management & Real-time Quiz Assignment System

## 🎯 Overview

This system provides comprehensive student management and real-time quiz assignment capabilities for the Voicera AI educational platform. Teachers can view registered and active students, assign quizzes, and students receive instant notifications.

## 🚀 Features

### For Teachers
- **Student Management Dashboard**: View all registered students and currently active students
- **Real-time Student Tracking**: See which students are online with AI-powered status detection
- **Quiz Assignment**: Assign quizzes to multiple students with bulk selection
- **Assignment Tracking**: Monitor quiz assignments and student progress
- **Real-time Notifications**: Get instant feedback when assignments are made

### For Students
- **Assigned Quizzes Only**: See only quizzes specifically assigned by teachers
- **Assignment Details**: View assignment date, due date, attempts, and best score
- **Real-time Notifications**: Receive instant notifications when quizzes are assigned
- **Notification Management**: View, read, and manage notifications
- **Quiz Details**: See quiz information directly in notifications
- **Online Status**: Automatically update online/offline status
- **Progress Tracking**: Track quiz completion status and scores

## 🏗️ Architecture

### Database Models

#### Student Model (`server/models/Student.js`)
```javascript
{
  userId: ObjectId,           // Reference to User
  studentId: String,          // Unique student identifier
  enrollmentDate: Date,       // When student enrolled
  courses: [ObjectId],       // Enrolled courses
  status: String,            // active, inactive, suspended, graduated
  lastActive: Date,          // Last activity timestamp
  isOnline: Boolean,         // Current online status
  profile: {                 // Student profile data
    department: String,
    year: String,
    semester: String,
    gpa: Number,
    advisor: String
  },
  preferences: {             // Student preferences
    notifications: {
      email: Boolean,
      push: Boolean,
      quizAssignments: Boolean,
      announcements: Boolean
    },
    learningStyle: String,
    pace: String
  }
}
```

#### Notification Model (`server/models/Notification.js`)
```javascript
{
  recipientId: ObjectId,     // Student user ID
  recipientEmail: String,     // Student email
  type: String,              // quiz_assignment, announcement, system, etc.
  title: String,             // Notification title
  message: String,           // Notification message
  data: {                    // Additional data
    quizId: ObjectId,        // Related quiz
    courseId: ObjectId,      // Related course
    assignmentId: ObjectId,  // Related assignment
    metadata: Mixed          // Additional metadata
  },
  read: Boolean,             // Read status
  readAt: Date,             // When read
  priority: String,          // low, medium, high, urgent
  expiresAt: Date,          // Expiration date
  sentVia: [{               // Delivery methods
    method: String,          // in_app, email, push, sms
    sentAt: Date,
    status: String           // pending, sent, failed, delivered
  }]
}
```

#### QuizAssignment Model (`server/models/QuizAssignment.js`)
```javascript
{
  quizId: ObjectId,          // Reference to Quiz
  teacherId: ObjectId,       // Teacher user ID
  teacherEmail: String,      // Teacher email
  students: [{               // Assigned students
    studentId: ObjectId,      // Student user ID
    studentEmail: String,     // Student email
    assignedAt: Date,         // Assignment timestamp
    dueDate: Date,           // Due date
    status: String,          // assigned, in_progress, completed, overdue
    attempts: [{             // Student attempts
      attemptNumber: Number,
      answers: Mixed,
      score: Number,
      submittedAt: Date,
      timeSpent: Number
    }],
    bestScore: Number,       // Best score achieved
    totalAttempts: Number    // Total attempts made
  }],
  settings: {               // Assignment settings
    allowMultipleAttempts: Boolean,
    maxAttempts: Number,
    timeLimit: Number,
    shuffleQuestions: Boolean,
    showCorrectAnswers: Boolean,
    showResultsImmediately: Boolean
  },
  status: String,            // active, paused, completed, cancelled
  assignedAt: Date,          // Assignment timestamp
  expiresAt: Date           // Assignment expiration
}
```

## 🔌 API Endpoints

### Teacher Endpoints

#### Get Registered Students
```http
GET /api/teacher/students/registered
Headers: x-admin-email: teacher@example.com
```
Returns all students registered in the system.

#### Get Active Students
```http
GET /api/teacher/students/active
Headers: x-admin-email: teacher@example.com
```
Returns students currently online.

#### Assign Quiz to Multiple Students
```http
POST /api/teacher/assign-quiz-multiple
Headers: 
  Content-Type: application/json
  x-admin-email: teacher@example.com
Body: {
  "quizId": "quiz_id_here",
  "studentIds": ["student_id_1", "student_id_2"]
}
```

#### Get Assigned Quizzes
```http
GET /api/teacher/assigned-quizzes
Headers: x-admin-email: teacher@example.com
```
Returns all quiz assignments made by the teacher.

### Student Endpoints

#### Get Assigned Quizzes
```http
GET /api/student/assigned-quizzes
Headers: x-admin-email: student@example.com
```
Returns only quizzes specifically assigned to the student by teachers.

#### Get Notifications
```http
GET /api/student/notifications
Headers: x-admin-email: student@example.com
```
Returns all notifications for the student.

#### Mark Notification as Read
```http
POST /api/student/notifications/:id/read
Headers: x-admin-email: student@example.com
```

#### Mark All Notifications as Read
```http
POST /api/student/notifications/read-all
Headers: x-admin-email: student@example.com
```

## 🔄 Real-time Features

### WebSocket Events

#### Teacher Events
- `join-teacher-room`: Teacher joins their room
- `student-online`: Student comes online
- `quiz-assigned-success`: Quiz assignment successful

#### Student Events
- `join-student-room`: Student joins their room
- `quiz-assigned`: New quiz assignment received

### Real-time Updates
- **Student Online Status**: Automatically updated when students connect/disconnect
- **Quiz Assignments**: Instant notifications sent to students
- **Teacher Notifications**: Real-time feedback on assignment success

## 🎨 Frontend Integration

### Teacher Dashboard
The Enhanced Teacher Dashboard now includes:
- **Student Management Tab**: View registered and active students
- **Quiz Assignment Dialog**: Select students and assign quizzes
- **Real-time Student Status**: See online/offline indicators
- **Assignment History**: Track all quiz assignments

### Student Dashboard
The Student Dashboard now includes:
- **Notifications Tab**: View and manage notifications
- **Quiz Assignment Notifications**: Special handling for quiz assignments
- **Real-time Updates**: Instant notification delivery

## 🧪 Testing

Run the test script to verify API functionality:
```bash
node test-student-api.js
```

This will test:
- Student retrieval endpoints
- Notification system
- Quiz assignment functionality
- Real-time features

## 📊 Sample Data

The system includes sample data with:
- 5 student users with realistic profiles
- 3 sample notifications (quiz assignments and announcements)
- 1 quiz assignment with multiple students
- Random online/offline status for testing

## 🔧 Configuration

### Environment Variables
```bash
MONGO_URI=mongodb://localhost:27017/voicera
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
```

### WebSocket Configuration
The WebSocket server runs on the same port as the HTTP server (4000) and supports:
- CORS for frontend connections
- Room-based messaging (teacher-{email}, student-{email})
- Automatic student status updates

## 🚀 Getting Started

1. **Start the server**:
   ```bash
   cd server
   npm start
   ```

2. **Seed the database**:
   The database will automatically seed with sample data on first run.

3. **Test the API**:
   ```bash
   node test-student-api.js
   ```

4. **Access the frontend**:
   Navigate to `http://localhost:5173` and log in as a teacher or student.

## 📝 Usage Examples

### Assigning a Quiz
1. Teacher logs in and goes to Enhanced Teacher Dashboard
2. Navigates to "Student Management" tab
3. Clicks "Assign to Students" on any quiz
4. Selects students from registered/active lists
5. Confirms assignment
6. Students receive instant notifications

### Student Receiving Notifications
1. Student logs in and goes to Student Dashboard
2. Navigates to "Notifications" tab
3. Sees new quiz assignment notification
4. Can view quiz details and mark as read
5. Real-time updates show new notifications instantly

### Student Taking Assigned Quizzes
1. Student logs in and goes to Student Dashboard
2. Navigates to "Quizzes" tab
3. Sees only quizzes assigned by teachers (not all available quizzes)
4. Each quiz shows assignment details (date assigned, due date, attempts, best score)
5. Can start/continue quizzes based on assignment status
6. Completed quizzes are marked with green borders

## 🔮 Future Enhancements

- **Email Notifications**: Send email alerts for quiz assignments
- **Push Notifications**: Mobile push notifications
- **Advanced Analytics**: Student engagement tracking
- **Bulk Operations**: Assign multiple quizzes at once
- **Custom Notifications**: Teacher-created announcements
- **Notification Preferences**: Granular notification settings

## 🐛 Troubleshooting

### Common Issues

1. **No students showing**: Ensure database is seeded with student data
2. **Notifications not appearing**: Check WebSocket connection and student email
3. **Assignment failing**: Verify quiz and student IDs exist
4. **Real-time not working**: Check WebSocket server is running

### Debug Mode
Enable debug logging by setting:
```bash
DEBUG=voicera:*
```

## 📄 License

This system is part of the Voicera AI educational platform.
