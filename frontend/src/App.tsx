import { Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from './store/store'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Box, CircularProgress } from '@mui/material'

// Load auth pages eagerly to avoid any lazy-loading edge cases on first render
import LoginPage from './pages/auth/LoginPage.tsx'
import RegisterPage from './pages/auth/RegisterPage.tsx'
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const InstitutionProfilePage = lazy(() => import('./pages/institution/InstitutionProfilePage'))
const ProgramsCoursesPage = lazy(() => import('./pages/courses/ProgramsCoursesPage'))
const UserOnboardingPage = lazy(() => import('./pages/users/UserOnboardingPage'))

import { ProtectedRoute } from './routes/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const EnhancedTeacherDashboard = lazy(() => import('./pages/teacher/EnhancedTeacherDashboard'))
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const HomeRouter = () => {
  const auth = useSelector((s: RootState) => s.auth)
  if (!auth.isAuthenticated) return <Navigate to="/login" replace />
  const role = auth.user?.role
  if (role === 'teacher') return <Navigate to="/teacher" replace />
  if (role === 'student') return <Navigate to="/student" replace />
  return <Navigate to="/admin" replace />
}

function App() {
  return (
    <Suspense fallback={<Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh"><CircularProgress /></Box>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<HomeRouter />} />
        <Route element={<ProtectedRoute roles={["admin", "institution_admin"]} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<DashboardPage />} />
            <Route path="/institution" element={<InstitutionProfilePage />} />
            <Route path="/programs" element={<ProgramsCoursesPage />} />
            <Route path="/users" element={<UserOnboardingPage />} />
          </Route>
        </Route>
        <Route element={<ProtectedRoute roles={["teacher"]} />}>
          <Route path="/teacher" element={<EnhancedTeacherDashboard />} />
          <Route path="/teacher/legacy" element={<TeacherDashboard />} />
        </Route>
        <Route element={<ProtectedRoute roles={["student"]} />}>
          <Route path="/student" element={<StudentDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App
