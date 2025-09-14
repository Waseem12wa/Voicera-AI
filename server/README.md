# Voicera AI Server

A comprehensive backend server for the Voicera AI educational platform with real-time analytics, file processing, and AI-powered features.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 5.0+
- Git

### Installation

1. **Clone and install dependencies:**
```bash
cd server
npm install
```

2. **Start MongoDB:**
```bash
# Option 1: Local MongoDB
mongod

# Option 2: MongoDB Atlas (Cloud)
# Create account at https://cloud.mongodb.com
# Update MONGO_URI in .env file
```

3. **Start the server:**
```bash
# Development mode with auto-restart
npm run dev

# Production mode
npm start

# Or use the startup script
node start-server.js
```

## 📊 Database Features

### Automatic Seeding
The server automatically seeds the database with real educational data from top universities:

- **Institutions**: Stanford, MIT, Harvard
- **Programs**: Computer Science, AI, Data Science, etc.
- **Courses**: Programming, ML, Web Dev, etc.
- **Users**: Teachers and students with realistic profiles
- **Content**: Sample files, quizzes, and interactions

### Real Data Integration
- User analytics from actual user records
- File statistics from uploaded content
- Quiz performance from student attempts
- Session tracking and user activity

## 🔧 API Endpoints

### Analytics Dashboard
- `GET /api/admin/analytics/users` - User statistics and growth
- `GET /api/admin/analytics/voice` - Voice command analytics
- `GET /api/admin/analytics/performance` - System performance metrics
- `GET /api/admin/analytics/errors` - Error tracking and trends
- `GET /api/admin/analytics/system` - System health monitoring

### Log Management
- `GET /api/admin/logs/sessions` - User session tracking
- `GET /api/admin/logs/voice-commands` - Voice command logs
- `GET /api/admin/logs/errors` - System error logs
- `POST /api/admin/logs/errors/:id/resolve` - Error resolution

### Content Management
- `GET /api/admin/content/stats` - File and quiz statistics
- `GET /api/admin/alerts/stats` - Alert management
- `GET /api/admin/rbac/stats` - User role statistics

### Real-time Features
- WebSocket support for live analytics
- Socket.IO namespaces for different features
- Real-time notifications and updates

## 🗄️ Database Models

### User Management
- **User**: Complete user profiles with roles and preferences
- **Institution**: Educational institution information
- **Program**: Academic programs and degrees
- **Course**: Individual courses and subjects

### Content & Learning
- **File**: Uploaded documents with AI analysis
- **Quiz**: Generated and custom quizzes
- **StudentInteraction**: AI-powered Q&A sessions
- **StudentNote**: Student note-taking system

## 🌐 Real-time Analytics

### Live Metrics
- Active user count
- System performance
- Error rates
- Voice command success rates

### Data Visualization
- Time-series charts
- User distribution pie charts
- Performance bar charts
- Error trend analysis

## 🔐 Authentication & Security

### Current Implementation
- Simple header-based auth for development
- Admin email from request headers
- JWT ready for production

### Production Ready
- Role-based access control (RBAC)
- User session management
- Secure file uploads
- API rate limiting

## 📁 File Structure

```
server/
├── index.js              # Main server file
├── start-server.js       # Startup script
├── models/               # Database models
│   ├── User.js
│   ├── File.js
│   ├── Quiz.js
│   └── ...
├── services/             # Business logic
│   ├── aiService.js
│   └── fileProcessor.js
├── seeds/                # Database seeding
│   └── educationalData.js
└── uploads/              # File storage
```

## 🚀 Deployment

### Environment Variables
```bash
MONGO_URI=mongodb://localhost:27017/voicera
CLIENT_ORIGIN=http://localhost:5173
PORT=4000
GROQ_API_KEY=your_groq_api_key
```

### Production Setup
1. Set up MongoDB Atlas or local MongoDB
2. Configure environment variables
3. Install PM2 for process management
4. Set up reverse proxy (Nginx)
5. Enable HTTPS

## 🔍 Monitoring & Debugging

### Logs
- Morgan HTTP logging
- Custom error tracking
- Real-time log streaming

### Health Checks
- `GET /api/health` - Basic health check
- `GET /api/test-groq` - AI service test
- System metrics endpoint

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
1. Check the logs in console
2. Verify MongoDB connection
3. Check environment variables
4. Review API documentation

---

**🎓 Built for Education** - Real data from top universities for authentic learning experiences.
