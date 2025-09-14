import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Box, Typography, Button, Paper } from '@mui/material'
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Paper
          elevation={2}
          sx={{
            p: 4,
            m: 2,
            textAlign: 'center',
            borderRadius: 2,
          }}
        >
          <Box sx={{ mb: 2 }}>
            <ErrorIcon sx={{ fontSize: 48, color: 'error.main' }} />
          </Box>
          
          <Typography variant="h5" gutterBottom>
            Something went wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Typography>
          
          <Button
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={this.handleReset}
          >
            Try Again
          </Button>
        </Paper>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
