import { useState, useEffect } from 'react'
import { Box, Typography, Card, CardContent, Button, Alert } from '@mui/material'
import { useSelector } from 'react-redux'
import type { RootState } from '../../store/store'

const MultilingualFilesDebug = () => {
  const [mounted, setMounted] = useState(false)
  const auth = useSelector((s: RootState) => s.auth)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <Typography>Loading...</Typography>
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🌍 Multilingual Files - Debug Page
      </Typography>
      
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Authentication Status
          </Typography>
          <Typography variant="body2">
            Is Authenticated: {auth.isAuthenticated ? 'Yes' : 'No'}
          </Typography>
          <Typography variant="body2">
            User Role: {auth.user?.role || 'None'}
          </Typography>
          <Typography variant="body2">
            User Email: {auth.user?.email || 'None'}
          </Typography>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Route Information
          </Typography>
          <Typography variant="body2">
            Current URL: {window.location.href}
          </Typography>
          <Typography variant="body2">
            Pathname: {window.location.pathname}
          </Typography>
        </CardContent>
      </Card>

      {!auth.isAuthenticated && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          You need to be logged in to access this page. Please log in first.
        </Alert>
      )}

      {auth.isAuthenticated && auth.user?.role !== 'student' && (
        <Alert severity="error" sx={{ mt: 2 }}>
          You need to be logged in as a student to access this page. 
          Current role: {auth.user?.role}
        </Alert>
      )}

      {auth.isAuthenticated && auth.user?.role === 'student' && (
        <Alert severity="success" sx={{ mt: 2 }}>
          ✅ You are logged in as a student. The multilingual files page should work correctly.
        </Alert>
      )}
    </Box>
  )
}

export default MultilingualFilesDebug
