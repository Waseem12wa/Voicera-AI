import api from './apiClient'

// Student file access
export const getStudentFiles = async (section?: string) => {
	const params = section && section !== 'all' ? { section } : {}
	const response = await api.get('/student/files', { params })
	return response.data
}

export const getStudentFileDetails = async (fileId: string) => {
	const response = await api.get(`/student/files/${fileId}`)
	return response.data
}

export const downloadFileSummary = async (fileId: string) => {
	const response = await api.get(`/student/files/${fileId}/download`, {
		responseType: 'blob'
	})
	return response.data
}

// Student quiz access
export const getStudentQuizzes = async () => {
	const response = await api.get('/student/quizzes')
	return response.data
}

export const getStudentQuizById = async (quizId: string) => {
	const response = await api.get(`/student/quizzes/${quizId}`)
	return response.data
}

export const submitQuizAnswer = async (quizId: string, answers: any[]) => {
	const response = await api.post(`/student/quizzes/${quizId}/submit`, {
		answers
	})
	return response.data
}

// Student courses and enrollment
export const getStudentCourses = async () => {
	const response = await api.get('/student/courses')
	return response.data
}

// Student quiz access
export const getAssignedQuizzes = async () => {
	const response = await api.get('/student/assigned-quizzes')
	return response.data
}

// Student notes
export const saveStudentNote = async (title: string, content: string, courseId?: string) => {
	const response = await api.post('/student/notes', { title, content, courseId })
	return response.data
}

export const getStudentNotes = async () => {
	const response = await api.get('/student/notes')
	return response.data
}

// AI interactions
export const askAIQuestion = async (question: string, courseId?: string) => {
	const response = await api.post('/student/ask-question', { question, courseId })
	return response.data
}

export const getStudentInteractions = async () => {
	const response = await api.get('/student/interactions')
	return response.data
}

// Notifications
export const getStudentNotifications = async () => {
	const response = await api.get('/student/notifications')
	return response.data
}

export const markNotificationAsRead = async (notificationId: string) => {
	const response = await api.post(`/student/notifications/${notificationId}/read`)
	return response.data
}

// Real-time connection
export const connectToStudentRoom = (studentEmail: string, onMessage: (event: string, data: any) => void) => {
	const socket = new WebSocket(`ws://localhost:4000`)
	
	socket.onopen = () => {
		socket.send(JSON.stringify({
			type: 'join-student-room',
			studentEmail
		}))
	}
	
	socket.onmessage = (event) => {
		const data = JSON.parse(event.data)
		onMessage(data.type, data.payload)
	}
	
	return socket
}

// Student profile and progress
export const getStudentProfile = async () => {
	const response = await api.get('/student/profile')
	return response.data
}

export const updateStudentProfile = async (profileData: any) => {
	const response = await api.put('/student/profile', profileData)
	return response.data
}

export const getStudentProgress = async () => {
	const response = await api.get('/student/progress')
	return response.data
}