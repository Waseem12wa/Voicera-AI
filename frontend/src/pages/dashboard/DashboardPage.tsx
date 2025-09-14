import { Box, Typography, Card, CardContent, CardHeader, Chip, IconButton, Tooltip } from '@mui/material'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, People, School, Assessment, Refresh, Download } from '@mui/icons-material'

const enrollmentData = [
	{ name: 'Week 1', enrollments: 20, completions: 15 },
	{ name: 'Week 2', enrollments: 35, completions: 28 },
	{ name: 'Week 3', enrollments: 40, completions: 32 },
	{ name: 'Week 4', enrollments: 55, completions: 45 },
]

const courseData = [
	{ name: 'Mathematics', students: 120, color: '#4caf50' },
	{ name: 'Science', students: 95, color: '#2196f3' },
	{ name: 'English', students: 80, color: '#ff9800' },
	{ name: 'History', students: 65, color: '#9c27b0' },
]

const statsData = [
	{ label: 'Total Students', value: '1,234', change: '+12%', trend: 'up', icon: <People /> },
	{ label: 'Active Courses', value: '24', change: '+3', trend: 'up', icon: <School /> },
	{ label: 'Completion Rate', value: '87%', change: '+5%', trend: 'up', icon: <Assessment /> },
	{ label: 'AI Insights', value: '15', change: 'New', trend: 'neutral', icon: <TrendingUp /> },
]

const DashboardPage = () => {

	return (
		<Box
			sx={{
				py: { xs: 2, sm: 3 },
				px: { xs: 1, sm: 2 },
			}}
		>
			{/* Header */}
			<Box
				sx={{
					mb: 4,
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					alignItems: { xs: 'flex-start', sm: 'center' },
					justifyContent: 'space-between',
					gap: 2,
				}}
			>
				<Box>
					<Typography
						variant="h4"
						component="h1"
						sx={{
							fontWeight: 700,
							fontSize: { xs: '1.75rem', sm: '2rem', md: '2.25rem' },
							mb: 1,
						}}
					>
						Admin Dashboard
					</Typography>
					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
					>
						Welcome back! Here's what's happening with your institution.
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 1 }}>
					<Tooltip title="Refresh data">
						<IconButton aria-label="Refresh dashboard data">
							<Refresh />
						</IconButton>
					</Tooltip>
					<Tooltip title="Export data">
						<IconButton aria-label="Export dashboard data">
							<Download />
						</IconButton>
					</Tooltip>
				</Box>
			</Box>

			{/* Stats Cards */}
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
				{statsData.map((stat, index) => (
					<Box key={index} sx={{ flex: '1 1 250px', minWidth: '250px' }}>
						<Card
							sx={{
								height: '100%',
								transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
								'&:hover': {
									transform: 'translateY(-2px)',
									boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
								},
							}}
						>
							<CardContent sx={{ p: 3 }}>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'space-between',
										mb: 2,
									}}
								>
									<Box
										sx={{
											p: 1,
											borderRadius: 2,
											bgcolor: 'primary.light',
											color: 'primary.contrastText',
										}}
									>
										{stat.icon}
									</Box>
									<Chip
										label={stat.change}
										size="small"
										color={stat.trend === 'up' ? 'success' : stat.trend === 'down' ? 'error' : 'default'}
										variant="outlined"
									/>
								</Box>
								<Typography
									variant="h4"
									component="div"
									sx={{
										fontWeight: 700,
										fontSize: { xs: '1.5rem', sm: '1.75rem' },
										mb: 0.5,
									}}
								>
									{stat.value}
								</Typography>
								<Typography
									variant="body2"
									color="text.secondary"
									sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
								>
									{stat.label}
								</Typography>
							</CardContent>
						</Card>
					</Box>
				))}
			</Box>

			{/* Charts Section */}
			<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
				{/* Enrollment Chart */}
				<Box sx={{ flex: '2 1 600px', minWidth: '300px' }}>
					<Card sx={{ height: { xs: 400, sm: 450 } }}>
						<CardHeader
							title="Enrollment Trends"
							subtitle="Weekly enrollment and completion data"
							action={
								<Tooltip title="View detailed analytics">
									<IconButton aria-label="View detailed analytics">
										<Assessment />
									</IconButton>
								</Tooltip>
							}
						/>
						<CardContent sx={{ pt: 0 }}>
							<ResponsiveContainer width="100%" height={300}>
								<LineChart data={enrollmentData} aria-label="Chart data">
							<CartesianGrid strokeDasharray="3 3" />
									<XAxis 
										dataKey="name" 
										tick={{ fontSize: 12 }}
									/>
									<YAxis tick={{ fontSize: 12 }} />
									<RechartsTooltip 
										contentStyle={{
											fontSize: '14px',
											borderRadius: '8px',
										}}
									/>
									<Line 
										type="monotone" 
										dataKey="enrollments" 
										stroke="#2196f3" 
										strokeWidth={3}
										name="Enrollments"
									/>
									<Line 
										type="monotone" 
										dataKey="completions" 
										stroke="#4caf50" 
										strokeWidth={3}
										name="Completions"
									/>
						</LineChart>
					</ResponsiveContainer>
						</CardContent>
					</Card>
				</Box>

				{/* Course Distribution */}
				<Box sx={{ flex: '1 1 300px', minWidth: '300px' }}>
					<Card sx={{ height: { xs: 400, sm: 450 } }}>
						<CardHeader
							title="Course Distribution"
							subtitle="Students by subject"
						/>
						<CardContent sx={{ pt: 0 }}>
							<ResponsiveContainer width="100%" height={300}>
								<PieChart aria-label="Chart data">
									<Pie
										data={courseData}
										cx="50%"
										cy="50%"
										labelLine={false}
										label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
										outerRadius={80}
										fill="#8884d8"
										dataKey="students"
									>
										{courseData.map((entry, index) => (
											<Cell key={`cell-${index}`} fill={entry.color} />
										))}
									</Pie>
									<RechartsTooltip />
								</PieChart>
							</ResponsiveContainer>
						</CardContent>
					</Card>
				</Box>
			</Box>
		</Box>
	)
}

export default DashboardPage

