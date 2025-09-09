import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useSelector } from 'react-redux'
import type { RootState } from '../store/store'

type ProtectedRouteProps = {
	roles?: string[]
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
	const location = useLocation()
	const { isAuthenticated, user } = useSelector((s: RootState) => s.auth)

	if (!isAuthenticated) {
		return <Navigate to="/login" state={{ from: location }} replace />
	}

	if (roles && user && !roles.includes(user.role)) {
		return <Navigate to="/" replace />
	}

	return <Outlet />
}

export default ProtectedRoute

