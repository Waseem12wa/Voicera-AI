import { useState } from 'react'
import { Box, Typography, Card, CardContent, Button } from '@mui/material'

const MultilingualFilesTest = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        🌍 Multilingual Learning Materials - Test Page
      </Typography>
      <Card>
        <CardContent>
          <Typography variant="body1">
            This is a test page to verify the routing is working correctly.
          </Typography>
          <Button variant="contained" sx={{ mt: 2 }}>
            Test Button
          </Button>
        </CardContent>
      </Card>
    </Box>
  )
}

export default MultilingualFilesTest
