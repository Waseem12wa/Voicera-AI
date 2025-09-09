import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { loginSuccess } from '../../features/auth/authSlice'
import api from '../../services/apiClient'

const schema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
})

type FormValues = z.infer<typeof schema>

const LoginPage = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const location = useLocation() as any
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema),
	})

	const onSubmit = async (values: FormValues) => {
		const { data } = await api.post('/login', values)
		dispatch(loginSuccess({ token: data.token, user: data.user }))
		const role = data.user.role
		const defaultRoute = role === 'teacher' ? '/teacher' : '/admin'
		const redirectTo = location.state?.from?.pathname || defaultRoute
		navigate(redirectTo, { replace: true })
	}

	return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
			<Paper sx={{ p: 4, width: 400 }}>
				<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Sign in</Typography>
				<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
					<TextField label="Email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
					<TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
					<Button 
						type="submit" 
						variant="contained" 
						disabled={isSubmitting}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						Login
					</Button>
				</Stack>
			</Paper>
		</Box>
	)
}

export default LoginPage

