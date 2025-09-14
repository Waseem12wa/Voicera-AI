import React from 'react'
import { Box, CircularProgress, Typography, Backdrop } from '@mui/material'

interface LoadingSpinnerProps {
  fullScreen?: boolean
  message?: string
  size?: number
  color?: 'primary' | 'secondary' | 'inherit'
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  fullScreen = false,
  message = 'Loading...',
  size = 40,
  color = 'primary',
}) => {
  const spinner = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        p: 3,
      }}
    >
      <CircularProgress size={size} color={color} />
      {message && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  )

  if (fullScreen) {
    return (
      <Backdrop
        open={true}
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
        }}
      >
        {spinner}
      </Backdrop>
    )
  }

  return spinner
}

export default LoadingSpinner