import { Box, Button, Paper, Stack, Tab, Tabs, Typography, Card, CardContent, Chip, List, ListItem, ListItemText, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Avatar, LinearProgress } from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { 
	QuestionAnswer as QAIcon,
	Quiz as QuizIcon,
	Book as BookIcon,
	Note as NoteIcon,
	TrendingUp as ProgressIcon,
	Mic as MicIcon,
	Send as SendIcon,
	PlayArrow as PlayIcon,
	Pause as PauseIcon
} from '@mui/icons-material'
import { 
	getStudentCourses,
	getStudentQuizzes,
	submitQuizAnswer,
	getStudentProgress,
	saveStudentNote,
	getStudentNotes,
	askAIQuestion,
	getStudentInteractions
} from '../../services/studentService'

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
	
	const qc = useQueryClient()

	// Queries
	const { data: courses } = useQuery({ 
		queryKey: ['student', 'courses'], 
		queryFn: getStudentCourses
	})
	
	const { data: quizzes } = useQuery({ 
		queryKey: ['student', 'quizzes'], 
		queryFn: getStudentQuizzes
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
			submitQuizAnswer(quizId, answers),
		onSuccess: async () => {
			enqueueSnackbar('Quiz submitted successfully', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['student', 'quizzes'] })
			await qc.invalidateQueries({ queryKey: ['student', 'progress'] })
			setQuizDialogOpen(false)
			setSelectedQuiz(null)
			setCurrentQuestionIndex(0)
			setSelectedAnswers({})
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
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
				Student Dashboard
			</Typography>
			
			<Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
				<Tab label="My Courses" />
				<Tab label="AI Assistant" />
				<Tab label="Quizzes" />
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

			{/* AI Assistant Tab */}
			{tab === 1 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							🤖 AI Learning Assistant
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Ask questions about your courses and get AI-powered answers with sources.
						</Typography>
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
										</Stack>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>
				</Box>
			)}

			{/* Quizzes Tab */}
			{tab === 2 && (
				<Box sx={{ width: '100%' }}>
					<Paper sx={{ p: 2, mb: 2 }}>
						<Typography variant="h6" gutterBottom>
							📝 Available Quizzes
						</Typography>
						<Typography variant="body2" color="text.secondary">
							Take AI-generated quizzes based on your course materials.
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

										<Button 
											variant="contained" 
											fullWidth
											onClick={() => handleStartQuiz(quiz)}
											sx={{ 
												borderRadius: '50px',
												fontWeight: 'bold',
												px: 3,
												py: 1
											}}
										>
											Start Quiz
										</Button>
									</Stack>
								</CardContent>
							</Card>
						))}
					</Box>

					{(!quizzes || quizzes.length === 0) && (
						<Paper sx={{ p: 4, textAlign: 'center' }}>
							<QuizIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
							<Typography variant="h6" gutterBottom>
								No Quizzes Available
							</Typography>
							<Typography variant="body2" color="text.secondary" gutterBottom>
								Quizzes will appear here when teachers generate them from course materials.
							</Typography>
						</Paper>
					)}
				</Box>
			)}

			{/* My Notes Tab */}
			{tab === 3 && (
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
			{tab === 4 && (
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
		</Box>
	)
}

export default StudentDashboard
