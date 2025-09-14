import React from 'react'
import { Box, Typography } from '@mui/material'

const TestComponent: React.FC = () => {
  console.log('TestComponent rendering')
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        backgroundColor: '#f0f0f0',
      }}
    >
      <Typography variant="h2" color="primary">
        Test Component - App is Working!
      </Typography>
    </Box>
  )
}

export default TestComponent
