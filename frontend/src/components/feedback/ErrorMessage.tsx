import React from 'react'
import { Alert, AlertTitle, Button, Box } from '@mui/material'
import { Error as ErrorIcon, Refresh as RefreshIcon } from '@mui/icons-material'

interface ErrorMessageProps {
  message: string
  title?: string
  onRetry?: () => void
  retryLabel?: string
  fullWidth?: boolean
  severity?: 'error' | 'warning' | 'info'
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  title = 'Error',
  onRetry,
  retryLabel = 'Try Again',
  fullWidth = false,
  severity = 'error',
}) => {
  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Alert
        severity={severity}
        icon={<ErrorIcon />}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
              sx={{ fontWeight: 600 }}
            >
              {retryLabel}
            </Button>
          )
        }
        sx={{
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 600 }}>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  )
}

export default ErrorMessage