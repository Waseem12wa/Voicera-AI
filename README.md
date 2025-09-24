# 🎓 Voicera AI - Educational Platform

A comprehensive AI-powered educational platform that enables teachers to upload content and automatically generate quizzes, while providing students with access to learning materials and interactive assessments.

## ✨ Features

### 👨‍🏫 Teacher Dashboard
- **File Upload & Management** - Upload PDF, DOC, PPT, TXT, audio, and voice files
- **AI Quiz Generation** - Automatic quiz creation from uploaded content
- **Content Analysis** - AI-powered summaries, tags, and difficulty assessment
- **File Detail Pages** - Comprehensive view with additional information
- **Professional UI** - Clean white and blue design with responsive layout

### 👨‍🎓 Student Dashboard
- **Learning Materials Access** - View all teacher-uploaded content
- **Interactive Quizzes** - Take AI-generated quizzes with detailed results
- **PDF Downloads** - Download comprehensive file summaries
- **Progress Tracking** - Monitor learning achievements and scores
- **AI Assistant** - Ask questions and get AI-powered answers

### 🔧 Technical Features
- **Real-time Processing** - Background file analysis with status updates
- **Fallback Systems** - Robust error handling and default content
- **Role-based Access** - Different features for teachers vs students
- **PDF Generation** - Automatic summary creation for downloads
- **Responsive Design** - Works seamlessly on all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB database
- Groq API key for AI features

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd voicera-ai
   ```

2. **Install backend dependencies**
   ```bash
   cd server
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Setup**
   
   Create `.env` file in `server/` directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/voicera-ai
   GROQ_API_KEY=your_groq_api_key_here
   JWT_SECRET=your_jwt_secret_here
   PORT=5000
   ```

### Running the Application

1. **Start the backend server**
   ```bash
   cd server
   npm start
   ```
   Server will run on: `http://localhost:5000`

2. **Start the frontend development server**
   ```bash
   cd frontend
   npm run dev
   ```
   Frontend will run on: `http://localhost:5173`

## 👥 User Access

### Teacher Portal
- **URL**: `http://localhost:5173/teacher`
- **Features**: Upload files, generate quizzes, manage content, view analytics

### Student Portal
- **URL**: `http://localhost:5173/student`
- **Features**: Access materials, take quizzes, download summaries, track progress

### Default Login Credentials
```
Teacher: teacher@example.com / password123
Student: student@example.com / password123
```

## 📁 Project Structure

```
voicera-ai/
├── server/                 # Backend API server
│   ├── services/          # AI and file processing services
│   ├── models/            # Database models
│   └── index.js           # Main server file
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── pages/         # Page components
│   │   │   ├── teacher/   # Teacher dashboard
│   │   │   └── student/   # Student dashboard
│   │   ├── services/      # API service functions
│   │   └── features/      # Redux state management
│   └── public/            # Static assets
└── README.md              # This file
```

## 🔧 API Endpoints

### Teacher Endpoints
- `POST /api/teacher/upload` - Upload files
- `GET /api/teacher/uploads` - Get uploaded files
- `POST /api/teacher/generate-quiz` - Generate AI quiz
- `GET /api/teacher/files/:id` - Get file details

### Student Endpoints
- `GET /api/student/files` - Get accessible files
- `GET /api/student/files/:id` - Get file details
- `GET /api/student/files/:id/download` - Download PDF summary
- `POST /api/student/submit-quiz` - Submit quiz answers

## 🎨 UI/UX Features

- **Professional Color Scheme** - Clean white and blue design
- **Responsive Layout** - Works on desktop, tablet, and mobile
- **Modern Interface** - Gradient cards, smooth animations, hover effects
- **High Contrast** - Excellent readability with white text on blue backgrounds
- **Intuitive Navigation** - Easy-to-use tabs and navigation chips

## 🛠️ Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env` file

2. **AI Features Not Working**
   - Verify Groq API key is valid and has sufficient credits
   - Check API key in `.env` file

3. **File Upload Issues**
   - Ensure file size is under limit (default: 10MB)
   - Check file format is supported

4. **Frontend Not Loading**
   - Verify all dependencies are installed (`npm install`)
   - Check for any console errors

### Development Tips

- Use browser developer tools to debug frontend issues
- Check server logs for backend errors
- Ensure all environment variables are set correctly
- Test with different file types and sizes

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Ready to revolutionize education with AI! 🎉**
