import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Paper, Stack, TextField, Typography, Container, Link as MuiLink } from '@mui/material'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../features/auth/authSlice'
import { enqueueSnackbar } from 'notistack'
import api from '../../services/apiClient'
import LoadingSpinner from '../../components/feedback/LoadingSpinner'
import ErrorMessage from '../../components/feedback/ErrorMessage'

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

const LoginPage = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation() as any
	const [loginError, setLoginError] = useState<string | null>(null)
	
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema),
	})

	const onSubmit = async (values: FormValues) => {
		setLoginError(null)
		try {
			const { data } = await api.post('/login', values)
			
			// Save credentials to localStorage for future login
			localStorage.setItem('token', data.token)
			localStorage.setItem('user', JSON.stringify(data.user))
			
			dispatch(loginSuccess({ token: data.token, user: data.user }))
			
			const role = data.user.role
			const defaultRoute = role === 'teacher' ? '/teacher' : '/admin'
			const redirectTo = location.state?.from?.pathname || defaultRoute
			
			enqueueSnackbar(`Welcome back, ${data.user.name}!`, { variant: 'success' })
			navigate(redirectTo, { replace: true })
		} catch (error: any) {
			console.error('Login error:', error)
			const errorMessage = error?.response?.data?.error || 'Login failed. Please check your credentials.'
			setLoginError(errorMessage)
			enqueueSnackbar(errorMessage, { variant: 'error' })
		}
	}

	const handleRetry = () => {
		setLoginError(null)
	}

	return (
		<Container
			maxWidth="sm"
			sx={{
				minHeight: '100vh',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				py: 4,
			}}
		>
			<Paper
				sx={{
					p: { xs: 3, sm: 4, md: 5 },
					width: '100%',
					maxWidth: 400,
					boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
				}}
				elevation={3}
			>
				<Box
					component="header"
					sx={{ mb: 4, textAlign: 'center' }}
				>
					<Typography
						variant="h4"
						component="h1"
						sx={{
							fontWeight: 700,
							mb: 1,
							fontSize: { xs: '1.75rem', sm: '2rem' },
						}}
					>
						Sign In
					</Typography>
					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
					>
						Welcome back! Please sign in to your account.
					</Typography>
				</Box>

				{loginError && (
					<Box sx={{ mb: 3 }}>
						<ErrorMessage
							message={loginError}
							onRetry={handleRetry}
							retryLabel="Try Again"
							fullWidth
						/>
					</Box>
				)}

				<Box
					component="form"
					onSubmit={handleSubmit(onSubmit)}
					role="form"
					aria-label="Login form"
					noValidate
				>
					<Stack spacing={3}>
						<TextField
							{...register('email')}
							label="Email Address"
							type="email"
							autoComplete="email"
							required
							fullWidth
							error={!!errors.email}
							helperText={errors.email?.message}
							aria-invalid={!!errors.email}
							aria-describedby={errors.email ? 'email-error' : undefined}
							sx={{
								'& .MuiOutlinedInput-root': {
									fontSize: { xs: '0.875rem', sm: '1rem' },
								},
							}}
						/>

						<TextField
							{...register('password')}
							label="Password"
							type="password"
							autoComplete="current-password"
							required
							fullWidth
							error={!!errors.password}
							helperText={errors.password?.message}
							aria-invalid={!!errors.password}
							aria-describedby={errors.password ? 'password-error' : undefined}
							sx={{
								'& .MuiOutlinedInput-root': {
									fontSize: { xs: '0.875rem', sm: '1rem' },
								},
							}}
						/>

					<Button 
						type="submit" 
						variant="contained" 
							size="large"
							fullWidth
						disabled={isSubmitting}
							aria-busy={isSubmitting}
							aria-live={isSubmitting ? 'polite' : 'off'}
						sx={{ 
								py: 1.5,
								fontSize: { xs: '0.875rem', sm: '1rem' },
								fontWeight: 600,
								textTransform: 'none',
							}}
						>
							{isSubmitting ? (
								<LoadingSpinner size={20} message="" />
							) : (
								'Sign In'
							)}
					</Button>
				</Stack>
				</Box>

				<Box
					sx={{
						mt: 4,
						textAlign: 'center',
					}}
				>
					<Typography variant="body2" color="text.secondary">
						Don't have an account?{' '}
						<MuiLink
							component={Link}
							to="/register"
							sx={{
								fontWeight: 600,
								textDecoration: 'none',
								'&:hover': {
									textDecoration: 'underline',
								},
							}}
						>
							Sign up here
						</MuiLink>
					</Typography>
				</Box>
			</Paper>
		</Container>
	)
}

export default LoginPage

