import api from './apiClient'

// Student Course Management
export const getStudentCourses = async () => {
	const { data } = await api.get('/student/courses')
	return data
}

export const enrollInCourse = async (courseId: string) => {
	const { data } = await api.post(`/student/courses/${courseId}/enroll`)
	return data
}

// Student Quiz Management
export const getStudentQuizzes = async () => {
	const { data } = await api.get('/student/quizzes')
	return data
}

export const submitQuizAnswer = async (quizId: string, answers: {[key: string]: number}) => {
	const { data } = await api.post(`/student/quizzes/${quizId}/submit`, { answers })
	return data
}

export const getQuizResults = async (quizId: string) => {
	const { data } = await api.get(`/student/quizzes/${quizId}/results`)
	return data
}

// Student Progress Tracking
export const getStudentProgress = async () => {
	const { data } = await api.get('/student/progress')
	return data
}

export const updateLearningPath = async (pathData: any) => {
	const { data } = await api.post('/student/learning-path', pathData)
	return data
}

// Student Notes Management
export const saveStudentNote = async (title: string, content: string, courseId?: string) => {
	const { data } = await api.post('/student/notes', { title, content, courseId })
	return data
}

export const getStudentNotes = async () => {
	const { data } = await api.get('/student/notes')
	return data
}

export const updateStudentNote = async (noteId: string, title: string, content: string) => {
	const { data } = await api.put(`/student/notes/${noteId}`, { title, content })
	return data
}

export const deleteStudentNote = async (noteId: string) => {
	const { data } = await api.delete(`/student/notes/${noteId}`)
	return data
}

// AI Assistant for Students
export const askAIQuestion = async (question: string, courseId?: string) => {
	const { data } = await api.post('/student/ai/ask', { question, courseId })
	return data
}

export const getStudentInteractions = async () => {
	const { data } = await api.get('/student/ai/interactions')
	return data
}

export const getPersonalizedContent = async (learningStyle: string, pace: string) => {
	const { data } = await api.post('/student/ai/personalized', { learningStyle, pace })
	return data
}

// Voice and Text Processing
export const processVoiceQuestion = async (audioBlob: Blob, courseId?: string) => {
	const formData = new FormData()
	formData.append('audio', audioBlob, 'question.wav')
	if (courseId) formData.append('courseId', courseId)
	
	const { data } = await api.post('/student/ai/voice', formData, {
		headers: { 'Content-Type': 'multipart/form-data' }
	})
	return data
}

export const getTextToSpeech = async (text: string) => {
	const { data } = await api.post('/student/ai/tts', { text })
	return data
}
