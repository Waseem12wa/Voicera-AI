import React, { useState, useRef, useEffect } from 'react'
import { 
  Box, 
  Button, 
  IconButton, 
  Typography, 
  Stack, 
  Chip, 
  Select, 
  MenuItem, 
  FormControl, 
  InputLabel,
  LinearProgress,
  Alert,
  Card,
  CardContent
} from '@mui/material'
import { 
  Mic as MicIcon, 
  MicOff as MicOffIcon, 
  Stop as StopIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  VolumeUp as VolumeIcon,
  Language as LanguageIcon,
  Translate as TranslateIcon
} from '@mui/icons-material'

interface VoiceRecorderProps {
  onTranscript?: (transcript: string, language: string) => void
  onError?: (error: string) => void
  disabled?: boolean
  supportedLanguages?: string[]
  defaultLanguage?: string
  showLanguageSelector?: boolean
  showPlayback?: boolean
  maxRecordingTime?: number // in seconds
}

interface SupportedLanguage {
  code: string
  name: string
  nativeName: string
  flag: string
}

const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇵🇰' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮' }
]

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onTranscript,
  onError,
  disabled = false,
  supportedLanguages = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'ur', 'bn', 'tr'],
  defaultLanguage = 'en',
  showLanguageSelector = true,
  showPlayback = true,
  maxRecordingTime = 60
}) => {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLanguage)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Get available languages based on supported languages prop
  const availableLanguages = SUPPORTED_LANGUAGES.filter(lang => 
    supportedLanguages.includes(lang.code)
  )

  useEffect(() => {
    // Request microphone permission on component mount
    requestMicrophonePermission()
    
    return () => {
      cleanup()
    }
  }, [])

  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= maxRecordingTime) {
            stopRecording()
            return maxRecordingTime
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, isPaused, maxRecordingTime])

  const requestMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      setPermissionGranted(true)
      stream.getTracks().forEach(track => track.stop()) // Stop the test stream
    } catch (err) {
      setPermissionGranted(false)
      setError('Microphone permission denied. Please allow microphone access to use voice features.')
    }
  }

  const startRecording = async () => {
    try {
      setError(null)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      })
      
      streamRef.current = stream
      audioChunksRef.current = []

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        setAudioBlob(audioBlob)
        setAudioUrl(URL.createObjectURL(audioBlob))
        
        // Process the audio for transcription
        processAudio(audioBlob)
      }

      mediaRecorder.start(1000) // Collect data every second
      setIsRecording(true)
      setIsPaused(false)
      setRecordingTime(0)

    } catch (err) {
      setError('Failed to start recording. Please check your microphone permissions.')
      onError?.('Failed to start recording')
    }
  }

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume()
        setIsPaused(false)
      } else {
        mediaRecorderRef.current.pause()
        setIsPaused(true)
      }
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      setIsPaused(false)
      
      // Stop all tracks
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
        streamRef.current = null
      }
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true)
    try {
      // Convert audio to base64 for API call
      const arrayBuffer = await audioBlob.arrayBuffer()
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

      // Send to voice service for transcription
      const response = await fetch('http://localhost:3001/api/voice/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audio: base64Audio,
          language: selectedLanguage,
          mimeType: audioBlob.type
        })
      })

      if (!response.ok) {
        throw new Error('Transcription failed')
      }

      const result = await response.json()
      setTranscript(result.transcript || '')
      onTranscript?.(result.transcript || '', selectedLanguage)

    } catch (err: any) {
      console.error('Audio processing error:', err)
      let errorMessage = 'Failed to process audio. Please try again.'
      
      if (err.message?.includes('Network Error') || err.message?.includes('Failed to fetch')) {
        errorMessage = 'Voice service is not available. Please ensure the voice service is running.'
      } else if (err.message?.includes('Transcription failed')) {
        errorMessage = 'Audio transcription failed. Please try speaking more clearly.'
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }

  const playAudio = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        audioRef.current.play()
        setIsPlaying(true)
      }
    }
  }

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
    }
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl)
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getLanguageInfo = (code: string) => {
    return SUPPORTED_LANGUAGES.find(lang => lang.code === code) || SUPPORTED_LANGUAGES[0]
  }

  if (permissionGranted === false) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        <Typography variant="body2">
          Microphone access is required for voice features. Please allow microphone access in your browser settings.
        </Typography>
      </Alert>
    )
  }

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Stack spacing={2}>
          {/* Language Selector */}
          {showLanguageSelector && (
            <FormControl fullWidth size="small">
              <InputLabel>Voice Language</InputLabel>
              <Select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                label="Voice Language"
                disabled={isRecording || disabled}
              >
                {availableLanguages.map((lang) => (
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
          )}

          {/* Recording Controls */}
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
            {!isRecording ? (
              <Button
                variant="contained"
                size="large"
                onClick={startRecording}
                disabled={disabled || permissionGranted === false}
                startIcon={<MicIcon />}
                sx={{
                  borderRadius: '50px',
                  px: 3,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
                  }
                }}
              >
                Start Recording
              </Button>
            ) : (
              <>
                <IconButton
                  onClick={pauseRecording}
                  color={isPaused ? 'primary' : 'warning'}
                  size="large"
                >
                  {isPaused ? <PlayIcon /> : <PauseIcon />}
                </IconButton>
                
                <Button
                  variant="contained"
                  color="error"
                  size="large"
                  onClick={stopRecording}
                  startIcon={<StopIcon />}
                  sx={{ borderRadius: '50px', px: 3, py: 1.5 }}
                >
                  Stop Recording
                </Button>
              </>
            )}
          </Stack>

          {/* Recording Status */}
          {isRecording && (
            <Box sx={{ textAlign: 'center' }}>
              <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                <MicIcon color={isPaused ? 'warning' : 'error'} />
                <Typography variant="body2" color={isPaused ? 'warning.main' : 'error.main'}>
                  {isPaused ? 'Recording Paused' : 'Recording...'}
                </Typography>
              </Stack>
              
              <Typography variant="h6" sx={{ mt: 1 }}>
                {formatTime(recordingTime)}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={(recordingTime / maxRecordingTime) * 100}
                sx={{ mt: 1, height: 8, borderRadius: 4 }}
              />
              
              <Typography variant="caption" color="text.secondary">
                Max recording time: {formatTime(maxRecordingTime)}
              </Typography>
            </Box>
          )}

          {/* Processing Status */}
          {isProcessing && (
            <Box sx={{ textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Processing audio and generating transcript...
              </Typography>
            </Box>
          )}

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Audio Playback */}
          {showPlayback && audioUrl && (
            <Box>
              <Stack direction="row" spacing={2} alignItems="center">
                <IconButton onClick={playAudio} color="primary">
                  {isPlaying ? <PauseIcon /> : <PlayIcon />}
                </IconButton>
                <Typography variant="body2">
                  {isPlaying ? 'Playing...' : 'Play Recording'}
                </Typography>
                <Chip 
                  icon={<VolumeIcon />} 
                  label={`${getLanguageInfo(selectedLanguage).nativeName}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
              </Stack>
              
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
            </Box>
          )}

          {/* Transcript Display */}
          {transcript && (
            <Box>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <TranslateIcon color="primary" />
                <Typography variant="subtitle2" color="primary">
                  Transcript ({getLanguageInfo(selectedLanguage).nativeName})
                </Typography>
              </Stack>
              <Typography 
                variant="body2" 
                sx={{ 
                  p: 2, 
                  bgcolor: 'grey.50', 
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                {transcript}
              </Typography>
            </Box>
          )}

          {/* Language Info */}
          <Box sx={{ textAlign: 'center' }}>
            <Chip 
              icon={<LanguageIcon />}
              label={`Speaking: ${getLanguageInfo(selectedLanguage).nativeName}`}
              size="small"
              color="primary"
              variant="outlined"
            />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default VoiceRecorder
