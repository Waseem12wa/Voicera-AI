import { Box, Button, Paper, Stack, Tab, Tabs, Typography, List, ListItem, ListItemText, Divider } from '@mui/material'
import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveAIResponse, createAIResponse, getTeacherAnalytics, listAIResponses, listMaterials, uploadMaterials } from '../../services/teacherService'
import { enqueueSnackbar } from 'notistack'

const TeacherDashboard = () => {
	const [tab, setTab] = useState(0)
	const qc = useQueryClient()

	const { data: materials } = useQuery({ queryKey: ['teacher','materials'], queryFn: listMaterials })
	const { data: responses } = useQuery({ queryKey: ['teacher','responses'], queryFn: listAIResponses })
	const { data: analytics } = useQuery({ queryKey: ['teacher','analytics'], queryFn: getTeacherAnalytics })

	const uploadMutation = useMutation({
		mutationFn: (files: File[]) => uploadMaterials(files),
		onSuccess: async () => {
			enqueueSnackbar('Files uploaded', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher','materials'] })
		},
		onError: () => enqueueSnackbar('Upload failed', { variant: 'error' }),
	})

	const approveMutation = useMutation({
		mutationFn: (id: string) => approveAIResponse(id),
		onSuccess: async () => {
			enqueueSnackbar('Approved', { variant: 'success' })
			await qc.invalidateQueries({ queryKey: ['teacher','responses'] })
		},
	})

	return (
		<Box sx={{ my: 2 }}>
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Teacher Dashboard</Typography>
			<Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ mb: 2 }}>
				<Tab label="Uploads" />
				<Tab label="AI Responses" />
				<Tab label="Analytics" />
			</Tabs>

			{tab === 0 && (
				<Paper sx={{ p: 2 }}>
					<Stack direction="row" spacing={2} alignItems="center">
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
							Upload files
							<input hidden multiple type="file" accept=".pdf,.ppt,.pptx,.doc,.docx" onChange={async (e) => {
								const files = Array.from(e.target.files || [])
								if (files.length) await uploadMutation.mutateAsync(files)
							}} />
						</Button>
					</Stack>
					<Divider sx={{ my: 2 }} />
					<List dense>
						{(materials || []).map((m: any) => (
							<ListItem key={m._id}><ListItemText primary={m.originalName} secondary={`${m.status} • ${m.tags?.join(', ') || ''}`} /></ListItem>
						))}
					</List>
				</Paper>
			)}

			{tab === 1 && (
				<Paper sx={{ p: 2 }}>
					<List dense>
						{(responses || []).map((r: any) => (
							<ListItem key={r._id} secondaryAction={!r.approved && (
								<Button 
									onClick={() => approveMutation.mutateAsync(r._id)}
									sx={{ 
										borderRadius: '50px',
										fontWeight: 'bold',
										px: 3,
										py: 1
									}}
								>
									Approve
								</Button>
							)}>
								<ListItemText primary={r.question} secondary={`${r.source} • ${r.approved ? 'approved' : 'pending'}`} />
							</ListItem>
						))}
					</List>
				</Paper>
			)}

			{tab === 2 && (
				<Paper sx={{ p: 2 }}>
					<Typography>Total uploads: {analytics?.totalUploads ?? 0}</Typography>
					<Typography>Total responses: {analytics?.totalResponses ?? 0}</Typography>
					<Typography>Approved responses: {analytics?.approvedResponses ?? 0}</Typography>
					<Typography>Participation index: {analytics?.participationIndex ?? 0}</Typography>
				</Paper>
			)}
		</Box>
	)
}

export default TeacherDashboard

