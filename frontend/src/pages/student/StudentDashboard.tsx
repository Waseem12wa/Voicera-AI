import { Box, Button, Paper, Stack, Tab, Tabs, Typography, Card, CardContent, Chip, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, LinearProgress } from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { enqueueSnackbar } from 'notistack'
import { logout } from '../../features/auth/authSlice'
import { 
	QuestionAnswer as QAIcon,
	Quiz as QuizIcon,
	Book as BookIcon,
	Note as NoteIcon,
	TrendingUp as ProgressIcon,
	Mic as MicIcon,
	Send as SendIcon,
	PlayArrow as PlayIcon,
	Pause as PauseIcon,
	Notifications as NotificationsIcon,
	Assignment as AssignmentIcon,
	Language as LanguageIcon,
	Translate as TranslateIcon
} from '@mui/icons-material'
import { 
	getStudentCourses,
	getStudentQuizzes,
	getAssignedQuizzes,
	submitQuizAnswer,
	getStudentProgress,
	saveStudentNote,
	getStudentNotes,
	askAIQuestion,
	getStudentInteractions,
	getStudentNotifications,
	markNotificationAsRead,
	connectToStudentRoom
} from '../../services/studentService'
import VoiceRecorder from '../../components/voice/VoiceRecorder'

const StudentDashboard = () => {
	const [tab, setTab] = useState(0)
	const [selectedCourse, setSelectedCourse] = useState<any>(null)
	const [chatDialogOpen, setChatDialogOpen] = useState(false)
	const [quizDialogOpen, setQuizDialogOpen] = useState(false)
	const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
	const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
	const [selectedAnswers, setSelectedAnswers] = useState<{[key: string]: number}>({})
	const [newQuestion, setNewQuestion] = useState('')
	const [newNote, setNewNote] = useState('')
	const [noteTitle, setNoteTitle] = useState('')
	const [noteDialogOpen, setNoteDialogOpen] = useState(false)
	const [isRecording, setIsRecording] = useState(false)
	const [quizResults, setQuizResults] = useState<any>(null)
	const [showResults, setShowResults] = useState(false)
	const [voiceTranscript, setVoiceTranscript] = useState('')
	const [selectedLanguage, setSelectedLanguage] = useState('en')
	const [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
	
	const qc = useQueryClient()
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleLogout = () => {
		dispatch(logout())
		navigate('/login')
		enqueueSnackbar('Logged out successfully', { variant: 'success' })
	}

	// Queries
	const { data: courses } = useQuery({ 
		queryKey: ['student', 'courses'], 
		queryFn: getStudentCourses
	})
	
	const { data: quizzes } = useQuery({ 
		queryKey: ['student', 'assigned-quizzes'], 
		queryFn: getAssignedQuizzes
	})
	
	const { data: progress } = useQuery({ 
		queryKey: ['student', 'progress'], 
		queryFn: getStudentProgress
	})
	
	const { data: notes } = useQuery({ 
		queryKey: ['student', 'notes'], 
		queryFn: getStudentNotes
	})
	
	const { data: interactions } = useQuery({ 
		queryKey: ['student', 'interactions'], 
		queryFn: getStudentInteractions
	})
	
	const { data: notifications } = useQuery({ 
		queryKey: ['student', 'notifications'], 
		queryFn: getStudentNotifications
	})

	// Mutations
	const askQuestionMutation = useMutation({
		mutationFn: ({ question, courseId }: { question: string; courseId?: string }) => 
			askAIQuestion(question, courseId),
		onSuccess: async () => {
			enqueueSnackbar('Question submitted successfully', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['student', 'interactions'] })
			setNewQuestion('')
		},
		onError: () => enqueueSnackbar('Failed to submit question', { variant: 'error' }),
	})

	const submitQuizMutation = useMutation({
		mutationFn: ({ quizId, answers }: { quizId: string; answers: {[key: string]: number} }) => 
			submitQuizAnswer(quizId, Object.entries(answers).map(([questionId, answerIndex]) => ({ questionId, answerIndex }))),
		onSuccess: async (data) => {
			enqueueSnackbar(`Quiz submitted! Score: ${data.score}%`, { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['student', 'assigned-quizzes'] })
			await qc.invalidateQueries({ queryKey: ['student', 'progress'] })
			
			// Show quiz results
			setQuizResults(data)
			setShowResults(true)
		},
		onError: () => enqueueSnackbar('Failed to submit quiz', { variant: 'error' }),
	})

	const saveNoteMutation = useMutation({
		mutationFn: ({ title, content, courseId }: { title: string; content: string; courseId?: string }) => 
			saveStudentNote(title, content, courseId),
		onSuccess: async () => {
			enqueueSnackbar('Note saved successfully', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['student', 'notes'] })
			setNoteDialogOpen(false)
			setNoteTitle('')
			setNewNote('')
		},
		onError: () => enqueueSnackbar('Failed to save note', { variant: 'error' }),
	})

	const handleAskQuestion = () => {
		if (newQuestion.trim()) {
			askQuestionMutation.mutate({ 
				question: newQuestion, 
				courseId: selectedCourse?._id 
			})
		}
	}

	const handleStartQuiz = (quiz: any) => {
		setSelectedQuiz(quiz)
		setCurrentQuestionIndex(0)
		setSelectedAnswers({})
		setQuizDialogOpen(true)
	}

	const handleAnswerSelect = (questionId: string, answerIndex: number) => {
		setSelectedAnswers(prev => ({
			...prev,
			[questionId]: answerIndex
		}))
	}

	const handleSubmitQuiz = () => {
		if (selectedQuiz) {
			submitQuizMutation.mutate({
				quizId: selectedQuiz._id,
				answers: selectedAnswers
			})
		}
	}

	const handleSaveNote = () => {
		if (noteTitle.trim() && newNote.trim()) {
			saveNoteMutation.mutate({
				title: noteTitle,
				content: newNote,
				courseId: selectedCourse?._id
			})
		}
	}

	const toggleRecording = () => {
		setIsRecording(!isRecording)
		// Voice recording functionality would be implemented here
	}

	const handleVoiceTranscript = (transcript: string, language: string) => {
		setVoiceTranscript(transcript)
		setSelectedLanguage(language)
		setNewQuestion(transcript)
		enqueueSnackbar(`Voice command received in ${language}`, { variant: 'success' })
	}

	const handleVoiceError = (error: string) => {
		enqueueSnackbar(`Voice error: ${error}`, { variant: 'error' })
	}

	const openVoiceDialog = () => {
		setVoiceDialogOpen(true)
	}

	return (
		<Box sx={{ 
			my: 2, 
			maxWidth: '1200px', 
			mx: 'auto', 
			px: 2,
			display: 'flex',
			flexDirection: 'column',
			alignItems: 'center'
		}}>
			{/* Logout Button - Top Right */}
			<Box sx={{ position: 'fixed', top: 20, right: 20, zIndex: 1000 }}>
				<Button 
					onClick={handleLogout}
					variant="contained"
					color="error"
					sx={{ 
						borderRadius: '50px',
						fontWeight: 'bold',
						px: 3,
						py: 1,
						boxShadow: 3
					}}
				>
					🚪 Logout
				</Button>
			</Box>
			
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
				Student Dashboard
			</Typography>
			
			<Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
				<Tab label="My Courses" />
				<Tab label="Learning Materials" />
				<Tab label="AI Assistant" />
				<Tab label="Quizzes" />
				<Tab label="Notifications" />
				<Tab label="My Notes" />
				<Tab label="Progress" />
			</Tabs>

			{/* My Courses Tab */}
			{tab === 0 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📚 My Enrolled Courses
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Access your course materials, documents, and resources uploaded by teachers.
						</Typography>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
						{(courses || []).map((course: any) => (
							<Card key={course._id} sx={{ height: '100%' }}>
								<CardContent>
									<Stack spacing={2}>
										<Box>
											<Typography variant="h6" gutterBottom>
												{course.name}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{course.description || 'Course description not available'}
											</Typography>
										</Box>
										
										<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
											<Chip 
												label={`${course.documents?.length || 0} Documents`} 
												size="small" 
												color="primary" 
											/>
											<Chip 
												label={`${course.quizzes?.length || 0} Quizzes`} 
												size="small" 
												variant="outlined"
											/>
										</Stack>

										<Stack direction="row" spacing={1}>
											<Button 
												variant="outlined" 
												size="small"
												onClick={() => setSelectedCourse(course)}
												sx={{ 
													borderRadius: '50px',
													fontWeight: 'bold',
													px: 2,
													py: 0.5
												}}
											>
												View Materials
											</Button>
											<Button 
												variant="contained" 
												size="small"
												onClick={() => {
													setSelectedCourse(course)
													setChatDialogOpen(true)
												}}
												sx={{ 
													borderRadius: '50px',
													fontWeight: 'bold',
													px: 2,
													py: 0.5
												}}
											>
												Ask AI
											</Button>
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>

					{(!courses || courses.length === 0) && (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<BookIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Courses Enrolled
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Contact your teacher to get enrolled in courses.
							</Typography>
						</Paper>
					)}
				</Box>
			)}

			{/* Learning Materials Tab */}
			{tab === 1 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📚 Learning Materials
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Access all documents, audio files, and educational content uploaded by your teachers.
						</Typography>
					</Paper>

					<Box sx={{ display: 'flex', justifyContent: 'center', mb: 3, gap: 2 }}>
						<Button
							variant="contained"
							size="large"
							onClick={() => navigate('/student/files')}
							sx={{
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 4,
								py: 2,
							background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
							'&:hover': {
								background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
							}
							}}
						>
							📖 Browse All Learning Materials
						</Button>
						<Button
							variant="outlined"
							size="large"
							onClick={() => navigate('/student/multilingual')}
							startIcon={<LanguageIcon />}
							sx={{
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 4,
								py: 2,
								borderColor: 'primary.main',
								color: 'primary.main',
								'&:hover': {
									backgroundColor: 'primary.50',
									borderColor: 'primary.dark'
								}
							}}
						>
							🌍 Multilingual Access
						</Button>
					</Box>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
						<Card sx={{ background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)', color: 'white' }}>
							<CardContent>
								<Stack spacing={2}>
									<Typography variant="h6">
										📄 Documents & PDFs
									</Typography>
									<Typography variant="body2" sx={{ opacity: 0.9 }}>
										Access lecture notes, assignments, and study materials uploaded by teachers.
									</Typography>
									<Button
										variant="outlined"
										sx={{ 
											borderColor: 'rgba(255,255,255,0.5)',
											color: 'white',
											'&:hover': {
												borderColor: 'white',
												backgroundColor: 'rgba(255,255,255,0.1)'
											}
										}}
										onClick={() => navigate('/student/files?section=lectures')}
									>
										View Documents
									</Button>
								</Stack>
							</CardContent>
						</Card>

						<Card sx={{ background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)', color: 'white' }}>
							<CardContent>
								<Stack spacing={2}>
									<Typography variant="h6">
										🎵 Audio & Voice Content
									</Typography>
									<Typography variant="body2" sx={{ opacity: 0.9 }}>
										Listen to recorded lectures, voice notes, and audio explanations.
									</Typography>
									<Button
										variant="outlined"
										sx={{ 
											borderColor: 'rgba(255,255,255,0.5)',
											color: 'white',
											'&:hover': {
												borderColor: 'white',
												backgroundColor: 'rgba(255,255,255,0.1)'
											}
										}}
										onClick={() => navigate('/student/files?section=audio')}
									>
										View Audio Files
									</Button>
								</Stack>
							</CardContent>
						</Card>

						<Card sx={{ background: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)', color: 'white' }}>
							<CardContent>
								<Stack spacing={2}>
									<Typography variant="h6">
										📝 Assignments & Quizzes
									</Typography>
									<Typography variant="body2" sx={{ opacity: 0.9 }}>
										Find assignments, practice quizzes, and assessment materials.
									</Typography>
									<Button
										variant="outlined"
										sx={{ 
											borderColor: 'rgba(255,255,255,0.5)',
											color: 'white',
											'&:hover': {
												borderColor: 'white',
												backgroundColor: 'rgba(255,255,255,0.1)'
											}
										}}
										onClick={() => navigate('/student/files?section=assignments')}
									>
										View Assignments
									</Button>
								</Stack>
							</CardContent>
						</Card>
					</Box>
				</Box>
			)}

			{/* AI Assistant Tab */}
			{tab === 2 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="h6" gutterBottom>
									🤖 AI Learning Assistant
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Ask questions about your courses and get AI-powered answers with sources. Use voice commands in your preferred language.
								</Typography>
							</Box>
							<Button 
								variant="contained"
								onClick={openVoiceDialog}
								startIcon={<MicIcon />}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									px: 3,
									py: 1,
									background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
									'&:hover': {
										background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
									}
								}}
							>
								Voice Command
							</Button>
						</Stack>
					</Paper>

					{/* Voice Command Section */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
							<LanguageIcon color="primary" />
							<Typography variant="h6" color="primary">
								Multilingual Voice Commands
							</Typography>
						</Stack>
						<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
							Speak naturally in your preferred language. Voicera AI supports 20+ languages including English, Spanish, French, German, Italian, Portuguese, Russian, Japanese, Korean, Chinese, Arabic, Hindi, Urdu, Bengali, Turkish, Dutch, Swedish, Norwegian, Danish, and Finnish.
						</Typography>
						
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 1, mb: 2 }}>
							{['🇺🇸 English', '🇪🇸 Español', '🇫🇷 Français', '🇩🇪 Deutsch', '🇮🇹 Italiano', '🇵🇹 Português', '🇷🇺 Русский', '🇯🇵 日本語', '🇰🇷 한국어', '🇨🇳 中文', '🇸🇦 العربية', '🇮🇳 हिन्दी', '🇵🇰 اردو', '🇧🇩 বাংলা', '🇹🇷 Türkçe'].map((lang) => (
								<Chip 
									key={lang}
									label={lang}
									size="small"
									variant="outlined"
									color="primary"
								/>
							))}
						</Box>

						<Button 
							variant="outlined"
							onClick={openVoiceDialog}
							startIcon={<MicIcon />}
							sx={{ borderRadius: '50px' }}
						>
							Start Voice Command
						</Button>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
						{(interactions || []).map((interaction: any) => (
							<Card key={interaction._id}>
								<CardContent>
									<Stack spacing={2}>
										<Typography variant="subtitle2" color="primary">
											Question: {interaction.question}
										</Typography>
										<Typography variant="body2">
											{interaction.aiResponse?.content || 'Answer pending...'}
										</Typography>
										{interaction.aiResponse?.sources && (
											<Box>
												<Typography variant="caption" color="text.secondary">
													Sources: {interaction.aiResponse.sources.join(', ')}
												</Typography>
											</Box>
										)}
										<Stack direction="row" spacing={1}>
											<Chip 
												label={interaction.status} 
												size="small" 
												color={interaction.status === 'answered' ? 'success' : 'default'}
											/>
											<Chip 
												label={interaction.courseId ? 'Course-specific' : 'General'} 
												size="small" 
												variant="outlined"
											/>
											{interaction.language && (
												<Chip 
													icon={<LanguageIcon />}
													label={interaction.language.toUpperCase()} 
													size="small" 
													color="primary"
													variant="outlined"
												/>
											)}
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>
				</Box>
			)}

			{/* Quizzes Tab */}
			{tab === 3 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📝 Assigned Quizzes
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Quizzes assigned to you by your teachers. Complete them to track your progress.
						</Typography>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
						{(quizzes || []).map((quiz: any) => (
							<Card key={quiz._id} sx={{ 
								height: '100%',
								border: quiz.status === 'completed' ? '2px solid' : '1px solid',
								borderColor: quiz.status === 'completed' ? 'success.main' : 'divider'
							}}>
								<CardContent>
									<Stack spacing={2}>
										<Box>
											<Typography variant="h6" gutterBottom>
												{quiz.title}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{quiz.description}
											</Typography>
										</Box>
										
										{/* Assignment Info */}
										<Box sx={{ bgcolor: 'primary.50', p: 2, borderRadius: 1 }}>
											<Typography variant="subtitle2" gutterBottom>
												📋 Assignment Details:
											</Typography>
											<Typography variant="body2" gutterBottom>
												<strong>Assigned:</strong> {new Date(quiz.assignedAt).toLocaleDateString()}
											</Typography>
											{quiz.dueDate && (
												<Typography variant="body2" gutterBottom>
													<strong>Due:</strong> {new Date(quiz.dueDate).toLocaleDateString()}
												</Typography>
											)}
											<Typography variant="body2">
												<strong>Attempts:</strong> {quiz.totalAttempts}/{quiz.settings?.maxAttempts || 'Unlimited'}
											</Typography>
											{quiz.bestScore && (
												<Typography variant="body2">
													<strong>Best Score:</strong> {quiz.bestScore}%
												</Typography>
											)}
										</Box>
										
										<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
											<Chip 
												label={`${quiz.questions?.length || 0} questions`} 
												size="small" 
												color="primary" 
											/>
											<Chip 
												label={quiz.difficulty || 'medium'} 
												size="small" 
												variant="outlined"
											/>
											<Chip 
												label={quiz.isAIGenerated ? 'AI Generated' : 'Manual'} 
												size="small" 
												color={quiz.isAIGenerated ? 'success' : 'default'}
											/>
											<Chip 
												label={quiz.status || 'assigned'} 
												size="small" 
												color={quiz.status === 'completed' ? 'success' : 
													   quiz.status === 'in_progress' ? 'warning' : 'default'}
											/>
										</Stack>

										{quiz.sourceFile && (
											<Typography variant="caption" color="text.secondary">
												📄 Source: {quiz.sourceFile.originalName}
											</Typography>
										)}

										<Button 
											variant="contained" 
											fullWidth
											onClick={() => handleStartQuiz(quiz)}
											disabled={quiz.status === 'completed' && quiz.settings?.maxAttempts && quiz.totalAttempts >= quiz.settings.maxAttempts}
											sx={{ 
												borderRadius: '50px',
												fontWeight: 'bold',
												px: 3,
												py: 1
											}}
										>
											{quiz.status === 'completed' ? 'Completed' : 
											 quiz.status === 'in_progress' ? 'Continue Quiz' : 'Start Quiz'}
										</Button>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>

					{(!quizzes || quizzes.length === 0) && (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Assigned Quizzes
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								You haven't been assigned any quizzes yet. Your teachers will assign quizzes to you, and you'll receive notifications when they do.
							</Typography>
							<Typography variant="body2" color="text.secondary">
								Check the Notifications tab for any quiz assignments.
							</Typography>
						</Paper>
					)}
				</Box>
			)}

			{/* Notifications Tab */}
			{tab === 4 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							🔔 Notifications
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Stay updated with quiz assignments and important announcements from your teachers.
						</Typography>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 2 }}>
						{(notifications || []).map((notification: any) => (
							<Card key={notification._id} sx={{ 
								height: '100%',
								border: notification.read ? '1px solid #e0e0e0' : '2px solid',
								borderColor: notification.read ? '#e0e0e0' : 'primary.main',
								bgcolor: notification.read ? 'background.paper' : 'primary.50'
							}}>
								<CardContent>
									<Stack spacing={2}>
										<Stack direction="row" alignItems="center" spacing={2}>
											<Avatar sx={{ 
												bgcolor: notification.type === 'quiz_assignment' ? 'success.main' : 'primary.main',
												width: 40,
												height: 40
											}}>
												{notification.type === 'quiz_assignment' ? <AssignmentIcon /> : <NotificationsIcon />}
											</Avatar>
											<Box sx={{ flex: 1 }}>
												<Typography variant="h6" gutterBottom>
													{notification.title}
												</Typography>
												<Typography variant="body2" color="text.secondary">
													{new Date(notification.createdAt).toLocaleString()}
												</Typography>
											</Box>
											{!notification.read && (
												<Chip 
													label="New" 
													size="small" 
													color="primary" 
													variant="filled"
												/>
											)}
										</Stack>
										
										<Typography variant="body2">
											{notification.message}
										</Typography>
										
										{notification.type === 'quiz_assignment' && notification.quiz && (
											<Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
												<Typography variant="subtitle2" gutterBottom>
													📝 Quiz Details:
												</Typography>
												<Typography variant="body2" gutterBottom>
													<strong>Title:</strong> {notification.quiz.title}
												</Typography>
												<Typography variant="body2" gutterBottom>
													<strong>Questions:</strong> {notification.quiz.questions?.length || 0}
												</Typography>
												<Typography variant="body2">
													<strong>Description:</strong> {notification.quiz.description}
												</Typography>
											</Box>
										)}
										
										<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
											<Chip 
												label={notification.type === 'quiz_assignment' ? 'Quiz Assignment' : 'General'} 
												size="small" 
												color={notification.type === 'quiz_assignment' ? 'success' : 'primary'} 
											/>
											<Chip 
												label={notification.read ? 'Read' : 'Unread'} 
												size="small" 
												variant="outlined"
												color={notification.read ? 'default' : 'primary'}
											/>
										</Stack>
										
										{!notification.read && (
											<Button 
												variant="outlined" 
												size="small"
												onClick={() => {
													markNotificationAsRead(notification._id)
													enqueueSnackbar('Notification marked as read', { variant: 'success' })
												}}
												sx={{ 
													borderRadius: '50px',
													fontWeight: 'bold',
													px: 2,
													py: 0.5,
													alignSelf: 'flex-start'
												}}
											>
												Mark as Read
											</Button>
										)}
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>

					{(!notifications || notifications.length === 0) && (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Notifications
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								You'll receive notifications here when teachers assign quizzes or send important announcements.
							</Typography>
						</Paper>
					)}
				</Box>
			)}

			{/* My Notes Tab */}
			{tab === 5 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Box>
								<Typography variant="h6" gutterBottom>
									📝 My Notes
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Save and organize your learning notes.
								</Typography>
							</Box>
							<Button 
								variant="contained"
								onClick={() => setNoteDialogOpen(true)}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									px: 3,
									py: 1
								}}
							>
								Add Note
							</Button>
						</Stack>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
						{(notes || []).map((note: any) => (
							<Card key={note._id}>
								<CardContent>
									<Stack spacing={2}>
										<Typography variant="h6" gutterBottom>
											{note.title}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{note.content.substring(0, 150)}...
										</Typography>
										<Typography variant="caption" color="text.secondary">
											{new Date(note.createdAt).toLocaleDateString()}
										</Typography>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>
				</Box>
			)}

			{/* Progress Tab */}
			{tab === 6 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📊 Learning Progress
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Track your learning journey and achievements.
						</Typography>
					</Paper>

					{progress && (
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{progress.quizzesCompleted || 0}
									</Typography>
									<Typography variant="body2">Quizzes Completed</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{progress.averageScore || 0}%
									</Typography>
									<Typography variant="body2">Average Score</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{progress.notesSaved || 0}
									</Typography>
									<Typography variant="body2">Notes Saved</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{progress.questionsAsked || 0}
									</Typography>
									<Typography variant="body2">Questions Asked</Typography>
								</CardContent>
							</Card>
						</Box>
					)}
				</Box>
			)}

			{/* AI Chat Dialog */}
			<Dialog open={chatDialogOpen} onClose={() => setChatDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					🤖 AI Learning Assistant
					{selectedCourse && (
						<Typography variant="subtitle2" color="text.secondary">
							Course: {selectedCourse.name}
						</Typography>
					)}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							label="Ask a question"
							multiline
							rows={3}
							fullWidth
							value={newQuestion}
							onChange={(e) => setNewQuestion(e.target.value)}
							placeholder="Ask about your course materials, concepts, or any learning topic..."
						/>
						<Stack direction="row" spacing={1} alignItems="center">
							<IconButton 
								onClick={toggleRecording}
								color={isRecording ? 'error' : 'default'}
							>
								{isRecording ? <PauseIcon /> : <MicIcon />}
							</IconButton>
							<Typography variant="caption" color="text.secondary">
								{isRecording ? 'Recording... Click to stop' : 'Click to record voice question'}
							</Typography>
						</Stack>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setChatDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleAskQuestion}
						variant="contained"
						disabled={askQuestionMutation.isPending || !newQuestion.trim()}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{askQuestionMutation.isPending ? 'Sending...' : 'Ask Question'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Quiz Dialog */}
			<Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					{selectedQuiz?.title || 'Quiz'}
					<Typography variant="subtitle2" color="text.secondary">
						Question {currentQuestionIndex + 1} of {selectedQuiz?.questions?.length || 0}
					</Typography>
				</DialogTitle>
				<DialogContent>
					{selectedQuiz && selectedQuiz.questions && selectedQuiz.questions[currentQuestionIndex] && (
						<Stack spacing={3}>
							<Typography variant="h6">
								{selectedQuiz.questions[currentQuestionIndex].question}
							</Typography>
							
							<Stack spacing={1}>
								{selectedQuiz.questions[currentQuestionIndex].options.map((option: string, index: number) => (
									<Button
										key={index}
										variant={selectedAnswers[selectedQuiz.questions[currentQuestionIndex]._id] === index ? 'contained' : 'outlined'}
										onClick={() => handleAnswerSelect(selectedQuiz.questions[currentQuestionIndex]._id, index)}
										sx={{ 
											justifyContent: 'flex-start',
											textAlign: 'left',
											p: 2
										}}
									>
										{String.fromCharCode(65 + index)}. {option}
									</Button>
								))}
							</Stack>
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
						disabled={currentQuestionIndex === 0}
					>
						Previous
					</Button>
					<Button 
						onClick={() => setCurrentQuestionIndex(Math.min((selectedQuiz?.questions?.length || 1) - 1, currentQuestionIndex + 1))}
						disabled={currentQuestionIndex === (selectedQuiz?.questions?.length || 1) - 1}
					>
						Next
					</Button>
					<Button 
						onClick={handleSubmitQuiz}
						variant="contained"
						disabled={submitQuizMutation.isPending}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{submitQuizMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Quiz Results Dialog */}
			<Dialog open={showResults} onClose={() => setShowResults(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					<Typography variant="h5" gutterBottom>
						🎯 Quiz Results
					</Typography>
					<Typography variant="subtitle2" color="text.secondary">
						{selectedQuiz?.title || 'Quiz'}
					</Typography>
				</DialogTitle>
				<DialogContent>
					{quizResults && (
						<Stack spacing={3}>
							{/* Score Summary */}
							<Paper sx={{ p: 3, textAlign: 'center', bgcolor: quizResults.status === 'passed' ? 'success.50' : 'error.50' }}>
								<Typography variant="h2" color={quizResults.status === 'passed' ? 'success.main' : 'error.main'} gutterBottom>
									{quizResults.score}%
								</Typography>
								<Typography variant="h6" gutterBottom>
									{quizResults.status === 'passed' ? '🎉 Congratulations! You Passed!' : '📚 Keep Learning!'}
								</Typography>
								<Typography variant="body1">
									{quizResults.correctAnswers} out of {quizResults.totalQuestions} questions correct
								</Typography>
							</Paper>

							{/* Overall Feedback */}
							<Paper sx={{ p: 2 }}>
								<Typography variant="h6" gutterBottom>
									📝 Overall Feedback
								</Typography>
								<Typography variant="body1">
									{quizResults.feedback}
								</Typography>
							</Paper>

							{/* Suggestions */}
							{quizResults.suggestions && (
								<Paper sx={{ p: 2 }}>
									<Typography variant="h6" gutterBottom>
										💡 Suggestions
									</Typography>
									<Typography variant="body1">
										{quizResults.suggestions}
									</Typography>
								</Paper>
							)}

							{/* Question-by-Question Results */}
							<Paper sx={{ p: 2 }}>
								<Typography variant="h6" gutterBottom>
									📋 Question Details
								</Typography>
								<Stack spacing={2}>
									{quizResults.details?.map((detail: any, index: number) => (
										<Box key={index} sx={{ 
											p: 2, 
											border: '1px solid', 
											borderColor: detail.isCorrect ? 'success.main' : 'error.main',
											borderRadius: 1,
											bgcolor: detail.isCorrect ? 'success.50' : 'error.50'
										}}>
											<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
												<Typography variant="subtitle1" sx={{ flex: 1 }}>
													Question {index + 1}
												</Typography>
												<Chip 
													label={detail.isCorrect ? 'Correct' : 'Incorrect'} 
													color={detail.isCorrect ? 'success' : 'error'}
													size="small"
												/>
											</Stack>
											<Typography variant="body2" gutterBottom>
												{detail.question}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												Your Answer: Option {String.fromCharCode(65 + detail.studentAnswer)} | 
												Correct Answer: Option {String.fromCharCode(65 + detail.correctAnswer)}
											</Typography>
											<Typography variant="body2">
												<strong>Feedback:</strong> {detail.feedback}
											</Typography>
										</Box>
									))}
								</Stack>
							</Paper>
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => {
							setShowResults(false)
							setQuizDialogOpen(false)
							setSelectedQuiz(null)
							setCurrentQuestionIndex(0)
							setSelectedAnswers({})
							setQuizResults(null)
						}}
						variant="contained"
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Add Note Dialog */}
			<Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Add New Note</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							label="Note Title"
							fullWidth
							value={noteTitle}
							onChange={(e) => setNoteTitle(e.target.value)}
							placeholder="Enter a title for your note..."
						/>
						<TextField
							label="Note Content"
							multiline
							rows={6}
							fullWidth
							value={newNote}
							onChange={(e) => setNewNote(e.target.value)}
							placeholder="Write your notes here..."
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleSaveNote}
						variant="contained"
						disabled={saveNoteMutation.isPending || !noteTitle.trim() || !newNote.trim()}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{saveNoteMutation.isPending ? 'Saving...' : 'Save Note'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Voice Command Dialog */}
			<Dialog open={voiceDialogOpen} onClose={() => setVoiceDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					<Stack direction="row" spacing={2} alignItems="center">
						<MicIcon color="primary" />
						<Typography variant="h6">
							Multilingual Voice Commands
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							Speak naturally in your preferred language. Voicera AI will understand and respond appropriately.
						</Typography>
						
						<VoiceRecorder
							onTranscript={handleVoiceTranscript}
							onError={handleVoiceError}
							supportedLanguages={['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'ur', 'bn', 'tr', 'nl', 'sv', 'no', 'da', 'fi']}
							defaultLanguage={selectedLanguage}
							showLanguageSelector={true}
							showPlayback={true}
							maxRecordingTime={60}
						/>

						{voiceTranscript && (
							<Box>
								<Typography variant="subtitle2" gutterBottom>
									Voice Command Received:
								</Typography>
								<Typography 
									variant="body2" 
									sx={{ 
										p: 2, 
										bgcolor: 'primary.50', 
										borderRadius: 1,
										border: '1px solid',
										borderColor: 'primary.200'
									}}
								>
									{voiceTranscript}
								</Typography>
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setVoiceDialogOpen(false)}>Close</Button>
					{voiceTranscript && (
						<Button 
							onClick={() => {
								handleAskQuestion()
								setVoiceDialogOpen(false)
							}}
							variant="contained"
							disabled={askQuestionMutation.isPending}
							sx={{ 
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 3,
								py: 1
							}}
						>
							{askQuestionMutation.isPending ? 'Processing...' : 'Ask Question'}
						</Button>
					)}
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default StudentDashboard
