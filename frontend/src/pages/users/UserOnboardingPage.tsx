import { Box, Button, Paper, Stack, TextField, Typography, List, ListItem, ListItemText, Divider, MenuItem } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { bulkCreateUsers, createUser, listUsers } from '../../services/userService'

type UserForm = {
	name: string
	email: string
	role: 'teacher' | 'student' | 'institution_admin'
}

const roles = ['teacher','student','institution_admin'] as const

const UserOnboardingPage = () => {
	const { register, handleSubmit, reset } = useForm<UserForm>()
	const qc = useQueryClient()

	const { data: users } = useQuery({ queryKey: ['users'], queryFn: listUsers })

	const createMutation = useMutation({
		mutationFn: (v: UserForm) => createUser(v),
		onSuccess: async () => {
			enqueueSnackbar('User created', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['users'] })
			reset({ name: '', email: '', role: 'teacher' })
		},
		onError: () => enqueueSnackbar('Failed to create user', { variant: 'error' }),
	})

	const bulkMutation = useMutation({
		mutationFn: (users: Array<{ name: string; email: string; role: string }>) => bulkCreateUsers(users),
		onSuccess: async (r) => {
			enqueueSnackbar(`Bulk uploaded ${r.inserted} users`, { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['users'] })
		},
		onError: () => enqueueSnackbar('Bulk upload failed', { variant: 'error' }),
	})

	const onSubmit = async (values: UserForm) => {
		await createMutation.mutateAsync(values)
	}

	const onBulkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		const text = await file.text()
		const rows = text.split(/\r?\n/).filter(Boolean)
		const users = rows.map((line) => {
			const [name, email, role] = line.split(',').map(s => s.trim())
			return { name, email, role }
		})
		await bulkMutation.mutateAsync(users)
	}

	return (
		<Box sx={{ my: 2 }}>
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>User Onboarding</Typography>
			<Paper sx={{ p: 2, mb: 2 }}>
				<Typography mb={1}>Add a user</Typography>
				<Stack component="form" gap={2} direction={{ xs: 'column', sm: 'row' }} onSubmit={handleSubmit(onSubmit)}>
					<TextField label="Name" {...register('name')} />
					<TextField label="Email" type="email" {...register('email')} />
					<TextField select label="Role" defaultValue="teacher" {...register('role')}>
						{roles.map((r) => (<MenuItem key={r} value={r}>{r}</MenuItem>))}
					</TextField>
						<Button 
							type="submit" 
							variant="contained"
							sx={{ 
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 3,
								py: 1
							}}
						>
							Add
						</Button>
				</Stack>
			</Paper>
			<Paper sx={{ p: 2 }}>
				<Typography mb={1}>Bulk upload</Typography>
				<Stack direction="row" gap={2}>
						<Button 
							variant="outlined" 
							component="label"
							sx={{ 
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 3,
								py: 1
							}}
						>
							Upload CSV
							<input hidden type="file" accept=".csv" onChange={onBulkUpload as any} />
						</Button>
						<Button 
							variant="text"
							sx={{ 
								borderRadius: '50px',
								fontWeight: 'bold',
								px: 3,
								py: 1
							}}
						>
							Download template
						</Button>
				</Stack>
			</Paper>
			<Divider sx={{ my: 2 }} />
			<Typography variant="subtitle1">Users</Typography>
			<List dense>
				{(users || []).map((u: any) => (
					<ListItem key={u._id}><ListItemText primary={`${u.name} • ${u.email}`} secondary={u.role} /></ListItem>
				))}
			</List>
		</Box>
	)
}

export default UserOnboardingPage

