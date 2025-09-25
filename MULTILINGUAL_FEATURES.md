# Voicera AI - Multilingual Features Documentation

## Overview

Voicera AI now supports comprehensive multilingual capabilities that enable students to access educational content and interact with the system in their preferred language. The implementation includes voice commands in 20+ languages and automatic translation of recorded lectures and educational materials.

## 🌍 Supported Languages

### Voice Commands & Interface
- **English** (🇺🇸) - Default
- **Spanish** (🇪🇸) - Español
- **French** (🇫🇷) - Français
- **German** (🇩🇪) - Deutsch
- **Italian** (🇮🇹) - Italiano
- **Portuguese** (🇵🇹) - Português
- **Russian** (🇷🇺) - Русский
- **Japanese** (🇯🇵) - 日本語
- **Korean** (🇰🇷) - 한국어
- **Chinese** (🇨🇳) - 中文
- **Arabic** (🇸🇦) - العربية
- **Hindi** (🇮🇳) - हिन्दी
- **Urdu** (🇵🇰) - اردو
- **Bengali** (🇧🇩) - বাংলা
- **Turkish** (🇹🇷) - Türkçe
- **Dutch** (🇳🇱) - Nederlands
- **Swedish** (🇸🇪) - Svenska
- **Norwegian** (🇳🇴) - Norsk
- **Danish** (🇩🇰) - Dansk
- **Finnish** (🇫🇮) - Suomi

## 🎯 Core Features Implemented

### 1. Multilingual Voice Commands
- **Voice Recorder Component**: Advanced voice recording with language selection
- **Real-time Transcription**: Convert speech to text in multiple languages
- **Voice Command Processing**: AI-powered command interpretation and execution
- **Language Detection**: Automatic detection of spoken language
- **Voice Playback**: Play recorded audio with language indicators

### 2. Multilingual Content Access
- **File Translation**: Translate educational content to any supported language
- **Audio Transcript Translation**: Convert and translate audio transcripts
- **Batch Translation**: Translate multiple files simultaneously
- **Language-Specific UI**: Interface adapts to selected language (RTL support for Arabic/Urdu)
- **Translation Confidence**: Quality indicators for translated content

### 3. Educational Content Translation
- **Lecture Translation**: Translate recorded lectures and presentations
- **Document Translation**: Translate PDFs, Word docs, and text files
- **Quiz Translation**: Translate quizzes and assessments
- **Assignment Translation**: Translate assignments and instructions
- **Context-Aware Translation**: Maintains educational context and terminology

## 🏗️ Technical Architecture

### Frontend Components

#### Voice Components
- `VoiceRecorder.tsx` - Main voice recording interface
- `MultilingualFileViewer.tsx` - File viewer with translation capabilities
- `MultilingualFiles.tsx` - File management page

#### Services
- `multilingualService.ts` - API service for multilingual operations
- `voiceService.ts` - Voice processing and transcription services

### Backend Services

#### Voice Service (Microservice)
- **Location**: `microservices/voice-service/`
- **Features**:
  - Real-time voice command processing
  - Audio transcription in multiple languages
  - Language detection and validation
  - Voice command history and analytics
  - Socket.IO for real-time communication

#### Translation Service
- **Location**: `server/services/translationService.js`
- **Features**:
  - Text translation using Groq AI
  - Educational content translation
  - Audio transcript translation
  - Batch translation capabilities
  - Translation confidence scoring

#### API Endpoints
- `POST /api/translate/text` - Translate plain text
- `POST /api/translate/content` - Translate educational content
- `POST /api/translate/transcript` - Translate audio transcripts
- `GET /api/translate/languages` - Get supported languages
- `POST /api/translate/batch` - Batch translation
- `POST /api/voice/multilingual` - Process multilingual voice commands
- `POST /api/voice/transcribe` - Transcribe audio
- `GET /api/voice/languages` - Get voice-supported languages

## 🚀 Usage Guide

### For Students

#### Using Voice Commands
1. Navigate to the AI Assistant tab in the Student Dashboard
2. Click "Voice Command" button
3. Select your preferred language from the dropdown
4. Click "Start Recording" and speak your question
5. The system will transcribe and process your command
6. View the response in your selected language

