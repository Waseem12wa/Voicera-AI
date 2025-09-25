import React, { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Stack,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material'
import {
  Language as LanguageIcon,
  Translate as TranslateIcon,
  VolumeUp as VolumeIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  Download as DownloadIcon,
  Share as ShareIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material'

interface MultilingualFileViewerProps {
  file: {
    _id: string
    originalName: string
    content: string
    transcript?: string
    mimeType: string
    language?: string
    translations?: Array<{
      language: string
      content: string
      transcript?: string
      translatedAt: string
      confidence: number
    }>
  }
  onTranslate?: (fileId: string, fromLanguage: string, toLanguage: string) => Promise<void>
  onPlayAudio?: (audioUrl: string) => void
  onDownload?: (fileId: string, language?: string) => void
}

interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
  rtl: boolean
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', rtl: false },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', rtl: false },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', rtl: false },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', rtl: false },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', rtl: false },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', rtl: false },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', rtl: false },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳', rtl: false },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰', rtl: true },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩', rtl: false },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷', rtl: false },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', rtl: false },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', rtl: false },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', rtl: false },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', rtl: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', rtl: false }
]

const MultilingualFileViewer: React.FC<MultilingualFileViewerProps> = ({
  file,
  onTranslate,
  onPlayAudio,
  onDownload
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState(file.language || 'en')
  const [isTranslating, setIsTranslating] = useState(false)
  const [translationError, setTranslationError] = useState<string | null>(null)
  const [showTranslationDialog, setShowTranslationDialog] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState('es')
  const [isPlaying, setIsPlaying] = useState(false)

  const getLanguageInfo = (code: string): SupportedLanguage => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0]
  }

  const getCurrentContent = () => {
    if (selectedLanguage === (file.language || 'en')) {
      return file.content
    }
    
    const translation = file.translations?.find(t => t.language === selectedLanguage)
    return translation?.content || file.content
  }

  const getCurrentTranscript = () => {
    if (selectedLanguage === (file.language || 'en')) {
      return file.transcript
    }
    
    const translation = file.translations?.find(t => t.language === selectedLanguage)
    return translation?.transcript || file.transcript
  }

  const handleTranslate = async () => {
    if (!onTranslate) return
    
    setIsTranslating(true)
    setTranslationError(null)
    
    try {
      await onTranslate(file._id, file.language || 'en', targetLanguage)
      setShowTranslationDialog(false)
    } catch (error) {
      setTranslationError(error instanceof Error ? error.message : 'Translation failed')
    } finally {
      setIsTranslating(false)
    }
  }

  const handleCopyContent = () => {
    const content = getCurrentContent()
    navigator.clipboard.writeText(content)
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${file.originalName} - ${getLanguageInfo(selectedLanguage).nativeName}`,
        text: getCurrentContent().substring(0, 200) + '...',
        url: window.location.href
      })
    }
  }

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file._id, selectedLanguage)
    }
  }

  const currentLanguageInfo = getLanguageInfo(selectedLanguage)
  const currentContent = getCurrentContent()
  const currentTranscript = getCurrentTranscript()

  return (
    <Box>
      {/* Language Selector and Actions */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
            <Stack direction="row" spacing={2} alignItems="center">
              <LanguageIcon color="primary" />
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <InputLabel>View Language</InputLabel>
                <Select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value)}
                  label="View Language"
                >
                  {/* Original Language */}
                  <MenuItem value={file.language || 'en'}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography>{getLanguageInfo(file.language || 'en').flag}</Typography>
                      <Typography>{getLanguageInfo(file.language || 'en').nativeName}</Typography>
                      <Chip label="Original" size="small" color="primary" />
                    </Stack>
                  </MenuItem>
                  
                  {/* Available Translations */}
                  {file.translations?.map((translation) => (
                    <MenuItem key={translation.language} value={translation.language}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{getLanguageInfo(translation.language).flag}</Typography>
                        <Typography>{getLanguageInfo(translation.language).nativeName}</Typography>
                        <Chip 
                          label={`${Math.round(translation.confidence * 100)}%`} 
                          size="small" 
                          color={translation.confidence > 0.8 ? 'success' : 'warning'}
                        />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>

            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<TranslateIcon />}
                onClick={() => setShowTranslationDialog(true)}
                size="small"
              >
                Translate
              </Button>
              <IconButton onClick={handleCopyContent} size="small">
                <CopyIcon />
              </IconButton>
              <IconButton onClick={handleShare} size="small">
                <ShareIcon />
              </IconButton>
              <IconButton onClick={handleDownload} size="small">
                <DownloadIcon />
              </IconButton>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* Translation Progress */}
      {isTranslating && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center">
              <TranslateIcon color="primary" />
              <Box sx={{ flex: 1 }}>
                <Typography variant="body2" gutterBottom>
                  Translating to {getLanguageInfo(targetLanguage).nativeName}...
                </Typography>
                <LinearProgress />
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {/* Translation Error */}
      {translationError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTranslationError(null)}>
          {translationError}
        </Alert>
      )}

      {/* File Content */}
      <Card>
        <CardContent>
          <Stack spacing={2}>
            {/* Header */}
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" gutterBottom>
                  {file.originalName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip 
                    icon={<LanguageIcon />}
                    label={currentLanguageInfo.nativeName}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {selectedLanguage !== (file.language || 'en') && (
                    <Chip 
                      label="Translated"
                      size="small"
                      color="success"
                      variant="outlined"
                    />
                  )}
                </Stack>
              </Box>
              
              {/* Audio Controls */}
              {currentTranscript && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <IconButton 
                    onClick={() => {
                      setIsPlaying(!isPlaying)
                      // Implement audio playback
                    }}
                    color="primary"
                  >
                    {isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </IconButton>
                  <Typography variant="caption">
                    Audio Available
                  </Typography>
                </Stack>
              )}
            </Stack>

            <Divider />

            {/* Content */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'grey.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'grey.200',
                direction: currentLanguageInfo.rtl ? 'rtl' : 'ltr',
                textAlign: currentLanguageInfo.rtl ? 'right' : 'left'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  whiteSpace: 'pre-wrap',
                  lineHeight: 1.6,
                  fontFamily: currentLanguageInfo.rtl ? 'Arial, sans-serif' : 'inherit'
                }}
              >
                {currentContent}
              </Typography>
            </Box>

            {/* Transcript */}
            {currentTranscript && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  <VolumeIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Audio Transcript ({currentLanguageInfo.nativeName})
                </Typography>
                <Box 
                  sx={{ 
                    p: 2, 
                    bgcolor: 'primary.50', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'primary.200',
                    direction: currentLanguageInfo.rtl ? 'rtl' : 'ltr',
                    textAlign: currentLanguageInfo.rtl ? 'right' : 'left'
                  }}
                >
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      whiteSpace: 'pre-wrap',
                      lineHeight: 1.6,
                      fontFamily: currentLanguageInfo.rtl ? 'Arial, sans-serif' : 'inherit'
                    }}
                  >
                    {currentTranscript}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* Translation Dialog */}
      <Dialog open={showTranslationDialog} onClose={() => setShowTranslationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" spacing={2} alignItems="center">
            <TranslateIcon color="primary" />
            <Typography variant="h6">
              Translate Content
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Translate "{file.originalName}" to your preferred language
            </Typography>
            
            <FormControl fullWidth>
              <InputLabel>Target Language</InputLabel>
              <Select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                label="Target Language"
              >
                {SUPPORTED_LANGUAGES
                  .filter(lang => lang.code !== (file.language || 'en'))
                  .map((lang) => (
                    <MenuItem key={lang.code} value={lang.code}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography>{lang.flag}</Typography>
                        <Typography>{lang.nativeName}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          ({lang.name})
                        </Typography>
                      </Stack>
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Alert severity="info">
              Translation will be processed using AI and may take a few moments. 
              The translated content will be saved for future access.
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTranslationDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleTranslate}
            variant="contained"
            disabled={isTranslating}
            sx={{ borderRadius: '50px', px: 3 }}
          >
            {isTranslating ? 'Translating...' : 'Translate'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default MultilingualFileViewer
