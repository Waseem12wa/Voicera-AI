import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
	Box,
	Paper,
	Typography,
	Button,
	Chip,
	Stack,
	CircularProgress,
	Alert,
	IconButton,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	LinearProgress
} from '@mui/material'
import {
	ArrowBack as ArrowBackIcon,
	Quiz as QuizIcon,
	Download as DownloadIcon,
	PlayArrow as PlayIcon,
	VolumeUp as VolumeIcon,
	Description as DocumentIcon,
	Mic as MicIcon,
	ExpandMore as ExpandMoreIcon,
	School as SchoolIcon,
	Info as InfoIcon,
	AutoAwesome as AIIcon
} from '@mui/icons-material'
import { useQuery, useMutation } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'
import { generateQuizFromFile, getFileDetails, generateAdditionalInfo } from '../../services/teacherServiceEnhanced'
import { downloadFileSummary } from '../../services/studentService'

interface FileDetailsType {
	_id: string
	originalName: string
	title: string
	description: string
	mimeType: string
	size: number
	section: string
	status: string
	aiAnalysis: {
		summary: string
		tags: string[]
		difficulty: string
		subject: string
		quizQuestions: any[]
		analyzedAt: string
	}
	content?: string
	transcript?: string
	isVoiceContent?: boolean
	audioDuration?: number
	createdAt: string
	updatedAt: string
}

