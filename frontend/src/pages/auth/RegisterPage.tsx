import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Paper, Stack, TextField, Typography, MenuItem, CircularProgress } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { enqueueSnackbar } from 'notistack'
import { registerAdmin, checkEmailExists } from '../../services/userService'
import { loginSuccess } from '../../features/auth/authSlice'
import { useState, useEffect } from 'react'

const schema = z.object({
	name: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(6),
	role: z.enum(['admin','teacher','student']),
})

type FormValues = z.infer<typeof schema>

const RegisterPage = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const [emailChecking, setEmailChecking] = useState(false)
	const [emailExists, setEmailExists] = useState(false)
	
	const { register, handleSubmit, formState: { errors, isSubmitting }, watch, setError, clearErrors } = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { role: 'admin', name: '', email: '', password: '' },
	})

	const watchedEmail = watch('email')

	// Check email availability when email changes
	useEffect(() => {
		const checkEmail = async () => {
			if (watchedEmail && watchedEmail.includes('@')) {
				setEmailChecking(true)
				try {
					const exists = await checkEmailExists(watchedEmail)
					setEmailExists(exists)
					if (exists) {
						setError('email', { message: 'This email is already registered' })
					} else {
						clearErrors('email')
					}
				} catch (error) {
					console.error('Error checking email:', error)
				} finally {
					setEmailChecking(false)
				}
			}
		}

		const timeoutId = setTimeout(checkEmail, 500) // Debounce
		return () => clearTimeout(timeoutId)
	}, [watchedEmail, setError, clearErrors])

	const onSubmit = async (values: FormValues) => {
		try {
			// Double-check email before registration
			if (emailExists) {
				enqueueSnackbar('This email is already registered. Please use a different email.', { variant: 'error' })
				return
			}

			const { token, user } = await registerAdmin(values as any)
			
			// Save credentials to localStorage for future login
			localStorage.setItem('token', token)
			localStorage.setItem('user', JSON.stringify(user))
			
			dispatch(loginSuccess({ token, user }))
			enqueueSnackbar('Registration successful! Welcome to Voicera AI.', { variant: 'success' })
			
			// Navigate based on role
			const redirectPath = user.role === 'teacher' ? '/teacher' : '/admin'
			navigate(redirectPath)
		} catch (error: any) {
			console.error('Registration error:', error)
			const errorMessage = error?.response?.data?.error || 'Registration failed. Please try again.'
			enqueueSnackbar(errorMessage, { variant: 'error' })
		}
	}

	return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
			<Paper sx={{ p: 4, width: 480 }}>
				<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Create your institution account</Typography>
				<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
					<TextField 
						label="Name" 
						{...register('name')} 
						error={!!errors.name} 
						helperText={errors.name?.message} 
					/>
					<TextField 
						label="Work email" 
						type="email" 
						{...register('email')} 
						error={!!errors.email} 
						helperText={errors.email?.message}
						InputProps={{
							endAdornment: emailChecking ? <CircularProgress size={20} /> : null
						}}
					/>
					<TextField 
						label="Password" 
						type="password" 
						{...register('password')} 
						error={!!errors.password} 
						helperText={errors.password?.message} 
					/>
					<TextField select label="Sign up as" defaultValue="admin" {...register('role')}>
						<MenuItem value="admin">Admin</MenuItem>
						<MenuItem value="teacher">Teacher</MenuItem>
						<MenuItem value="student">Student</MenuItem>
					</TextField>
					<Button 
						type="submit" 
						variant="contained" 
						disabled={isSubmitting || emailExists || emailChecking}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						{isSubmitting ? 'Registering...' : 'Register'}
					</Button>
				</Stack>
			</Paper>
		</Box>
	)
}

export default RegisterPage