#### Accessing Multilingual Content
1. Go to the Learning Materials tab
2. Click "🌍 Multilingual Access" button
3. Browse files with language filters
4. Click on any file to open the multilingual viewer
5. Select target language for translation
6. View content in your preferred language

#### Translating Content
1. Open any file in the multilingual viewer
2. Click "Translate" button
3. Select target language
4. Wait for translation to complete
5. View translated content with confidence indicators

### For Teachers

#### Uploading Multilingual Content
1. Upload files as usual through the teacher dashboard
2. The system automatically detects the language
3. Content becomes available for translation
4. Students can access in their preferred language

## 🔧 Configuration

### Environment Variables

#### Voice Service
```env
GROQ_API_KEY=your_groq_api_key
REDIS_HOST=localhost
REDIS_PORT=6379
MONGO_URI=mongodb://localhost:27017/voicera_voice
```

#### Main Server
```env
GROQ_API_KEY=your_groq_api_key
MONGO_URI=mongodb://localhost:27017/voicera
```

### Dependencies

#### Frontend
```json
{
  "socket.io-client": "^4.8.1",
  "web-speech-api": "^0.0.1"
}
```

#### Voice Service
```json
{
  "groq-sdk": "^0.32.0",
  "socket.io": "^4.8.1",
  "redis": "^4.6.0",
  "bull": "^4.12.0"
}
```

## 📊 Features in Detail

### Voice Command Processing
- **Language Detection**: Automatically detects spoken language
- **Intent Recognition**: Understands educational commands in any language
- **Context Awareness**: Maintains conversation context across languages
- **Real-time Processing**: Immediate response to voice commands
- **Command History**: Tracks and learns from user interactions

### Translation Quality
- **Confidence Scoring**: Each translation includes a confidence score
- **Educational Context**: Maintains academic terminology and structure
- **Cultural Adaptation**: Adapts content for different cultural contexts
- **Quality Indicators**: Visual indicators show translation quality
- **Fallback Handling**: Graceful degradation when translation fails

### User Experience
- **Language Selection**: Easy language switching throughout the interface
- **RTL Support**: Proper right-to-left text support for Arabic/Urdu
- **Visual Indicators**: Clear language indicators and flags
- **Responsive Design**: Works on all device sizes
- **Accessibility**: Screen reader compatible

## 🔍 API Examples

### Translate Text
```javascript
const response = await fetch('/api/translate/text', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: "Hello, how are you?",
    fromLanguage: "en",
    toLanguage: "es"
  })
})
```

### Process Voice Command
```javascript
const response = await fetch('/api/voice/multilingual', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    command: "Show me my courses",
    language: "es",
    context: { userId: "123" }
  })
})
```

### Translate File Content
```javascript
const response = await fetch('/api/translate/content', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: "Lecture content here...",
    fromLanguage: "en",
    toLanguage: "fr",
    contentType: "lecture"
  })
})
```

## 🎯 Future Enhancements

### Planned Features
- **Offline Translation**: Cache translations for offline access
- **Voice Synthesis**: Text-to-speech in multiple languages
- **Advanced Analytics**: Detailed usage analytics per language
- **Custom Language Models**: Institution-specific language training
- **Mobile App Support**: Native mobile voice commands
- **Integration APIs**: Third-party translation service integration

### Performance Optimizations
- **Translation Caching**: Cache frequently translated content
- **Batch Processing**: Optimize bulk translation operations
- **CDN Integration**: Distribute translated content globally
- **Real-time Updates**: WebSocket-based real-time translation updates

## 🐛 Troubleshooting

### Common Issues

#### Voice Recording Not Working
- Check microphone permissions in browser
- Ensure HTTPS connection for voice recording
- Verify audio format support

#### Translation Fails
- Check Groq API key configuration
- Verify internet connection
- Check content length limits

#### Language Detection Issues
- Ensure clear pronunciation
- Try speaking more slowly
- Check language selection accuracy

### Support
For technical support or feature requests, please contact the development team or create an issue in the project repository.

## 📈 Analytics and Monitoring

### Metrics Tracked
- Voice command success rate by language
- Translation quality scores
- User language preferences
- Content access patterns
- Performance metrics

### Monitoring
- Real-time translation queue status
- Voice processing latency
- Error rates and types
- User engagement metrics

---

**Note**: This implementation provides a solid foundation for multilingual educational content access. The system is designed to be extensible and can easily accommodate additional languages and features as needed.
