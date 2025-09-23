import { Box, Button, Paper, Stack, Tab, Tabs, Typography, List, ListItem, ListItemText, Chip, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Checkbox, FormControlLabel, Avatar, Badge } from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { enqueueSnackbar } from 'notistack'
import { logout } from '../../features/auth/authSlice'
import { 
	uploadFiles, 
	getFilesBySection, 
	getStudentInteractions, 
	generateAIResponse, 
	approveAIResponse,
	generateQuizFromFile,
	getQuizzes,
	getEnhancedAnalytics,
	getRegisteredStudents,
	getActiveStudents,
	assignQuizToMultipleStudents,
	getAssignedQuizzes,
	processVoiceContent,
	uploadAudioFile
} from '../../services/teacherServiceEnhanced'
import { 
	Upload as UploadIcon,
	Quiz as QuizIcon,
	QuestionAnswer as QAIcon,
	CheckCircle as CheckIcon,
	People as PeopleIcon,
	Assignment as AssignmentIcon,
	Send as SendIcon,
	Person as PersonIcon,
	Circle as OnlineIcon,
	Mic as MicIcon,
	VolumeUp as VolumeIcon,
	Description as DocumentIcon
} from '@mui/icons-material'
import VoiceInput from '../../components/voice/VoiceInput'

