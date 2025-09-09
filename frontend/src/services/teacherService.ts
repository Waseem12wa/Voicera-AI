import api from './apiClient'

export const uploadMaterials = async (files: File[]) => {
	const form = new FormData()
	files.forEach((f) => form.append('files', f))
	const { data } = await api.post('/teacher/uploads', form, { headers: { 'Content-Type': 'multipart/form-data' } })
	return data
}

export const listMaterials = async () => {
	const { data } = await api.get('/teacher/uploads')
	return data
}

export const listAIResponses = async () => {
	const { data } = await api.get('/teacher/responses')
	return data
}

export const createAIResponse = async (payload: { question: string; answer: string; source?: 'repository' | 'web' }) => {
	const { data } = await api.post('/teacher/responses', payload)
	return data
}

export const approveAIResponse = async (id: string) => {
	const { data } = await api.post(`/teacher/responses/${id}/approve`, {})
	return data
}

export const getTeacherAnalytics = async () => {
	const { data } = await api.get('/teacher/analytics')
	return data
}

