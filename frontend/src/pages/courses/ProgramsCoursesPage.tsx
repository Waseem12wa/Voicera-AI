import { Box, Button, Paper, Stack, TextField, Typography, List, ListItem, ListItemText, Divider } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { enqueueSnackbar } from 'notistack'
import { createCourse, createProgram, listCourses, listPrograms } from '../../services/programService'

type ProgramForm = {
	programName: string
	courseName: string
}

const ProgramsCoursesPage = () => {
	const { register, handleSubmit, reset } = useForm<ProgramForm>()
	const qc = useQueryClient()

	const { data: programs } = useQuery({ queryKey: ['programs'], queryFn: listPrograms })
	const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: listCourses })

	const programMutation = useMutation({
		mutationFn: ({ programName }: ProgramForm) => createProgram(programName),
		onSuccess: async () => {
			enqueueSnackbar('Program created', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['programs'] })
			reset({ programName: '', courseName: '' })
		},
		onError: () => enqueueSnackbar('Failed to create program', { variant: 'error' }),
	})

	const courseMutation = useMutation({
		mutationFn: ({ courseName }: ProgramForm) => createCourse(courseName),
		onSuccess: async () => {
			enqueueSnackbar('Course created', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['courses'] })
			reset({ programName: '', courseName: '' })
		},
		onError: () => enqueueSnackbar('Failed to create course', { variant: 'error' }),
	})

	const onSubmit = async (values: ProgramForm) => {
		if (values.programName) await programMutation.mutateAsync(values)
		if (values.courseName) await courseMutation.mutateAsync(values)
	}

	return (
		<Box sx={{ my: 2 }}>
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Programs & Courses</Typography>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography mb={1}>Create Program</Typography>
					<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
						<TextField label="Program name (e.g., BSc Computer Science)" {...register('programName')} />
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
							Save Program
						</Button>
					</Stack>
					<Divider sx={{ my: 2 }} />
					<Typography variant="subtitle1">Existing Programs</Typography>
					<List dense>
						{(programs || []).map((p: any) => (
							<ListItem key={p._id}><ListItemText primary={p.name} /></ListItem>
						))}
					</List>
				</Paper>
				<Paper sx={{ p: 2, flex: 1 }}>
					<Typography mb={1}>Create Course</Typography>
					<Stack component="form" gap={2} onSubmit={handleSubmit(onSubmit)}>
						<TextField label="Course name (e.g., Data Structures)" {...register('courseName')} />
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
							Save Course
						</Button>
					</Stack>
					<Divider sx={{ my: 2 }} />
					<Typography variant="subtitle1">Existing Courses</Typography>
					<List dense>
						{(courses || []).map((c: any) => (
							<ListItem key={c._id}><ListItemText primary={c.name} /></ListItem>
						))}
					</List>
				</Paper>
			</Stack>
		</Box>
	)
}

export default ProgramsCoursesPage

