import { Box, Paper, Stack, Typography } from '@mui/material'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const data = [
	{ name: 'Week 1', enrollments: 20 },
	{ name: 'Week 2', enrollments: 35 },
	{ name: 'Week 3', enrollments: 40 },
	{ name: 'Week 4', enrollments: 55 },
]

const DashboardPage = () => {
	return (
		<Box sx={{ my: 2 }}>
			<Typography variant="h5" mb={2} sx={{ textAlign: 'center', fontWeight: 'bold' }}>Admin Dashboard</Typography>
			<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
				<Paper sx={{ p: 2, height: 320, flex: 2 }}>
					<Typography mb={1}>Real-time enrollments</Typography>
					<ResponsiveContainer width="100%" height={260}>
						<LineChart data={data}>
							<CartesianGrid strokeDasharray="3 3" />
							<XAxis dataKey="name" />
							<YAxis />
							<Tooltip />
							<Line type="monotone" dataKey="enrollments" stroke="#006CFF" strokeWidth={2} />
						</LineChart>
					</ResponsiveContainer>
				</Paper>
				<Paper sx={{ p: 2, height: 320, flex: 1 }}>
					<Typography>AI insights (placeholder)</Typography>
				</Paper>
			</Stack>
		</Box>
	)
}

export default DashboardPage

