import React, { useState, useRef, useEffect } from 'react'
import {
	Box,
	Button,
	Paper,
	Typography,
	Stack,
	IconButton,
	LinearProgress,
	Chip,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Alert
} from '@mui/material'
import {
	Mic as MicIcon,
	MicOff as MicOffIcon,
	Stop as StopIcon,
	PlayArrow as PlayIcon,
	Pause as PauseIcon,
	Upload as UploadIcon,
	VolumeUp as VolumeIcon
} from '@mui/icons-material'

interface VoiceInputProps {
	onTranscript: (transcript: string, audioBlob?: Blob) => void
	onAudioUpload: (audioFile: File) => void
	isProcessing?: boolean
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, onAudioUpload, isProcessing = false }) => {
	const [isRecording, setIsRecording] = useState(false)
	const [isPaused, setIsPaused] = useState(false)
	const [transcript, setTranscript] = useState('')
	const [recordingTime, setRecordingTime] = useState(0)
	const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
	const [showTranscriptDialog, setShowTranscriptDialog] = useState(false)
	const [editedTranscript, setEditedTranscript] = useState('')
	const [error, setError] = useState('')

	const mediaRecorderRef = useRef<MediaRecorder | null>(null)
	const audioChunksRef = useRef<Blob[]>([])
	const recognitionRef = useRef<SpeechRecognition | null>(null)
	const timerRef = useRef<NodeJS.Timeout | null>(null)

	// Check for browser support
	const isSpeechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
	const isMediaRecorderSupported = 'MediaRecorder' in window

	useEffect(() => {
		if (isSpeechRecognitionSupported) {
			const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
			recognitionRef.current = new SpeechRecognition()
			recognitionRef.current.continuous = true
			recognitionRef.current.interimResults = true
			recognitionRef.current.lang = 'en-US'

			recognitionRef.current.onresult = (event) => {
				let finalTranscript = ''
				let interimTranscript = ''

				for (let i = event.resultIndex; i < event.results.length; i++) {
					const transcript = event.results[i][0].transcript
					if (event.results[i].isFinal) {
						finalTranscript += transcript
					} else {
						interimTranscript += transcript
					}
				}

				setTranscript(prev => prev + finalTranscript)
			}

			recognitionRef.current.onerror = (event) => {
				console.error('Speech recognition error:', event.error)
				setError(`Speech recognition error: ${event.error}`)
				setIsRecording(false)
			}

			recognitionRef.current.onend = () => {
				if (isRecording && !isPaused) {
					// Restart recognition if it ended unexpectedly
					setTimeout(() => {
						if (recognitionRef.current && isRecording) {
							recognitionRef.current.start()
						}
					}, 100)
				}
			}
		}
	}, [isRecording, isPaused])

	useEffect(() => {
		if (isRecording && !isPaused) {
			timerRef.current = setInterval(() => {
				setRecordingTime(prev => prev + 1)
			}, 1000)
		} else {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}

		return () => {
			if (timerRef.current) {
				clearInterval(timerRef.current)
			}
		}
	}, [isRecording, isPaused])

	const startRecording = async () => {
		try {
			setError('')
			setTranscript('')
			setRecordingTime(0)
			setAudioBlob(null)

			// Start audio recording
			if (isMediaRecorderSupported) {
				const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
				mediaRecorderRef.current = new MediaRecorder(stream)
				audioChunksRef.current = []

				mediaRecorderRef.current.ondataavailable = (event) => {
					if (event.data.size > 0) {
						audioChunksRef.current.push(event.data)
					}
				}

				mediaRecorderRef.current.onstop = () => {
					const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
					setAudioBlob(audioBlob)
					stream.getTracks().forEach(track => track.stop())
				}

				mediaRecorderRef.current.start()
			}

			// Start speech recognition
			if (isSpeechRecognitionSupported && recognitionRef.current) {
				recognitionRef.current.start()
			}

			setIsRecording(true)
			setIsPaused(false)
		} catch (err) {
			console.error('Error starting recording:', err)
			setError('Failed to start recording. Please check microphone permissions.')
		}
	}

	const pauseRecording = () => {
		if (isRecording) {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
				mediaRecorderRef.current.pause()
			}
			if (recognitionRef.current) {
				recognitionRef.current.stop()
			}
			setIsPaused(true)
		}
	}

	const resumeRecording = () => {
		if (isPaused) {
			if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'paused') {
				mediaRecorderRef.current.resume()
			}
			if (recognitionRef.current) {
				recognitionRef.current.start()
			}
			setIsPaused(false)
		}
	}

	const stopRecording = () => {
		if (mediaRecorderRef.current) {
			mediaRecorderRef.current.stop()
		}
		if (recognitionRef.current) {
			recognitionRef.current.stop()
		}
		setIsRecording(false)
		setIsPaused(false)
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			// Check file size (max 100MB for audio files)
			if (file.size > 100 * 1024 * 1024) {
				setError('File size too large. Maximum size is 100MB.')
				return
			}

			// Check file type
			if (!file.type.startsWith('audio/')) {
				setError('Please select an audio file.')
				return
			}

			onAudioUpload(file)
		}
	}

	const formatTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60)
		const secs = seconds % 60
		return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
	}

	const handleSubmitTranscript = () => {
		const finalTranscript = editedTranscript || transcript
		if (finalTranscript.trim()) {
			onTranscript(finalTranscript, audioBlob || undefined)
			setShowTranscriptDialog(false)
			setTranscript('')
			setEditedTranscript('')
			setAudioBlob(null)
			setRecordingTime(0)
		}
	}

	const handleEditTranscript = () => {
		setEditedTranscript(transcript)
		setShowTranscriptDialog(true)
	}

	return (
		<Box>
			{error && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{error}
				</Alert>
			)}

			{/* Voice Recording Section */}
			<Paper sx={{ p: 3, mb: 2 }}>
				<Typography variant="h6" gutterBottom>
					🎤 Voice Recording
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Record your voice directly in the browser. Perfect for lectures, explanations, and quick notes.
				</Typography>

				<Stack direction="row" alignItems="center" spacing={2} sx={{ mt: 2 }}>
					{!isRecording ? (
						<Button
							variant="contained"
							startIcon={<MicIcon />}
							onClick={startRecording}
							disabled={!isSpeechRecognitionSupported || isProcessing}
							sx={{
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 3,
								py: 1,
								bgcolor: 'success.main',
								'&:hover': { bgcolor: 'success.dark' }
							}}
						>
							Start Recording
						</Button>
					) : (
						<Stack direction="row" spacing={1}>
							{isPaused ? (
								<Button
									variant="contained"
									startIcon={<PlayIcon />}
									onClick={resumeRecording}
									sx={{ borderRadius: '50px' }}
								>
									Resume
								</Button>
							) : (
								<Button
									variant="outlined"
									startIcon={<PauseIcon />}
									onClick={pauseRecording}
									sx={{ borderRadius: '50px' }}
								>
									Pause
								</Button>
							)}
							<Button
								variant="contained"
								color="error"
								startIcon={<StopIcon />}
								onClick={stopRecording}
								sx={{ borderRadius: '50px' }}
							>
								Stop
							</Button>
						</Stack>
					)}

					{isRecording && (
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
							<Chip
								icon={<MicIcon />}
								label={`Recording: ${formatTime(recordingTime)}`}
								color="error"
								variant="filled"
							/>
							{audioBlob && (
								<Chip
									icon={<VolumeIcon />}
									label="Audio Captured"
									color="success"
									variant="outlined"
								/>
							)}
						</Box>
					)}
				</Stack>

				{transcript && (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle2" gutterBottom>
							Live Transcript:
						</Typography>
						<Paper sx={{ p: 2, bgcolor: 'grey.50', maxHeight: 200, overflow: 'auto' }}>
							<Typography variant="body2">
								{transcript}
							</Typography>
						</Paper>
						<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
							<Button
								variant="outlined"
								size="small"
								onClick={handleEditTranscript}
								disabled={isRecording}
							>
								Edit Transcript
							</Button>
							<Button
								variant="contained"
								size="small"
								onClick={handleSubmitTranscript}
								disabled={isRecording || !transcript.trim()}
							>
								Submit Transcript
							</Button>
						</Stack>
					</Box>
				)}
			</Paper>

			{/* Audio File Upload Section */}
			<Paper sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					📁 Upload Audio File
				</Typography>
				<Typography variant="body2" color="text.secondary" gutterBottom>
					Upload audio files (MP3, WAV, M4A, etc.) up to 100MB. Supports files up to 30-40 minutes.
				</Typography>

				<Button
					variant="outlined"
					startIcon={<UploadIcon />}
					component="label"
					disabled={isProcessing}
					sx={{
						borderRadius: '50px',
						fontWeight: 'bold',
						px: 3,
						py: 1,
						mt: 2
					}}
				>
					Upload Audio File
					<input
						hidden
						type="file"
						accept="audio/*"
						onChange={handleFileUpload}
					/>
				</Button>
			</Paper>

			{/* Transcript Edit Dialog */}
			<Dialog open={showTranscriptDialog} onClose={() => setShowTranscriptDialog(false)} maxWidth="md" fullWidth>
				<DialogTitle>Edit Transcript</DialogTitle>
				<DialogContent>
					<TextField
						multiline
						rows={10}
						fullWidth
						value={editedTranscript}
						onChange={(e) => setEditedTranscript(e.target.value)}
						placeholder="Edit your transcript here..."
						sx={{ mt: 1 }}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTranscriptDialog(false)}>Cancel</Button>
					<Button variant="contained" onClick={handleSubmitTranscript}>
						Submit Transcript
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default VoiceInput
