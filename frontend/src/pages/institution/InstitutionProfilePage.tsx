import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Box, Button, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { useQuery, useMutation } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { getMyInstitution, updateMyInstitution } from '../../services/institutionService'

const schema = z.object({
	name: z.string().min(2),
	logoUrl: z.string().url().optional().or(z.literal('')),
	address: z.string().min(5),
	institutionType: z.enum(['University', 'College', 'School', 'Institute']),
	contactEmail: z.string().email(),
	contactPhone: z.string().min(7),
})

type FormValues = z.infer<typeof schema>

const InstitutionProfilePage = () => {
	const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
		resolver: zodResolver(schema),
	})

	const { data, isLoading } = useQuery({
		queryKey: ['institution','me'],
		queryFn: getMyInstitution,
	})

	const mutation = useMutation({
		mutationFn: updateMyInstitution,
		onSuccess: () => enqueueSnackbar('Profile saved', { variant: 'success' }),
		onError: () => enqueueSnackbar('Failed to save profile', { variant: 'error' }),
	})

	const onSubmit = async (values: FormValues) => {
		await mutation.mutateAsync(values)
	}

	return (
		<Box sx={{ my: 2 }}>
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Institution Profile</Typography>
			<Paper sx={{ p: 3 }}>
				<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
					<Stack gap={2}>
						<Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
							<TextField label="Institution name" fullWidth defaultValue={data?.name ?? ''} {...register('name')} error={!!errors.name} helperText={errors.name?.message} />
							<TextField label="Logo URL" fullWidth defaultValue={data?.logoUrl ?? ''} {...register('logoUrl')} error={!!errors.logoUrl} helperText={errors.logoUrl?.message} />
						</Stack>
						<TextField label="Complete address" fullWidth defaultValue={data?.address ?? ''} {...register('address')} error={!!errors.address} helperText={errors.address?.message} />
						<Stack direction={{ xs: 'column', md: 'row' }} gap={2}>
							<TextField select label="Institution type" fullWidth defaultValue={data?.institutionType ?? 'University'} {...register('institutionType')} error={!!errors.institutionType} helperText={errors.institutionType?.message}>
								{['University','College','School','Institute'].map((t) => (
									<MenuItem key={t} value={t}>{t}</MenuItem>
								))}
							</TextField>
							<TextField label="Contact email" fullWidth defaultValue={data?.contactEmail ?? ''} {...register('contactEmail')} error={!!errors.contactEmail} helperText={errors.contactEmail?.message} />
							<TextField label="Contact phone" fullWidth defaultValue={data?.contactPhone ?? ''} {...register('contactPhone')} error={!!errors.contactPhone} helperText={errors.contactPhone?.message} />
						</Stack>
					</Stack>
					<Box>
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
							Save Profile
						</Button>
					</Box>
				</Stack>
			</Paper>
		</Box>
	)
}

export default InstitutionProfilePage