const EnhancedTeacherDashboard = () => {
	const [tab, setTab] = useState(0)
	const [selectedSection, setSelectedSection] = useState('all')
	const [selectedFile, setSelectedFile] = useState<any>(null)
	const [quizDialogOpen, setQuizDialogOpen] = useState(false)
	const [questionDialogOpen, setQuestionDialogOpen] = useState(false)
	const [newQuestion, setNewQuestion] = useState('')
	const [newContext, setNewContext] = useState('')
	const [viewQuestionsDialogOpen, setViewQuestionsDialogOpen] = useState(false)
	const [selectedQuiz, setSelectedQuiz] = useState<any>(null)
	const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false)
	const [selectedStudents, setSelectedStudents] = useState<string[]>([])
	const [quizToAssign, setQuizToAssign] = useState<any>(null)
	const [voiceDialogOpen, setVoiceDialogOpen] = useState(false)
	const [voiceContent, setVoiceContent] = useState('')
	const [voiceProcessing, setVoiceProcessing] = useState(false)
	
	const qc = useQueryClient()
	const dispatch = useDispatch()
	const navigate = useNavigate()

	const handleLogout = () => {
		dispatch(logout())
		navigate('/login')
		enqueueSnackbar('Logged out successfully', { variant: 'success' })
	}

	// Queries
	const { data: filesData, refetch: refetchFiles } = useQuery({ 
		queryKey: ['teacher', 'files', selectedSection], 
		queryFn: () => getFilesBySection(selectedSection === 'all' ? undefined : selectedSection)
	})
	
	const { data: interactions } = useQuery({ 
		queryKey: ['teacher', 'interactions'], 
		queryFn: () => getStudentInteractions()
	})
	
	const { data: analytics } = useQuery({ 
		queryKey: ['teacher', 'analytics'], 
		queryFn: getEnhancedAnalytics
	})
	
	const { data: quizzes } = useQuery({ 
		queryKey: ['teacher', 'quizzes'], 
		queryFn: getQuizzes
	})
	
	const { data: registeredStudents } = useQuery({ 
		queryKey: ['teacher', 'students', 'registered'], 
		queryFn: getRegisteredStudents
	})
	
	const { data: activeStudents } = useQuery({ 
		queryKey: ['teacher', 'students', 'active'], 
		queryFn: getActiveStudents
	})
	
	const { data: assignedQuizzes } = useQuery({ 
		queryKey: ['teacher', 'assigned-quizzes'], 
		queryFn: getAssignedQuizzes
	})

	// Mutations
	const uploadMutation = useMutation({
		mutationFn: uploadFiles,
		onSuccess: async () => {
			enqueueSnackbar('Files uploaded successfully', { variant: 'success' })
			await refetchFiles()
		},
		onError: () => enqueueSnackbar('Upload failed', { variant: 'error' }),
	})

	const generateResponseMutation = useMutation({
		mutationFn: ({ question, context }: { question: string; context: string }) => 
			generateAIResponse(question, context),
		onSuccess: async () => {
			enqueueSnackbar('AI response generated', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher', 'interactions'] })
			setQuestionDialogOpen(false)
			setNewQuestion('')
			setNewContext('')
		},
		onError: () => enqueueSnackbar('Failed to generate response', { variant: 'error' }),
	})

	const approveMutation = useMutation({
		mutationFn: approveAIResponse,
		onSuccess: async () => {
			enqueueSnackbar('Response approved', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher', 'interactions'] })
		},
	})

	const generateQuizMutation = useMutation({
		mutationFn: ({ fileId, topic }: { fileId: string; topic?: string }) => 
			generateQuizFromFile(fileId, topic),
		onSuccess: async () => {
			enqueueSnackbar('Quiz generated successfully', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher', 'quizzes'] })
			setQuizDialogOpen(false)
			setSelectedFile(null)
			setTab(2) // Switch to Generated Quizzes tab
		},
		onError: (error: any) => {
			console.error('Quiz generation error:', error)
			const errorMessage = error?.response?.data?.error || error?.message || 'Failed to generate quiz'
			const details = error?.response?.data?.details || ''
			enqueueSnackbar(`${errorMessage}${details ? `: ${details}` : ''}`, { 
				variant: 'error',
				autoHideDuration: 6000
			})
		},
	})

	const assignQuizMutation = useMutation({
		mutationFn: ({ quizId, studentIds }: { quizId: string; studentIds: string[] }) => 
			assignQuizToMultipleStudents(quizId, studentIds),
		onSuccess: async () => {
			enqueueSnackbar('Quiz assigned successfully! Students will receive notifications.', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher', 'assigned-quizzes'] })
			setAssignmentDialogOpen(false)
			setSelectedStudents([])
			setQuizToAssign(null)
		},
		onError: (error: any) => {
			console.error('Quiz assignment error:', error)
			const errorMessage = error?.response?.data?.error || error?.message || 'Failed to assign quiz'
			enqueueSnackbar(errorMessage, { variant: 'error' })
		},
	})

	const sections = [
		{ key: 'all', label: 'All Files', count: filesData?.files?.length || 0 },
		{ key: 'lectures', label: 'Lectures', count: filesData?.sections?.lectures?.length || 0 },
		{ key: 'assignments', label: 'Assignments', count: filesData?.sections?.assignments?.length || 0 },
		{ key: 'notes', label: 'Notes', count: filesData?.sections?.notes?.length || 0 },
		{ key: 'resources', label: 'Resources', count: filesData?.sections?.resources?.length || 0 },
		{ key: 'quizzes', label: 'Quizzes', count: filesData?.sections?.quizzes?.length || 0 },
	]

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length) {
			await uploadMutation.mutateAsync(files)
		}
	}

	const handleGenerateQuiz = () => {
		if (selectedFile) {
			generateQuizMutation.mutate({ fileId: selectedFile._id })
		}
	}

	const handleGenerateResponse = () => {
		if (newQuestion.trim()) {
			generateResponseMutation.mutate({ 
				question: newQuestion, 
				context: newContext 
			})
		}
	}

	const handleViewQuestions = (quiz: any) => {
		setSelectedQuiz(quiz)
		setViewQuestionsDialogOpen(true)
	}

	const handleAssignQuiz = (quiz: any) => {
		setQuizToAssign(quiz)
		setAssignmentDialogOpen(true)
	}

	const handleStudentSelection = (studentId: string) => {
		setSelectedStudents(prev => 
			prev.includes(studentId) 
				? prev.filter(id => id !== studentId)
				: [...prev, studentId]
		)
	}

	const handleAssignToStudents = () => {
		if (quizToAssign && selectedStudents.length > 0) {
			assignQuizMutation.mutate({
				quizId: quizToAssign._id,
				studentIds: selectedStudents
			})
		}
	}

	const handleVoiceTranscript = async (transcript: string, audioBlob?: Blob) => {
		setVoiceContent(transcript)
		setVoiceProcessing(true)
		
		try {
			// Process voice content with backend API
			const response = await processVoiceContent(transcript, audioBlob)
			
			if (response.success) {
				// Create a virtual file object for voice content
				const voiceFile = {
					_id: response.file._id,
					title: response.file.title,
					originalName: response.file.originalName,
					content: transcript,
					aiAnalysis: response.analysis,
					section: 'voice',
					type: 'voice',
					transcript: transcript,
					isVoiceContent: true
				}
				
				enqueueSnackbar('Voice content processed successfully!', { variant: 'success' })
				
				// Refresh files list
				await qc.invalidateQueries({ queryKey: ['teacher', 'files'] })
				
				// Generate quiz from voice content
				setSelectedFile(voiceFile)
				setQuizDialogOpen(true)
			} else {
				throw new Error('Failed to process voice content')
			}
			
		} catch (error) {
			console.error('Voice processing error:', error)
			enqueueSnackbar('Failed to process voice content', { variant: 'error' })
		} finally {
			setVoiceProcessing(false)
		}
	}

	const handleAudioUpload = async (audioFile: File) => {
		setVoiceProcessing(true)
		
		try {
			enqueueSnackbar('Audio file uploaded successfully! Processing...', { variant: 'info' })
			
			// Upload audio file to backend for processing
			const response = await uploadAudioFile(audioFile)
			
			if (response.uploaded > 0) {
				enqueueSnackbar('Audio file processed successfully!', { variant: 'success' })
				
				// Refresh files list to show the new audio file
				await qc.invalidateQueries({ queryKey: ['teacher', 'files'] })
				
				// Wait a moment for the file to be processed
				setTimeout(async () => {
					try {
						// Get the processed file
						const filesResponse = await getFilesBySection('audio')
						const audioFileObj = filesResponse.files.find((f: any) => f.originalName === audioFile.name)
						
						if (audioFileObj) {
							// Generate quiz from audio content
							setSelectedFile(audioFileObj)
							setQuizDialogOpen(true)
						}
					} catch (error) {
						console.error('Error getting processed audio file:', error)
					}
				}, 3000)
			} else {
				throw new Error('Failed to upload audio file')
			}
			
		} catch (error) {
			console.error('Audio processing error:', error)
			enqueueSnackbar('Failed to process audio file', { variant: 'error' })
		} finally {
			setVoiceProcessing(false)
		}
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
				Enhanced Teacher Dashboard
			</Typography>
			
			<Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
				<Tab label="Files & Content" />
				<Tab label="AI Interactions" />
				<Tab label="Generated Quizzes" />
				<Tab label="Student Management" />
				<Tab label="Analytics" />
			</Tabs>

			{/* Files & Content Tab */}
			{tab === 0 && (
				<Box sx={{ width: '100%' }}>
					{/* Section Navigation */}
					<Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap' }}>
						{sections.map((section) => (
							<Chip
								key={section.key}
								label={`${section.label} (${section.count})`}
								variant={selectedSection === section.key ? 'filled' : 'outlined'}
								onClick={() => setSelectedSection(section.key)}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									mb: 1
								}}
							/>
						))}
					</Stack>

					{/* Content Input Options */}
					<Paper sx={{ p: 3, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📚 Add Content for AI Analysis
						</Typography>
						<Typography variant="body2" color="text.secondary" gutterBottom>
							Choose how you want to add content. All options support AI-powered quiz generation.
						</Typography>
						
						<Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mt: 2 }}>
							{/* Option 1: Upload Files */}
							<Paper sx={{ p: 2, flex: 1, border: '2px solid', borderColor: 'primary.main' }}>
								<Stack alignItems="center" spacing={2}>
									<DocumentIcon sx={{ fontSize: 40, color: 'primary.main' }} />
									<Typography variant="h6" align="center">
										📄 Upload Files
									</Typography>
									<Typography variant="body2" color="text.secondary" align="center">
										Upload documents (PDF, PPT, DOC, TXT) for AI analysis
									</Typography>
									<Button
										variant="contained"
										startIcon={<UploadIcon />}
										component="label"
										sx={{ 
											borderRadius: '50px',
											fontWeight: 'bold',
											px: 3,
											py: 1
										}}
									>
										Choose Files
										<input hidden multiple type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={handleFileUpload} />
									</Button>
								</Stack>
							</Paper>

							{/* Option 2: Voice Recording */}
							<Paper sx={{ p: 2, flex: 1, border: '2px solid', borderColor: 'success.main' }}>
								<Stack alignItems="center" spacing={2}>
									<MicIcon sx={{ fontSize: 40, color: 'success.main' }} />
									<Typography variant="h6" align="center">
										🎤 Speak Voice
									</Typography>
									<Typography variant="body2" color="text.secondary" align="center">
										Record your voice directly in the browser
									</Typography>
									<Button
										variant="contained"
										startIcon={<MicIcon />}
										onClick={() => setVoiceDialogOpen(true)}
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
								</Stack>
							</Paper>

							{/* Option 3: Upload Audio */}
							<Paper sx={{ p: 2, flex: 1, border: '2px solid', borderColor: 'warning.main' }}>
								<Stack alignItems="center" spacing={2}>
									<VolumeIcon sx={{ fontSize: 40, color: 'warning.main' }} />
									<Typography variant="h6" align="center">
										🎵 Upload Audio
									</Typography>
									<Typography variant="body2" color="text.secondary" align="center">
										Upload audio files (MP3, WAV, M4A) up to 100MB
									</Typography>
									<Button
										variant="contained"
										startIcon={<VolumeIcon />}
										component="label"
										sx={{ 
											borderRadius: '50px',
											fontWeight: 'bold',
											px: 3,
											py: 1,
											bgcolor: 'warning.main',
											'&:hover': { bgcolor: 'warning.dark' }
										}}
									>
										Upload Audio
										<input hidden type="file" accept="audio/*" onChange={(e) => {
											const file = e.target.files?.[0]
											if (file) handleAudioUpload(file)
										}} />
									</Button>
								</Stack>
							</Paper>
						</Stack>
					</Paper>

					{/* Files Grid */}
					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
						{(filesData?.files || []).map((file: any) => (
							<Card key={file._id} sx={{ height: '100%' }}>
								<CardContent>
									<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
										<Box sx={{ flex: 1 }}>
											<Typography variant="h6" noWrap>
												{file.title || file.originalName}
											</Typography>
											<Typography variant="body2" color="text.secondary" gutterBottom>
												{file.aiAnalysis?.summary || 'No summary available'}
											</Typography>
											<Stack direction="row" spacing={1} sx={{ mb: 1 }}>
												<Chip label={file.section} size="small" />
												<Chip label={file.aiAnalysis?.difficulty || 'unknown'} size="small" />
											</Stack>
											{file.aiAnalysis?.tags && (
												<Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
													{file.aiAnalysis.tags.slice(0, 3).map((tag: string) => (
														<Chip key={tag} label={tag} size="small" variant="outlined" />
													))}
												</Stack>
											)}
										</Box>
										<Stack direction="column" spacing={1}>
											<IconButton 
												size="small"
												onClick={() => {
													setSelectedFile(file)
													setQuizDialogOpen(true)
												}}
												title="Generate Quiz"
											>
												<QuizIcon />
											</IconButton>
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>
				</Box>
			)}

			{/* AI Interactions Tab */}
			{tab === 1 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" spacing={2} alignItems="center">
							<Button 
								variant="outlined"
								startIcon={<QAIcon />}
								onClick={() => setQuestionDialogOpen(true)}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									px: 3,
									py: 1
								}}
							>
								Generate AI Response
							</Button>
							<Typography variant="body2" color="text.secondary">
								Create AI responses for student questions or generate sample interactions.
							</Typography>
						</Stack>
					</Paper>

					<List>
						{(interactions || []).map((interaction: any) => (
							<ListItem key={interaction._id} divider>
								<ListItemText
									primary={interaction.question}
									secondary={
										<Stack spacing={1}>
											<Typography variant="body2">
												{interaction.aiResponse?.content}
											</Typography>
											<Stack direction="row" spacing={1}>
												<Chip label={interaction.type} size="small" />
												<Chip 
													label={interaction.status} 
													size="small" 
													color={interaction.status === 'approved' ? 'success' : 'default'}
												/>
												<Chip 
													label={interaction.aiResponse?.source || 'unknown'} 
													size="small" 
													variant="outlined"
												/>
											</Stack>
										</Stack>
									}
								/>
								{!interaction.aiResponse?.approved && (
									<Button
										startIcon={<CheckIcon />}
										onClick={() => approveMutation.mutateAsync(interaction._id)}
										sx={{ 
											borderRadius: '50px',
											fontWeight: 'bold',
											px: 2,
											py: 1
										}}
									>
										Approve
									</Button>
								)}
							</ListItem>
						))}
					</List>
				</Box>
			)}

			{/* Generated Quizzes Tab */}
			{tab === 2 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							🤖 AI-Generated Quizzes
						</Typography>
						<Typography variant="body2" color="text.secondary">
							View and manage quizzes automatically generated from your uploaded files.
						</Typography>
					</Paper>

					<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
						{(quizzes || []).map((quiz: any) => (
							<Card key={quiz._id} sx={{ height: '100%' }}>
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
										</Stack>

										{quiz.sourceFile && (
											<Typography variant="caption" color="text.secondary">
												📄 Source: {quiz.sourceFile.originalName}
											</Typography>
										)}

										<Stack direction="row" spacing={1}>
											<Button 
												variant="outlined" 
												size="small"
												onClick={() => handleViewQuestions(quiz)}
												sx={{ 
													borderRadius: '50px',
													fontWeight: 'bold',
													px: 2,
													py: 0.5
												}}
											>
												View Questions
											</Button>
											<Button 
												variant="contained" 
												size="small"
												onClick={() => handleAssignQuiz(quiz)}
												startIcon={<SendIcon />}
												sx={{ 
													borderRadius: '50px',
													fontWeight: 'bold',
													px: 2,
													py: 0.5
												}}
											>
												Assign to Students
											</Button>
										</Stack>

										{quiz.questions && quiz.questions.length > 0 && (
											<Box>
												<Typography variant="subtitle2" gutterBottom>
													Sample Questions:
												</Typography>
												{quiz.questions.slice(0, 2).map((q: any, index: number) => (
													<Typography key={index} variant="body2" sx={{ mb: 1, pl: 1 }}>
														{index + 1}. {q.question}
													</Typography>
												))}
												{quiz.questions.length > 2 && (
													<Typography variant="caption" color="text.secondary">
														... and {quiz.questions.length - 2} more questions
													</Typography>
												)}
											</Box>
										)}
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>

					{(!quizzes || quizzes.length === 0) && (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Quizzes Generated Yet
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Upload files and generate AI-powered quizzes to see them here.
							</Typography>
							<Button 
								variant="contained"
								onClick={() => setTab(0)}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									px: 3,
									py: 1,
									mt: 2
								}}
							>
								Go to Files & Content
							</Button>
						</Paper>
					)}
				</Box>
			)}

			{/* Student Management Tab */}
			{tab === 3 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							👥 Student Management & Quiz Assignment
						</Typography>
						<Typography variant="body2" color="text.secondary">
							View registered and active students, and assign quizzes to them.
						</Typography>
					</Paper>

					{/* Registered Students */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<PeopleIcon color="primary" />
							<Typography variant="h6">
								Registered Students ({registeredStudents?.length || 0})
							</Typography>
						</Stack>
						
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
							{(registeredStudents || []).map((student: any) => (
								<Card key={student._id} sx={{ height: '100%' }}>
									<CardContent>
										<Stack spacing={2}>
											<Stack direction="row" alignItems="center" spacing={2}>
												<Avatar sx={{ bgcolor: 'primary.main' }}>
													<PersonIcon />
												</Avatar>
												<Box>
													<Typography variant="h6" gutterBottom>
														{student.name}
													</Typography>
													<Typography variant="body2" color="text.secondary">
														{student.email}
													</Typography>
												</Box>
											</Stack>
											
											<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
												<Chip 
													label={student.role} 
													size="small" 
													color="primary" 
												/>
												<Chip 
													label={`Joined: ${new Date(student.createdAt).toLocaleDateString()}`} 
													size="small" 
													variant="outlined"
												/>
											</Stack>
										</Stack>
									</CardContent>
								</Card>
							))}
						</Box>

						{(!registeredStudents || registeredStudents.length === 0) && (
							<Box sx={{ textAlign: 'center', py: 4 }}>
								<PeopleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
								<Typography variant="h6" gutterBottom>
									No Registered Students
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Students will appear here once they register for your courses.
								</Typography>
							</Box>
						)}
					</Paper>

					{/* Active Students */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<OnlineIcon color="success" />
							<Typography variant="h6">
								Currently Active Students ({activeStudents?.length || 0})
							</Typography>
						</Stack>
						
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
							{(activeStudents || []).map((student: any) => (
								<Card key={student._id} sx={{ height: '100%', border: '2px solid', borderColor: 'success.main' }}>
									<CardContent>
										<Stack spacing={2}>
											<Stack direction="row" alignItems="center" spacing={2}>
												<Badge
													overlap="circular"
													anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
													variant="dot"
													color="success"
												>
													<Avatar sx={{ bgcolor: 'success.main' }}>
														<PersonIcon />
													</Avatar>
												</Badge>
												<Box>
													<Typography variant="h6" gutterBottom>
														{student.name}
													</Typography>
													<Typography variant="body2" color="text.secondary">
														{student.email}
													</Typography>
												</Box>
											</Stack>
											
											<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
												<Chip 
													label="Online Now" 
													size="small" 
													color="success" 
												/>
												<Chip 
													label={`Last active: ${new Date(student.lastActive).toLocaleTimeString()}`} 
													size="small" 
													variant="outlined"
												/>
											</Stack>
										</Stack>
									</CardContent>
								</Card>
							))}
						</Box>

						{(!activeStudents || activeStudents.length === 0) && (
							<Box sx={{ textAlign: 'center', py: 4 }}>
								<OnlineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
								<Typography variant="h6" gutterBottom>
									No Active Students
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Students who are currently online will appear here.
								</Typography>
							</Box>
						)}
					</Paper>

					{/* Assigned Quizzes */}
					<Paper sx={{ p: 2 }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<AssignmentIcon color="secondary" />
							<Typography variant="h6">
								Recently Assigned Quizzes ({assignedQuizzes?.length || 0})
							</Typography>
						</Stack>
						
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 2 }}>
							{(assignedQuizzes || []).map((assignment: any) => (
								<Card key={assignment._id} sx={{ height: '100%' }}>
									<CardContent>
										<Stack spacing={2}>
											<Box>
												<Typography variant="h6" gutterBottom>
													{assignment.quiz?.title}
												</Typography>
												<Typography variant="body2" color="text.secondary" gutterBottom>
													Assigned to {assignment.students?.length || 0} students
												</Typography>
											</Box>
											
											<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
												<Chip 
													label={`${assignment.quiz?.questions?.length || 0} questions`} 
													size="small" 
													color="primary" 
												/>
												<Chip 
													label={`Assigned: ${new Date(assignment.assignedAt).toLocaleDateString()}`} 
													size="small" 
													variant="outlined"
												/>
											</Stack>

											<Typography variant="caption" color="text.secondary">
												Students: {assignment.students?.map((s: any) => s.name).join(', ') || 'None'}
											</Typography>
										</Stack>
									</CardContent>
								</Card>
							))}
						</Box>

						{(!assignedQuizzes || assignedQuizzes.length === 0) && (
							<Box sx={{ textAlign: 'center', py: 4 }}>
								<AssignmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
								<Typography variant="h6" gutterBottom>
									No Assigned Quizzes
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Quizzes you assign to students will appear here.
								</Typography>
							</Box>
						)}
					</Paper>
				</Box>
			)}

			{/* Analytics Tab */}
			{tab === 4 && (
				<Box sx={{ width: '100%' }}>
					{analytics && (
						<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{analytics.overview?.totalFiles || 0}
									</Typography>
									<Typography variant="body2">Total Files</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{analytics.overview?.totalInteractions || 0}
									</Typography>
									<Typography variant="body2">AI Interactions</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{analytics.overview?.approvedResponses || 0}
									</Typography>
									<Typography variant="body2">Approved Responses</Typography>
								</CardContent>
							</Card>
							<Card>
								<CardContent>
									<Typography variant="h4" color="primary">
										{analytics.overview?.participationIndex || 0}%
									</Typography>
									<Typography variant="body2">Participation Index</Typography>
								</CardContent>
							</Card>
						</Box>
					)}
				</Box>
			)}

			{/* Generate Quiz Dialog */}
			<Dialog open={quizDialogOpen} onClose={() => setQuizDialogOpen(false)}>
				<DialogTitle>Generate Quiz from File</DialogTitle>
				<DialogContent>
					<Typography variant="body1" gutterBottom>
						Generate an AI-powered quiz from: <strong>{selectedFile?.originalName}</strong>
					</Typography>
					<Typography variant="body2" color="text.secondary" gutterBottom>
						The AI will analyze the file content and create relevant quiz questions.
					</Typography>
					{generateQuizMutation.isPending && (
						<Typography variant="body2" color="primary" sx={{ mt: 2 }}>
							🤖 AI is generating your quiz... This may take a few moments.
						</Typography>
					)}
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setQuizDialogOpen(false)}
						disabled={generateQuizMutation.isPending}
					>
						Cancel
					</Button>
					<Button 
						onClick={handleGenerateQuiz}
						variant="contained"
						disabled={generateQuizMutation.isPending}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{generateQuizMutation.isPending ? 'Generating...' : 'Generate Quiz'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Generate Response Dialog */}
			<Dialog open={questionDialogOpen} onClose={() => setQuestionDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>Generate AI Response</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							label="Student Question"
							multiline
							rows={3}
							fullWidth
							value={newQuestion}
							onChange={(e) => setNewQuestion(e.target.value)}
							placeholder="Enter a student question..."
						/>
						<TextField
							label="Context (Optional)"
							multiline
							rows={2}
							fullWidth
							value={newContext}
							onChange={(e) => setNewContext(e.target.value)}
							placeholder="Additional context for the AI response..."
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setQuestionDialogOpen(false)}>Cancel</Button>
					<Button 
						onClick={handleGenerateResponse}
						variant="contained"
						disabled={generateResponseMutation.isPending || !newQuestion.trim()}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						Generate Response
					</Button>
				</DialogActions>
			</Dialog>

			{/* View Questions Dialog */}
			<Dialog open={viewQuestionsDialogOpen} onClose={() => setViewQuestionsDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					{selectedQuiz?.title || 'Quiz Questions'}
				</DialogTitle>
				<DialogContent>
					{selectedQuiz && (
						<Stack spacing={3}>
							<Typography variant="body2" color="text.secondary">
								{selectedQuiz.description}
							</Typography>
							
							{selectedQuiz.questions && selectedQuiz.questions.length > 0 ? (
								selectedQuiz.questions.map((question: any, index: number) => (
									<Paper key={index} sx={{ p: 2, border: '1px solid #e0e0e0' }}>
										<Stack spacing={2}>
											<Typography variant="h6" sx={{ fontWeight: 'bold' }}>
												Question {index + 1}: {question.question}
											</Typography>
											
											<Box>
												<Typography variant="subtitle2" gutterBottom>
													Options:
												</Typography>
												{question.options && question.options.map((option: string, optIndex: number) => (
													<Typography 
														key={optIndex} 
														variant="body2" 
														sx={{ 
															pl: 2, 
															mb: 0.5,
															color: optIndex === question.correctAnswer ? 'success.main' : 'text.primary',
															fontWeight: optIndex === question.correctAnswer ? 'bold' : 'normal'
														}}
													>
														{String.fromCharCode(65 + optIndex)}. {option}
														{optIndex === question.correctAnswer && ' ✓'}
													</Typography>
												))}
											</Box>
											
											{question.explanation && (
												<Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 1 }}>
													<Typography variant="subtitle2" gutterBottom>
														Explanation:
													</Typography>
													<Typography variant="body2">
														{question.explanation}
													</Typography>
												</Box>
											)}
										</Stack>
									</Paper>
								))
							) : (
								<Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
									No questions available for this quiz.
								</Typography>
							)}
						</Stack>
					)}
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setViewQuestionsDialogOpen(false)}>
						Close
					</Button>
				</DialogActions>
			</Dialog>

			{/* Quiz Assignment Dialog */}
			<Dialog open={assignmentDialogOpen} onClose={() => setAssignmentDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					<Stack direction="row" alignItems="center" spacing={1}>
						<AssignmentIcon />
						<Typography variant="h6">
							Assign Quiz to Students
						</Typography>
					</Stack>
					<Typography variant="subtitle2" color="text.secondary">
						Quiz: {quizToAssign?.title}
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<Typography variant="body2" color="text.secondary">
							Select students to assign this quiz to. They will receive a notification when the quiz is assigned.
						</Typography>

						{/* Registered Students Selection */}
						<Box>
							<Typography variant="h6" gutterBottom>
								Registered Students ({registeredStudents?.length || 0})
							</Typography>
							<Box sx={{ maxHeight: 300, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
								{(registeredStudents || []).map((student: any) => (
									<FormControlLabel
										key={student._id}
										control={
											<Checkbox
												checked={selectedStudents.includes(student._id)}
												onChange={() => handleStudentSelection(student._id)}
											/>
										}
										label={
											<Stack direction="row" alignItems="center" spacing={1}>
												<Avatar sx={{ width: 24, height: 24, bgcolor: 'primary.main' }}>
													<PersonIcon fontSize="small" />
												</Avatar>
												<Box>
													<Typography variant="body2" fontWeight={600}>
														{student.name}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{student.email}
													</Typography>
												</Box>
											</Stack>
										}
										sx={{ width: '100%', m: 0 }}
									/>
								))}
							</Box>
						</Box>

						{/* Active Students Selection */}
						<Box>
							<Typography variant="h6" gutterBottom>
								Currently Active Students ({activeStudents?.length || 0})
							</Typography>
							<Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid #e0e0e0', borderRadius: 1, p: 1 }}>
								{(activeStudents || []).map((student: any) => (
									<FormControlLabel
										key={student._id}
										control={
											<Checkbox
												checked={selectedStudents.includes(student._id)}
												onChange={() => handleStudentSelection(student._id)}
											/>
										}
										label={
											<Stack direction="row" alignItems="center" spacing={1}>
												<Badge
													overlap="circular"
													anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
													variant="dot"
													color="success"
												>
													<Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
														<PersonIcon fontSize="small" />
													</Avatar>
												</Badge>
												<Box>
													<Typography variant="body2" fontWeight={600}>
														{student.name}
													</Typography>
													<Typography variant="caption" color="text.secondary">
														{student.email} • Online Now
													</Typography>
												</Box>
											</Stack>
										}
										sx={{ width: '100%', m: 0 }}
									/>
								))}
							</Box>
						</Box>

						{selectedStudents.length > 0 && (
							<Paper sx={{ p: 2, bgcolor: 'primary.50' }}>
								<Typography variant="body2" color="primary">
									✅ {selectedStudents.length} student{selectedStudents.length > 1 ? 's' : ''} selected for quiz assignment
								</Typography>
							</Paper>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button 
						onClick={() => setAssignmentDialogOpen(false)}
						disabled={assignQuizMutation.isPending}
					>
						Cancel
					</Button>
					<Button 
						onClick={handleAssignToStudents}
						variant="contained"
						disabled={assignQuizMutation.isPending || selectedStudents.length === 0}
						startIcon={<SendIcon />}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{assignQuizMutation.isPending ? 'Assigning...' : `Assign to ${selectedStudents.length} Student${selectedStudents.length > 1 ? 's' : ''}`}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Voice Input Dialog */}
			<Dialog open={voiceDialogOpen} onClose={() => setVoiceDialogOpen(false)} maxWidth="md" fullWidth>
				<DialogTitle>
					<Typography variant="h5" gutterBottom>
						🎤 Voice Recording & Audio Upload
					</Typography>
					<Typography variant="subtitle2" color="text.secondary">
						Record your voice or upload audio files for AI analysis and quiz generation
					</Typography>
				</DialogTitle>
				<DialogContent>
					<VoiceInput
						onTranscript={handleVoiceTranscript}
						onAudioUpload={handleAudioUpload}
						isProcessing={voiceProcessing}
					/>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setVoiceDialogOpen(false)}>
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	)
}

export default EnhancedTeacherDashboard
