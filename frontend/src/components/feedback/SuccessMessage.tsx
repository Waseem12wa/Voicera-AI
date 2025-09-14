import React, { useEffect } from 'react'
import { Alert, AlertTitle, IconButton, Box } from '@mui/material'
import { CheckCircle as SuccessIcon, Close as CloseIcon } from '@mui/icons-material'

interface SuccessMessageProps {
  message: string
  title?: string
  onClose?: () => void
  autoHide?: boolean
  autoHideDuration?: number
  fullWidth?: boolean
}

const SuccessMessage: React.FC<SuccessMessageProps> = ({
  message,
  title = 'Success',
  onClose,
  autoHide = false,
  autoHideDuration = 5000,
  fullWidth = false,
}) => {
  useEffect(() => {
    if (autoHide && onClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoHideDuration)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDuration, onClose])

  return (
    <Box sx={{ width: fullWidth ? '100%' : 'auto' }}>
      <Alert
        severity="success"
        icon={<SuccessIcon />}
        action={
          onClose && (
            <IconButton
              aria-label="Close success message"
              color="inherit"
              size="small"
              onClick={onClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
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

export default SuccessMessage