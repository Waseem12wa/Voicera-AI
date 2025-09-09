import api from './apiClient'

export const createProgram = async (name: string) => {
	const { data } = await api.post('/programs', { name })
	return data
}

export const createCourse = async (name: string) => {
	const { data } = await api.post('/courses', { name })
	return data
}

export const listPrograms = async () => {
	const { data } = await api.get('/programs')
	return data
}

export const listCourses = async () => {
	const { data } = await api.get('/courses')
	return data
}

