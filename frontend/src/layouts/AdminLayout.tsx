import { Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import EnhancedAppBar from '../components/navigation/EnhancedAppBar'

const AdminLayout = () => {
	return (
		<Box
			sx={{
				minHeight: '100vh',
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<EnhancedAppBar />
			<Box
				component="main"
				sx={{
					flex: 1,
					py: { xs: 2, sm: 3 },
					px: { xs: 2, sm: 3, md: 4 },
					maxWidth: '100%',
					mx: 'auto',
					width: '100%',
				}}
				role="main"
				aria-label="Main content"
			>
				<Outlet />
			</Box>
		</Box>
	)
}

export default AdminLayout

