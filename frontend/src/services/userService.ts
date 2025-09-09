import api from './apiClient'

export const listUsers = async () => {
	const { data } = await api.get('/users')
	return data
}

export const createUser = async (payload: { name: string; email: string; role: 'teacher' | 'student' | 'institution_admin' }) => {
	const { data } = await api.post('/users', payload)
	return data
}

export const bulkCreateUsers = async (users: Array<{ name: string; email: string; role: string }>) => {
	const { data } = await api.post('/users/bulk', { users })
	return data
}

export const registerAdmin = async (payload: { name: string; email: string; password: string; role: string }) => {
	const { data } = await api.post('/register', payload)
	return data
}

export const checkEmailExists = async (email: string) => {
	try {
		const { data } = await api.get(`/users/check-email?email=${encodeURIComponent(email)}`)
		return data.exists
	} catch (error) {
		return false
	}
}

