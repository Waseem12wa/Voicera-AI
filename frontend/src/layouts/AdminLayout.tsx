import { AppBar, Box, Button, Toolbar, Typography, Stack } from '@mui/material'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { logout } from '../features/auth/authSlice'
import type { RootState } from '../store/store'

const NavLink = ({ to, label }: { to: string; label: string }) => (
	<Button 
		color="inherit" 
		component={Link as any} 
		to={to} 
		sx={{ 
			textTransform: 'none', 
			fontWeight: 'bold',
			borderRadius: '50px',
			px: 3,
			py: 1,
			backgroundColor: 'rgba(255, 255, 255, 0.1)',
			'&:hover': {
				backgroundColor: 'rgba(255, 255, 255, 0.2)',
			}
		}}
	>
		{label}
	</Button>
)

const AdminLayout = () => {
	const dispatch = useDispatch()
	const navigate = useNavigate()
	const user = useSelector((s: RootState) => s.auth.user)

	return (
		<Box>
			<AppBar position="static" color="primary" enableColorOnDark>
				<Toolbar>
					<Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>Voicera Admin</Typography>
					<Stack direction="row" spacing={1}>
						<NavLink to="/" label="Dashboard" />
						<NavLink to="/institution" label="Institution" />
						<NavLink to="/programs" label="Programs & Courses" />
						{(user?.role === 'admin' || user?.role === 'institution_admin') && (
							<NavLink to="/users" label="Users" />
						)}
						{user?.role === 'teacher' && (
							<NavLink to="/teacher" label="Teacher" />
						)}
					</Stack>
					<Box sx={{ ml: 2 }}>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>{user?.name}</Typography>
					</Box>
					<Button 
						color="inherit" 
						variant="outlined" 
						onClick={() => { dispatch(logout()); navigate('/login') }}
						sx={{ 
							borderRadius: '50px',
							fontWeight: 'bold',
							px: 3,
							py: 1
						}}
					>
						Logout
					</Button>
				</Toolbar>
			</AppBar>
			<Box sx={{ py: 2, px: { xs: 2, md: 3 } }}>
				<Outlet />
			</Box>
		</Box>
	)
}

export default AdminLayout

