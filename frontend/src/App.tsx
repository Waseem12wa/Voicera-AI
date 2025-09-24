import { Suspense, lazy } from 'react'
import { useSelector } from 'react-redux'
import type { RootState } from './store/store'
import { Navigate, Route, Routes } from 'react-router-dom'
import { SnackbarProvider } from 'notistack'
import { CustomThemeProvider } from './contexts/ThemeContext'
import LoadingSpinner from './components/feedback/LoadingSpinner'
import ErrorBoundary from './components/feedback/ErrorBoundary'

// Load auth pages eagerly to avoid any lazy-loading edge cases on first render
import LoginPage from './pages/auth/LoginPage.tsx'
import RegisterPage from './pages/auth/RegisterPage.tsx'
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'))
const InstitutionProfilePage = lazy(() => import('./pages/institution/InstitutionProfilePage'))
const ProgramsCoursesPage = lazy(() => import('./pages/courses/ProgramsCoursesPage'))
const UserOnboardingPage = lazy(() => import('./pages/users/UserOnboardingPage'))

// Admin console pages
const AdminConsole = lazy(() => import('./pages/admin/AdminConsole'))
const AnalyticsDashboard = lazy(() => import('./pages/admin/AnalyticsDashboard'))
const LogManagement = lazy(() => import('./pages/admin/LogManagement'))
const RBACManagement = lazy(() => import('./pages/admin/RBACManagement'))
const ContentManagement = lazy(() => import('./pages/admin/ContentManagement'))
const EmailAlertsManagement = lazy(() => import('./pages/admin/EmailAlertsManagement'))
const DeveloperPortal = lazy(() => import('./pages/developer/DeveloperPortal'))

import { ProtectedRoute } from './routes/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
const TeacherDashboard = lazy(() => import('./pages/teacher/TeacherDashboard'))
const EnhancedTeacherDashboard = lazy(() => import('./pages/teacher/EnhancedTeacherDashboard'))
const FileDetailPage = lazy(() => import('./pages/teacher/FileDetailPage'))
const StudentDashboard = lazy(() => import('./pages/student/StudentDashboard'))
const StudentFileView = lazy(() => import('./pages/student/StudentFileView'))
const StudentFileDetailPage = lazy(() => import('./pages/student/StudentFileDetailPage'))

const HomeRouter = () => {
  const auth = useSelector((s: RootState) => s.auth)
  if (!auth.isAuthenticated) return <Navigate to="/register" replace />
  const role = auth.user?.role
  if (role === 'teacher') return <Navigate to="/teacher" replace />
  if (role === 'student') return <Navigate to="/student" replace />
  return <Navigate to="/admin" replace />
}

function App() {
  return (
    <CustomThemeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        dense
        preventDuplicate
      >
        <Suspense fallback={<LoadingSpinner fullScreen message="Loading application..." />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/" element={<HomeRouter />} />
            <Route element={<ProtectedRoute roles={["admin", "institution_admin"]} />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/admin/console" element={
                  <ErrorBoundary>
                    <AdminConsole />
                  </ErrorBoundary>
                } />
                <Route path="/admin/analytics" element={<AnalyticsDashboard />} />
                <Route path="/admin/logs" element={<LogManagement />} />
                <Route path="/admin/rbac" element={<RBACManagement />} />
                <Route path="/admin/content" element={<ContentManagement />} />
                <Route path="/admin/alerts" element={
                  <ErrorBoundary>
                    <EmailAlertsManagement />
                  </ErrorBoundary>
                } />
                <Route path="/developer" element={<DeveloperPortal />} />
                <Route path="/institution" element={<InstitutionProfilePage />} />
                <Route path="/programs" element={<ProgramsCoursesPage />} />
                <Route path="/users" element={<UserOnboardingPage />} />
              </Route>
            </Route>
            <Route element={<ProtectedRoute roles={["teacher"]} />}>
              <Route path="/teacher" element={<EnhancedTeacherDashboard />} />
              <Route path="/teacher/dashboard" element={<EnhancedTeacherDashboard />} />
              <Route path="/teacher/file/:fileId" element={<FileDetailPage />} />
              <Route path="/teacher/legacy" element={<TeacherDashboard />} />
            </Route>
            <Route element={<ProtectedRoute roles={["student"]} />}>
              <Route path="/student" element={<StudentDashboard />} />
              <Route path="/student/files" element={<StudentFileView />} />
              <Route path="/student/file/:fileId" element={<StudentFileDetailPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </SnackbarProvider>
    </CustomThemeProvider>
  )
}

export default App
