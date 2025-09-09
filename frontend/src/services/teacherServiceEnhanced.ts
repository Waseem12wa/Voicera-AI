import api from './apiClient'

// Enhanced file management
export const uploadFiles = async (files: File[]) => {
	const formData = new FormData()
	files.forEach(file => formData.append('files', file))
	
	const response = await api.post('/teacher/uploads', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	})
	return response.data
}

export const getFilesBySection = async (section?: string) => {
	const params = section ? { section } : {}
	const response = await api.get('/teacher/files', { params })
	return response.data
}

// AI Response Management
export const getStudentInteractions = async (type?: string, status?: string) => {
	const params: any = {}
	if (type) params.type = type
	if (status) params.status = status
	
	const response = await api.get('/teacher/interactions', { params })
	return response.data
}

export const generateAIResponse = async (question: string, context?: string, studentEmail?: string) => {
	const response = await api.post('/teacher/generate-response', {
		question,
		context,
		studentEmail
	})
	return response.data
}

export const approveAIResponse = async (interactionId: string) => {
	const response = await api.post(`/teacher/interactions/${interactionId}/approve`)
	return response.data
}

// Quiz Generation
export const generateQuizFromFile = async (fileId: string, topic?: string, questionCount?: number) => {
	const response = await api.post('/teacher/generate-quiz', {
		fileId,
		topic,
		questionCount
	})
	return response.data
}

// Quiz Management
export const getQuizzes = async () => {
	const response = await api.get('/teacher/quizzes')
	return response.data
}

export const getQuizById = async (quizId: string) => {
	const response = await api.get(`/teacher/quizzes/${quizId}`)
	return response.data
}

// Enhanced Analytics
export const getEnhancedAnalytics = async () => {
	const response = await api.get('/teacher/analytics')
	return response.data
}

// Real-time socket connection
export const connectToTeacherRoom = (teacherEmail: string, onMessage: (event: string, data: any) => void) => {
	const socket = new WebSocket(`ws://localhost:4000`)
	
	socket.onopen = () => {
		socket.send(JSON.stringify({
			type: 'join-teacher-room',
			teacherEmail
		}))
	}
	
	socket.onmessage = (event) => {
		const data = JSON.parse(event.data)
		onMessage(data.type, data.payload)
	}
	
	return socket
}