const FileDetailPage: React.FC = () => {
	const { fileId } = useParams<{ fileId: string }>()
	const navigate = useNavigate()
	const auth = useSelector((state: RootState) => state.auth)
	const isStudent = auth.user?.role === 'student'
	const [additionalInfo, setAdditionalInfo] = useState<string>('')
	const [isGeneratingInfo, setIsGeneratingInfo] = useState(false)
	const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false)
	const [isDownloading, setIsDownloading] = useState(false)

	// Fetch file details
	const { data: fileDetails, isLoading, error, refetch } = useQuery({
		queryKey: ['fileDetails', fileId],
		queryFn: () => isStudent ? 
			import('../../services/studentService').then(service => service.getStudentFileDetails(fileId!)) :
			getFileDetails(fileId!),
		enabled: !!fileId,
		retry: 3
	})

	// Generate additional AI information (teachers only)
	const generateInfoMutation = useMutation({
		mutationFn: () => generateAdditionalInfo(fileId!, fileDetails as FileDetailsType),
		onSuccess: (data) => {
			setAdditionalInfo(data.additionalInfo)
			setIsGeneratingInfo(false)
			enqueueSnackbar('Additional information generated successfully!', { variant: 'success' })
		},
		onError: (error: any) => {
			setIsGeneratingInfo(false)
			enqueueSnackbar(`Failed to generate additional information: ${error.message}`, { variant: 'error' })
		}
	})

	// Download PDF summary
	const downloadMutation = useMutation({
		mutationFn: () => downloadFileSummary(fileId!),
		onSuccess: (blob) => {
			setIsDownloading(false)
			// Create download link
			const url = window.URL.createObjectURL(blob)
			const link = document.createElement('a')
			link.href = url
			link.download = `${fileDetails?.title || fileDetails?.originalName || 'file'}-summary.pdf`
			document.body.appendChild(link)
			link.click()
			document.body.removeChild(link)
			window.URL.revokeObjectURL(url)
			enqueueSnackbar('PDF downloaded successfully!', { variant: 'success' })
		},
		onError: (error: any) => {
			setIsDownloading(false)
			enqueueSnackbar(`Failed to download PDF: ${error.message}`, { variant: 'error' })
		}
	})

	// Generate AI Quiz
	const generateQuizMutation = useMutation({
		mutationFn: () => generateQuizFromFile(fileId!, (fileDetails as FileDetailsType)?.title),
		onSuccess: (quiz) => {
			setIsGeneratingQuiz(false)
			enqueueSnackbar('AI Quiz generated successfully!', { variant: 'success' })
			// Navigate to quiz page or show quiz dialog
			navigate(`/teacher/quiz/${quiz._id}`)
		},
		onError: (error: any) => {
			setIsGeneratingQuiz(false)
			enqueueSnackbar(`Failed to generate quiz: ${error.message}`, { variant: 'error' })
		}
	})

	// Auto-generate additional info when file loads (teachers only)
	useEffect(() => {
		if (fileDetails && !additionalInfo && !isStudent) {
			setIsGeneratingInfo(true)
			generateInfoMutation.mutate()
		} else if (fileDetails && !additionalInfo && isStudent) {
			// For students, generate simple additional info
			setAdditionalInfo(generateStudentAdditionalInfo(fileDetails))
		}
	}, [fileDetails, isStudent])

	const generateStudentAdditionalInfo = (file: FileDetailsType) => {
		const fileName = file.originalName
		const subject = file.aiAnalysis?.subject || 'General Education'
		
		return `## Additional Information for ${fileName}

### Learning Objectives
Students will gain a comprehensive understanding of ${subject.toLowerCase()} concepts and develop critical thinking skills through this educational material.

### Key Concepts Covered
This content covers essential ${subject.toLowerCase()} principles, including fundamental concepts, practical applications, and problem-solving techniques.

### Prerequisites
Basic understanding of ${subject.toLowerCase()} fundamentals and general academic skills are recommended before studying this material.

### Real-world Applications
The knowledge gained from this content can be applied in various real-world scenarios, including academic projects, professional development, and everyday problem-solving situations.

### Study Tips
- Read actively and take detailed notes
- Review the material regularly to reinforce learning
- Practice applying concepts to different scenarios
- Seek clarification when needed
- Form study groups for collaborative learning

### Assessment Ideas
- Self-assessment quizzes and practice exercises
- Discussion and analysis of key concepts
- Application of knowledge to new situations
- Peer review and collaborative learning activities

### Related Topics
- Advanced ${subject.toLowerCase()} concepts
- Interdisciplinary connections
- Current research and developments
- Professional applications and career paths

### Additional Resources
- Online tutorials and educational videos
- Reference materials and textbooks
- Practice exercises and assessments
- Discussion forums and study groups

### Summary
This educational material provides a solid foundation for understanding ${subject.toLowerCase()} concepts. It is designed to enhance your learning experience and help you develop the skills necessary for academic success and future applications.`
	}

	const handleGenerateQuiz = () => {
		setIsGeneratingQuiz(true)
		generateQuizMutation.mutate()
	}

	const handleDownloadPDF = () => {
		setIsDownloading(true)
		downloadMutation.mutate()
	}

	const handleGoBack = () => {
		navigate(isStudent ? '/student/files' : '/teacher/dashboard')
	}

	const getFileIcon = (mimeType: string, isVoiceContent?: boolean) => {
		if (isVoiceContent) return <MicIcon sx={{ fontSize: 40 }} />
		if (mimeType.startsWith('audio/')) return <VolumeIcon sx={{ fontSize: 40 }} />
		if (mimeType.startsWith('video/')) return <PlayIcon sx={{ fontSize: 40 }} />
		return <DocumentIcon sx={{ fontSize: 40 }} />
	}

	const getFileTypeColor = (section: string) => {
		switch (section) {
			case 'lectures': return 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
			case 'assignments': return 'linear-gradient(135deg, #1e88e5 0%, #1976d2 100%)'
			case 'quizzes': return 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)'
			case 'notes': return 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)'
			case 'resources': return 'linear-gradient(135deg, #64b5f6 0%, #1976d2 100%)'
			case 'voice': return 'linear-gradient(135deg, #90caf9 0%, #1976d2 100%)'
			case 'audio': return 'linear-gradient(135deg, #bbdefb 0%, #1976d2 100%)'
			default: return 'linear-gradient(135deg, #e3f2fd 0%, #1976d2 100%)'
		}
	}

	const formatFileSize = (bytes: number) => {
		if (bytes === 0) return '0 Bytes'
		const k = 1024
		const sizes = ['Bytes', 'KB', 'MB', 'GB']
		const i = Math.floor(Math.log(bytes) / Math.log(k))
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
	}

	const formatDuration = (seconds?: number) => {
		if (!seconds) return 'Unknown'
		const minutes = Math.floor(seconds / 60)
		const remainingSeconds = seconds % 60
		return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
	}

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<CircularProgress size={60} />
				<Typography sx={{ ml: 2 }}>Loading file details...</Typography>
			</Box>
		)
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">
					Failed to load file details: {error.message}
					<Button onClick={() => refetch()} sx={{ ml: 2 }}>
						Retry
					</Button>
				</Alert>
			</Box>
		)
	}

	if (!fileDetails) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="warning">File not found</Alert>
			</Box>
		)
	}

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
			{/* Header */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<IconButton onClick={handleGoBack} sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
						📄 {isStudent ? 'Learning Material Details' : 'File Details'}
					</Typography>
					{isStudent ? (
						<Button
							variant="contained"
							startIcon={<DownloadIcon />}
							onClick={handleDownloadPDF}
							disabled={isDownloading}
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
							{isDownloading ? 'Generating PDF...' : '📥 Download Summary PDF'}
						</Button>
					) : (
						<Button
							variant="contained"
							startIcon={<QuizIcon />}
							onClick={handleGenerateQuiz}
							disabled={isGeneratingQuiz}
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
							{isGeneratingQuiz ? 'Generating Quiz...' : '🎯 Generate AI Quiz'}
						</Button>
					)}
				</Stack>

				{(isGeneratingQuiz || isDownloading) && (
					<Box sx={{ mb: 2 }}>
						<Typography variant="body2" sx={{ mb: 1 }}>
							{isGeneratingQuiz ? 'Generating AI Quiz from content...' : 'Generating PDF summary...'}
						</Typography>
						<LinearProgress />
					</Box>
				)}
			</Paper>

			<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3 }}>
				{/* Left Column - File Information */}
				<Box sx={{ flex: { xs: '1', md: '0 0 33.333%' } }}>
					<Paper sx={{ 
						p: 3, 
						borderRadius: '16px', 
						boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
						background: getFileTypeColor(fileDetails.section),
						color: 'white',
						height: 'fit-content'
					}}>
						<Stack alignItems="center" spacing={2} sx={{ mb: 3 }}>
							{getFileIcon(fileDetails.mimeType, fileDetails.isVoiceContent)}
							<Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
								{fileDetails.title || fileDetails.originalName}
							</Typography>
						</Stack>

						<Stack spacing={2}>
							<Box>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>File Type</Typography>
								<Typography variant="body1" sx={{ fontWeight: 'bold' }}>
									{fileDetails.section.charAt(0).toUpperCase() + fileDetails.section.slice(1)}
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Original Name</Typography>
								<Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
									{fileDetails.originalName}
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>File Size</Typography>
								<Typography variant="body1" sx={{ fontWeight: 'bold' }}>
									{formatFileSize(fileDetails.size)}
								</Typography>
							</Box>

							{fileDetails.audioDuration && (
								<Box>
									<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Duration</Typography>
									<Typography variant="body1" sx={{ fontWeight: 'bold' }}>
										{formatDuration(fileDetails.audioDuration)}
									</Typography>
								</Box>
							)}

							<Box>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Uploaded</Typography>
								<Typography variant="body2">
									{new Date(fileDetails.createdAt).toLocaleDateString()}
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Status</Typography>
								<Chip 
									label={fileDetails.status} 
									size="small"
									sx={{ 
										bgcolor: 'rgba(255,255,255,0.2)', 
										color: 'white',
										fontWeight: 'bold'
									}}
								/>
							</Box>
						</Stack>
					</Paper>

					{/* Tags */}
					<Paper sx={{ p: 3, mt: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
						<Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
							🏷️ Tags & Categories
						</Typography>
						<Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
							{fileDetails.aiAnalysis?.tags?.map((tag: string, index: number) => (
								<Chip 
									key={index}
									label={tag} 
									variant="outlined"
									sx={{ borderRadius: '20px' }}
								/>
							))}
						</Stack>
					</Paper>
				</Box>

				{/* Right Column - Content & Analysis */}
				<Box sx={{ flex: { xs: '1', md: '0 0 66.666%' } }}>
					{/* AI Analysis Summary */}
					<Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<AIIcon sx={{ color: 'primary.main' }} />
							<Typography variant="h6" sx={{ fontWeight: 'bold' }}>
								🤖 AI Analysis Summary
							</Typography>
						</Stack>
						<Box sx={{ 
							mb: 2,
							'& h2': { 
								fontSize: '1.3rem', 
								fontWeight: 'bold', 
								color: 'primary.main',
								mb: 1.5,
								mt: 2,
								'&:first-of-type': { mt: 0 }
							},
							'& h3': { 
								fontSize: '1.1rem', 
								fontWeight: 'bold', 
								color: 'secondary.main',
								mb: 1,
								mt: 1.5
							},
							'& p': { 
								mb: 1.5, 
								lineHeight: 1.6 
							},
							'& ul': { 
								pl: 2, 
								mb: 1.5 
							},
							'& li': { 
								mb: 0.5 
							}
						}}>
							{fileDetails.aiAnalysis?.summary ? (
								<div dangerouslySetInnerHTML={{ 
									__html: fileDetails.aiAnalysis.summary
										.replace(/## (.*)/g, '<h2>$1</h2>')
										.replace(/### (.*)/g, '<h3>$1</h3>')
										.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
										.replace(/\n/g, '<br>')
								}} />
							) : (
								<Typography variant="body1" sx={{ lineHeight: 1.6 }}>
									{fileDetails.description || 'No summary available'}
								</Typography>
							)}
						</Box>
						<Stack direction="row" spacing={2}>
							<Chip 
								label={`Subject: ${fileDetails.aiAnalysis?.subject || 'General'}`}
								color="primary"
								variant="outlined"
							/>
							<Chip 
								label={`Difficulty: ${fileDetails.aiAnalysis?.difficulty || 'medium'}`}
								color="secondary"
								variant="outlined"
							/>
						</Stack>
					</Paper>

					{/* Additional AI Information */}
					<Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
						<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
							<InfoIcon sx={{ color: 'info.main' }} />
							<Typography variant="h6" sx={{ fontWeight: 'bold' }}>
								📚 Additional Information
							</Typography>
						</Stack>
						
						{isGeneratingInfo ? (
							<Box>
								<Typography variant="body2" sx={{ mb: 1 }}>
									Generating additional information with AI...
								</Typography>
								<LinearProgress />
							</Box>
						) : (
							<Box sx={{ 
								'& h2': { 
									fontSize: '1.5rem', 
									fontWeight: 'bold', 
									color: 'primary.main',
									mb: 2,
									mt: 3,
									'&:first-of-type': { mt: 0 }
								},
								'& h3': { 
									fontSize: '1.2rem', 
									fontWeight: 'bold', 
									color: 'secondary.main',
									mb: 1.5,
									mt: 2
								},
								'& p': { 
									mb: 1.5, 
									lineHeight: 1.6 
								},
								'& ul': { 
									pl: 2, 
									mb: 1.5 
								},
								'& li': { 
									mb: 0.5 
								}
							}}>
								{additionalInfo ? (
									<div dangerouslySetInnerHTML={{ 
										__html: additionalInfo
											.replace(/## (.*)/g, '<h2>$1</h2>')
											.replace(/### (.*)/g, '<h3>$1</h3>')
											.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
											.replace(/\n/g, '<br>')
									}} />
								) : (
									<Typography variant="body1" sx={{ lineHeight: 1.6 }}>
										Click "Generate Additional Info" to get AI-powered insights about this content.
									</Typography>
								)}
							</Box>
						)}
					</Paper>

					{/* Content Sections */}
					<Accordion sx={{ mb: 2, borderRadius: '16px !important', overflow: 'hidden' }}>
						<AccordionSummary expandIcon={<ExpandMoreIcon />}>
							<Typography variant="h6" sx={{ fontWeight: 'bold' }}>
								📖 Content Details
							</Typography>
						</AccordionSummary>
						<AccordionDetails>
							{fileDetails.content && (
								<Box sx={{ mb: 2 }}>
									<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
										File Content:
									</Typography>
									<Typography variant="body2" sx={{ 
										bgcolor: '#f5f5f5', 
										p: 2, 
										borderRadius: '8px',
										fontFamily: 'monospace',
										whiteSpace: 'pre-wrap',
										maxHeight: '300px',
										overflow: 'auto'
									}}>
										{fileDetails.content}
									</Typography>
								</Box>
							)}
							
							{fileDetails.transcript && (
								<Box>
									<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
										Transcript:
									</Typography>
									<Typography variant="body2" sx={{ 
										bgcolor: '#e3f2fd', 
										p: 2, 
										borderRadius: '8px',
										lineHeight: 1.6
									}}>
										{fileDetails.transcript}
									</Typography>
								</Box>
							)}
						</AccordionDetails>
					</Accordion>

					{/* Actions */}
					<Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
						<Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
							⚡ {isStudent ? 'Available Actions' : 'Quick Actions'}
						</Typography>
						<Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 2 }}>
							{isStudent ? (
								<>
									<Button
										variant="contained"
										startIcon={<DownloadIcon />}
										onClick={handleDownloadPDF}
										disabled={isDownloading}
										sx={{ borderRadius: '50px' }}
									>
										📥 Download Summary PDF
									</Button>
									<Button
										variant="outlined"
										startIcon={<SchoolIcon />}
										sx={{ borderRadius: '50px' }}
										onClick={() => navigate('/student')}
									>
										📚 Back to Dashboard
									</Button>
								</>
							) : (
								<>
									<Button
										variant="contained"
										startIcon={<QuizIcon />}
										onClick={handleGenerateQuiz}
										disabled={isGeneratingQuiz}
										sx={{ borderRadius: '50px' }}
									>
										🎯 Generate AI Quiz
									</Button>
									<Button
										variant="outlined"
										startIcon={<DownloadIcon />}
										onClick={handleDownloadPDF}
										disabled={isDownloading}
										sx={{ borderRadius: '50px' }}
									>
										📥 Download Summary PDF
									</Button>
									<Button
										variant="outlined"
										startIcon={<SchoolIcon />}
										sx={{ borderRadius: '50px' }}
									>
										📚 Add to Course
									</Button>
								</>
							)}
						</Stack>
					</Paper>
				</Box>
			</Box>
		</Box>
	)
}

export default FileDetailPage
