import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

export type AuthUser = {
	id: string
	email: string
	name: string
	role: 'admin' | 'institution_admin' | 'teacher' | 'student'
}

export type AuthState = {
	isAuthenticated: boolean
	token: string | null
	user: AuthUser | null
}

const initialState: AuthState = {
	isAuthenticated: false,
	token: null,
	user: null,
}

const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		loginSuccess(state, action: PayloadAction<{ token: string; user: AuthUser }>) {
			state.isAuthenticated = true
			state.token = action.payload.token
			state.user = action.payload.user
			localStorage.setItem('token', action.payload.token)
			localStorage.setItem('user', JSON.stringify(action.payload.user))
		},
		logout(state) {
			state.isAuthenticated = false
			state.token = null
			state.user = null
			localStorage.removeItem('token')
			localStorage.removeItem('user')
		},
	},
})

export const { loginSuccess, logout } = authSlice.actions
export default authSlice.reducer

