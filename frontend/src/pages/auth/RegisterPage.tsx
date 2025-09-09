import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, Paper, Stack, TextField, Typography, MenuItem } from '@mui/material'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { enqueueSnackbar } from 'notistack'
import { registerAdmin } from '../../services/userService'
import { loginSuccess } from '../../features/auth/authSlice'

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
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema),
		defaultValues: { role: 'admin', name: '', email: '', password: '' },
	})

	const onSubmit = async (values: FormValues) => {
		const { token, user } = await registerAdmin(values as any)
		dispatch(loginSuccess({ token, user }))
		enqueueSnackbar('Registration successful', { variant: 'success' })
		navigate('/')
	}

	return (
		<Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
			<Paper sx={{ p: 4, width: 480 }}>
				<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Create your institution account</Typography>
				<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
					<TextField label="Name" {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
					<TextField label="Work email" type="email" {...register('email')} error={!!errors.email} helperText={errors.email?.message} />
					<TextField label="Password" type="password" {...register('password')} error={!!errors.password} helperText={errors.password?.message} />
					<TextField select label="Sign up as" defaultValue="admin" {...register('role')}>
						<MenuItem value="admin">Admin</MenuItem>
						<MenuItem value="teacher">Teacher</MenuItem>
						<MenuItem value="student">Student</MenuItem>
					</TextField>
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
						Register
					</Button>
				</Stack>
			</Paper>
		</Box>
	)
}

export default RegisterPage

