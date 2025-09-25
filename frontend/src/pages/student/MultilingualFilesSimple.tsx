import { useState } from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Stack,
  Alert,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import TranslationDialog from '../../components/translation/TranslationDialog'
import { translateText } from '../../services/translationService'

const MultilingualFilesSimple = () => {
  const navigate = useNavigate()
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [translationDialogOpen, setTranslationDialogOpen] = useState(false)
  const [quickTranslateText, setQuickTranslateText] = useState('')

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: ({ text, fromLanguage, toLanguage }: { text: string; fromLanguage: string; toLanguage: string }) =>
      translateText({ text, fromLanguage, toLanguage, contentType: 'educational' }),
    onSuccess: (data) => {
      enqueueSnackbar(`Translation: "${data.translatedText}" (${Math.round(data.confidence * 100)}% confidence)`, { 
        variant: 'success',
        autoHideDuration: 8000
      })
    },
    onError: (error: any) => {
      console.error('Translation error:', error)
      
      // Show fallback demo translation
      const demoTranslations: { [key: string]: string } = {
        'en': 'Hello, how are you?',
        'es': 'Hola, ¿cómo estás?',
        'fr': 'Bonjour, comment allez-vous?',
        'de': 'Hallo, wie geht es dir?',
        'it': 'Ciao, come stai?',
        'pt': 'Olá, como você está?',
        'ru': 'Привет, как дела?',
        'ja': 'こんにちは、元気ですか？',
        'ko': '안녕하세요, 어떻게 지내세요?',
        'zh': '你好，你好吗？',
        'ar': 'مرحبا، كيف حالك؟',
        'hi': 'नमस्ते, आप कैसे हैं?',
        'ur': 'ہیلو، آپ کیسے ہیں؟',
        'bn': 'হ্যালো, আপনি কেমন আছেন?',
        'tr': 'Merhaba, nasılsın?'
      }

      const selectedLangInfo = languages.find(l => l.code === selectedLanguage)
      const demoText = demoTranslations[selectedLanguage] || `Demo translation to ${selectedLangInfo?.name || selectedLanguage}`
      
      enqueueSnackbar(`Demo translation: "${demoText}" (API not available)`, { 
        variant: 'info',
        autoHideDuration: 5000
      })
    }
  })

  const handleBrowseFiles = () => {
    // Navigate to the regular files page
    navigate('/student/files')
  }

  const handleTranslateContent = () => {
    console.log('Opening translation dialog...')
    console.log('Current dialog state:', translationDialogOpen)
    setTranslationDialogOpen(true)
    console.log('Dialog state after setting:', translationDialogOpen)
  }

  const handleQuickTranslate = () => {
    if (!quickTranslateText.trim()) {
      enqueueSnackbar('Please enter text to translate', { variant: 'warning' })
      return
    }

    // Use the real translation mutation
    translateMutation.mutate({
      text: quickTranslateText,
      fromLanguage: 'auto',
      toLanguage: selectedLanguage
    })
  }

  const languages = [
    { code: 'en', name: '🇺🇸 English', flag: '🇺🇸' },
    { code: 'es', name: '🇪🇸 Spanish', flag: '🇪🇸' },
    { code: 'fr', name: '🇫🇷 French', flag: '🇫🇷' },
    { code: 'de', name: '🇩🇪 German', flag: '🇩🇪' },
    { code: 'it', name: '🇮🇹 Italian', flag: '🇮🇹' },
    { code: 'pt', name: '🇵🇹 Portuguese', flag: '🇵🇹' },
    { code: 'ru', name: '🇷🇺 Russian', flag: '🇷🇺' },
    { code: 'ja', name: '🇯🇵 Japanese', flag: '🇯🇵' },
    { code: 'ko', name: '🇰🇷 Korean', flag: '🇰🇷' },
    { code: 'zh', name: '🇨🇳 Chinese', flag: '🇨🇳' },
    { code: 'ar', name: '🇸🇦 Arabic', flag: '🇸🇦' },
    { code: 'hi', name: '🇮🇳 Hindi', flag: '🇮🇳' },
    { code: 'ur', name: '🇵🇰 Urdu', flag: '🇵🇰' },
    { code: 'bn', name: '🇧🇩 Bengali', flag: '🇧🇩' },
    { code: 'tr', name: '🇹🇷 Turkish', flag: '🇹🇷' }
  ]

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🌍 Multilingual Learning Materials
      </Typography>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="body1" gutterBottom>
            Access your course materials in your preferred language. All content can be translated to 20+ languages.
          </Typography>
          
          {/* Language Selection */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Select Your Preferred Language
            </Typography>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                label="Language"
              >
                {languages.map((lang) => (
                  <MenuItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Selected: {languages.find(l => l.code === selectedLanguage)?.name}
            </Typography>
          </Box>

          {/* Quick Translation */}
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Translation
            </Typography>
            <Stack spacing={2}>
              <TextField
                fullWidth
                multiline
                rows={3}
                value={quickTranslateText}
                onChange={(e) => setQuickTranslateText(e.target.value)}
                placeholder="Enter text to translate quickly..."
                variant="outlined"
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button 
                  variant="contained" 
                  onClick={handleQuickTranslate}
                  disabled={translateMutation.isPending || !quickTranslateText.trim()}
                  sx={{ flex: 1 }}
                >
                  {translateMutation.isPending ? 'Translating...' : '🌐 Quick Translate'}
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleTranslateContent}
                  sx={{ flex: 1 }}
                >
                  🔧 Advanced Translation
                </Button>
              </Stack>
            </Stack>
          </Box>

          {/* Action Buttons */}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
            <Button 
              variant="contained" 
              onClick={handleBrowseFiles}
              sx={{ flex: 1 }}
            >
              📁 Browse All Files
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => {
                // Open voice command dialog or navigate to voice features
                alert('Voice commands are available in the main dashboard. Click "Voice Command" button in the AI Assistant tab.')
                navigate('/student')
              }}
              sx={{ flex: 1 }}
            >
              🎤 Voice Commands
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Language Chips */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Supported Languages
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {languages.map((lang) => (
              <Chip
                key={lang.code}
                label={lang.name}
                variant={selectedLanguage === lang.code ? 'filled' : 'outlined'}
                color={selectedLanguage === lang.code ? 'primary' : 'default'}
                onClick={() => setSelectedLanguage(lang.code)}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Features Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Multilingual Features
          </Typography>
          <Stack spacing={2}>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Voice Commands:</strong> Speak naturally in your preferred language to ask questions about your courses.
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Content Translation:</strong> Translate lectures, documents, and assignments to any supported language.
              </Typography>
            </Alert>
            <Alert severity="info">
              <Typography variant="body2">
                <strong>Real-time Processing:</strong> Get instant responses and translations as you learn.
              </Typography>
            </Alert>
          </Stack>
        </CardContent>
      </Card>

      {/* Translation Dialog */}
      <TranslationDialog
        open={translationDialogOpen}
        onClose={() => setTranslationDialogOpen(false)}
        initialText={quickTranslateText}
        initialFromLanguage="auto"
        initialToLanguage={selectedLanguage}
      />
    </Box>
  )
}

export default MultilingualFilesSimple
