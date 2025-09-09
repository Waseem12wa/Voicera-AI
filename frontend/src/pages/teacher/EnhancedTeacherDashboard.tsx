import { Box, Button, Paper, Stack, Tab, Tabs, Typography, List, ListItem, ListItemText, Chip, Card, CardContent, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { 
	uploadFiles, 
	getFilesBySection, 
	getStudentInteractions, 
	generateAIResponse, 
	approveAIResponse,
	generateQuizFromFile,
	getQuizzes,
	getEnhancedAnalytics
} from '../../services/teacherServiceEnhanced'
import { 
	Upload as UploadIcon,
	Quiz as QuizIcon,
	QuestionAnswer as QAIcon,
	CheckCircle as CheckIcon
} from '@mui/icons-material'

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
	
	const qc = useQueryClient()

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
				Enhanced Teacher Dashboard
			</Typography>
			
			<Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2, width: '100%', justifyContent: 'center' }}>
				<Tab label="Files & Content" />
				<Tab label="AI Interactions" />
				<Tab label="Generated Quizzes" />
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

					{/* Upload Section */}
					<Paper sx={{ p: 2, mb: 2 }}>
						<Stack direction="row" spacing={2} alignItems="center">
							<Button 
								variant="outlined" 
								component="label"
								startIcon={<UploadIcon />}
								sx={{ 
									borderRadius: '50px',
									fontWeight: 'bold',
									px: 3,
									py: 1
								}}
							>
								Upload Files
								<input hidden multiple type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt" onChange={handleFileUpload} />
							</Button>
							<Typography variant="body2" color="text.secondary">
								Upload lecture notes, assignments, and resources. AI will automatically organize and analyze them.
							</Typography>
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

			{/* Analytics Tab */}
			{tab === 3 && (
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
		</Box>
	)
}

export default EnhancedTeacherDashboard
