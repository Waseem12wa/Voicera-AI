import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
	Box,
	Paper,
	Typography,
	Button,
	Chip,
	Stack,
	CircularProgress,
	Alert,
	Card,
	CardContent,
	IconButton,
	Tabs,
	Tab
} from '@mui/material'
import {
	ArrowBack as ArrowBackIcon,
	Download as DownloadIcon,
	Description as DocumentIcon,
	VolumeUp as VolumeIcon,
	PlayArrow as PlayIcon,
	Mic as MicIcon,
	School as SchoolIcon
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { getStudentFiles } from '../../services/studentService'

interface FileData {
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

const StudentFileView: React.FC = () => {
	const navigate = useNavigate()
	const [selectedSection, setSelectedSection] = useState('all')

	// Fetch files available to students
	const { data: filesData, isLoading, error } = useQuery({
		queryKey: ['studentFiles', selectedSection],
		queryFn: () => getStudentFiles(selectedSection),
		retry: 3
	})

	const handleGoBack = () => {
		navigate('/student')
	}

	const handleFileClick = (fileId: string) => {
		navigate(`/student/file/${fileId}`)
	}

	const getFileIcon = (mimeType: string, isVoiceContent?: boolean) => {
		if (isVoiceContent) return <MicIcon sx={{ fontSize: 24 }} />
		if (mimeType.startsWith('audio/')) return <VolumeIcon sx={{ fontSize: 24 }} />
		if (mimeType.startsWith('video/')) return <PlayIcon sx={{ fontSize: 24 }} />
		return <DocumentIcon sx={{ fontSize: 24 }} />
	}

	const getSectionColor = (section: string) => {
		switch (section) {
			case 'lectures': return {
				bg: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
				text: 'white'
			}
			case 'assignments': return {
				bg: 'linear-gradient(135deg, #1e88e5 0%, #1976d2 100%)',
				text: 'white'
			}
			case 'quizzes': return {
				bg: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
				text: 'white'
			}
			case 'notes': return {
				bg: 'linear-gradient(135deg, #42a5f5 0%, #1976d2 100%)',
				text: 'white'
			}
			case 'resources': return {
				bg: 'linear-gradient(135deg, #64b5f6 0%, #1976d2 100%)',
				text: 'white'
			}
			case 'voice': return {
				bg: 'linear-gradient(135deg, #90caf9 0%, #1976d2 100%)',
				text: 'white'
			}
			case 'audio': return {
				bg: 'linear-gradient(135deg, #bbdefb 0%, #1976d2 100%)',
				text: 'white'
			}
			default: return {
				bg: 'linear-gradient(135deg, #e3f2fd 0%, #1976d2 100%)',
				text: 'white'
			}
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

	// Get unique sections for tabs
	const sections = filesData?.sections ? Object.keys(filesData.sections) : []
	const allSections = ['all', ...sections]

	if (isLoading) {
		return (
			<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
				<CircularProgress size={60} />
				<Typography sx={{ ml: 2 }}>Loading files...</Typography>
			</Box>
		)
	}

	if (error) {
		return (
			<Box sx={{ p: 3 }}>
				<Alert severity="error">
					Failed to load files: {error.message}
				</Alert>
			</Box>
		)
	}

	const files = filesData?.files || []
	const filesBySection = filesData?.sections || {}

	return (
		<Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fa', p: 3 }}>
			{/* Header */}
			<Paper sx={{ p: 3, mb: 3, borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
				<Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					<IconButton onClick={handleGoBack} sx={{ bgcolor: 'rgba(0,0,0,0.1)' }}>
						<ArrowBackIcon />
					</IconButton>
					<Typography variant="h4" sx={{ fontWeight: 'bold', flex: 1 }}>
						📚 Available Learning Materials
					</Typography>
					<Stack direction="row" spacing={1} alignItems="center">
						<SchoolIcon sx={{ color: 'primary.main' }} />
						<Typography variant="body2" sx={{ color: 'text.secondary' }}>
							{files.length} files available
						</Typography>
					</Stack>
				</Stack>

				{/* Section Tabs */}
				<Tabs
					value={selectedSection}
					onChange={(e, newValue) => setSelectedSection(newValue)}
					variant="scrollable"
					scrollButtons="auto"
					sx={{
						'& .MuiTab-root': {
							borderRadius: '20px',
							mx: 0.5,
							minHeight: '40px',
							fontWeight: 'bold',
							textTransform: 'none',
							fontSize: '0.9rem'
						},
						'& .Mui-selected': {
							background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
							color: 'white !important'
						}
					}}
				>
					<Tab label="All Files" value="all" />
					{sections.map((section) => (
						<Tab 
							key={section}
							label={section.charAt(0).toUpperCase() + section.slice(1)} 
							value={section}
						/>
					))}
				</Tabs>
			</Paper>

			{/* Files Grid */}
			<Box sx={{ 
				display: 'grid', 
				gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', 
				gap: 3 
			}}>
				{files.map((file: FileData) => {
					const sectionColors = getSectionColor(file.section)
					
					return (
						<Card 
							key={file._id} 
							onClick={() => handleFileClick(file._id)}
							sx={{ 
								height: '100%', 
								background: sectionColors.bg,
								color: sectionColors.text,
								borderRadius: '16px',
								boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
								transition: 'all 0.3s ease',
								cursor: 'pointer',
								'&:hover': {
									transform: 'translateY(-4px)',
									boxShadow: '0 12px 40px rgba(0,0,0,0.15)'
								}
							}}
						>
							<CardContent sx={{ p: 3 }}>
								<Stack direction="row" justifyContent="space-between" alignItems="flex-start">
									<Box sx={{ flex: 1 }}>
										<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
											{getFileIcon(file.mimeType, file.isVoiceContent)}
											<Typography variant="h6" noWrap sx={{ 
												fontWeight: 'bold',
												fontSize: '1.1rem',
												textShadow: '0 1px 2px rgba(0,0,0,0.1)'
											}}>
												{file.title || file.originalName}
											</Typography>
										</Stack>
										
										<Typography variant="body2" sx={{ 
											mb: 2, 
											opacity: 0.9,
											lineHeight: 1.4,
											fontSize: '0.9rem',
											display: '-webkit-box',
											WebkitLineClamp: 3,
											WebkitBoxOrient: 'vertical',
											overflow: 'hidden'
										}}>
											{file.aiAnalysis?.summary || file.description || `Educational content: ${file.originalName}`}
										</Typography>
										
										<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
											<Chip 
												label={file.section} 
												size="small" 
												sx={{ 
													bgcolor: 'rgba(255,255,255,0.2)', 
													color: 'inherit',
													fontWeight: 'bold',
													backdropFilter: 'blur(10px)'
												}} 
											/>
											<Chip 
												label={file.aiAnalysis?.difficulty || 'medium'} 
												size="small" 
												sx={{ 
													bgcolor: 'rgba(255,255,255,0.2)', 
													color: 'inherit',
													fontWeight: 'bold',
													backdropFilter: 'blur(10px)'
												}} 
											/>
										</Stack>
										
										<Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', mb: 2 }}>
											{(file.aiAnalysis?.tags || ['educational', 'learning']).slice(0, 3).map((tag: string) => (
												<Chip 
													key={tag} 
													label={tag} 
													size="small" 
													variant="outlined" 
													sx={{ 
														borderColor: 'rgba(255,255,255,0.5)',
														color: 'inherit',
														fontSize: '0.75rem',
														height: '20px'
													}} 
												/>
											))}
										</Stack>

										<Stack direction="row" spacing={1} sx={{ fontSize: '0.8rem', opacity: 0.8 }}>
											<Typography variant="caption">
												📁 {formatFileSize(file.size)}
											</Typography>
											{file.audioDuration && (
												<Typography variant="caption">
													⏱️ {formatDuration(file.audioDuration)}
												</Typography>
											)}
											<Typography variant="caption">
												📅 {new Date(file.createdAt).toLocaleDateString()}
											</Typography>
										</Stack>
									</Box>
								</Stack>
							</CardContent>
						</Card>
					)
				})}
			</Box>

			{/* Empty State */}
			{files.length === 0 && (
				<Paper sx={{ p: 6, textAlign: 'center', borderRadius: '16px' }}>
					<Typography variant="h5" sx={{ mb: 2, color: 'text.secondary' }}>
						📚 No files available
					</Typography>
					<Typography variant="body1" sx={{ color: 'text.secondary' }}>
						No learning materials are currently available in this section.
					</Typography>
				</Paper>
			)}
		</Box>
	)
}

export default StudentFileView
