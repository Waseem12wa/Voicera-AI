import axios from 'axios'

// Vite exposes import.meta.env in build/runtime; provide safe fallback for SSR/undefined
const viteEnv = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {}
const baseURL = (viteEnv.VITE_API_BASE_URL as string) || '/api'

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

