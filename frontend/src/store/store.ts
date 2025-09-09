import { configureStore } from '@reduxjs/toolkit'
import authReducer, { type AuthState } from '../features/auth/authSlice'

const loadAuthFromStorage = (): AuthState | undefined => {
	try {
		const token = localStorage.getItem('token')
		const userRaw = localStorage.getItem('user')
		if (!token || !userRaw) return undefined
		const user = JSON.parse(userRaw)
		return { isAuthenticated: true, token, user }
	} catch {
		return undefined
	}
}

const preloadedAuth = loadAuthFromStorage()

export const store = configureStore({
	reducer: { auth: authReducer },
	preloadedState: preloadedAuth ? { auth: preloadedAuth } : undefined,
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

