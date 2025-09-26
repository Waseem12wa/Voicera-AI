import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

export const api = axios.create({
	baseURL,
})

api.interceptors.request.use((config) => {
	const token = localStorage.getItem('token')
	const userRaw = localStorage.getItem('user')
	if (token) {
		config.headers = config.headers ?? {}
		config.headers.Authorization = `Bearer ${token}`
	}
	if (userRaw) {
		const user = JSON.parse(userRaw)
		config.headers = config.headers ?? {}
		config.headers['x-admin-email'] = user.email
	}
	return config
})

// Export apiClient as both named and default export for compatibility
export const apiClient = api
export default api

