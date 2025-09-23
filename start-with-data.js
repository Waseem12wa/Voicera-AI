#!/usr/bin/env node

import { spawn } from 'child_process'

// Using built-in fetch (Node.js 18+)

console.log('🚀 Starting Voicera AI with Student Management...\n')

// Start the server
console.log('📡 Starting server...')
const server = spawn('node', ['server/index.js'], {
  stdio: 'pipe',
  cwd: process.cwd()
})

server.stdout.on('data', (data) => {
  const output = data.toString()
  console.log(output)
  
  // Check if server is ready
  if (output.includes('API listening on http://localhost:4000')) {
    console.log('\n✅ Server is ready!')
    console.log('🎯 Testing Student Management API...\n')
    
    // Wait a moment for server to fully initialize
    setTimeout(async () => {
      try {
        // Test the API
        const response = await fetch('http://localhost:4000/api/teacher/students/registered', {
          headers: { 'x-admin-email': 'sarah.johnson@stanford.edu' }
        })
        
        if (response.ok) {
          const students = await response.json()
          console.log(`📊 Found ${students.length} registered students`)
          
          if (students.length > 0) {
            console.log('👥 Sample students:')
            students.slice(0, 3).forEach(student => {
              console.log(`   - ${student.name} (${student.email})`)
            })
          }
          
          console.log('\n🎉 Student Management System is ready!')
          console.log('\n📋 Next Steps:')
          console.log('1. Open http://localhost:5173 in your browser')
          console.log('2. Login as a teacher (e.g., sarah.johnson@stanford.edu)')
          console.log('3. Go to Enhanced Teacher Dashboard → Student Management tab')
          console.log('4. Assign quizzes to students')
          console.log('5. Login as a student to see assigned quizzes')
          console.log('\n💡 The system now shows only assigned quizzes to students!')
        } else {
          console.log('❌ API test failed:', await response.text())
        }
      } catch (error) {
        console.log('❌ Error testing API:', error.message)
      }
    }, 2000)
  }
})

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString())
})

server.on('close', (code) => {
  console.log(`Server exited with code ${code}`)
})

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...')
  server.kill('SIGINT')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...')
  server.kill('SIGTERM')
  process.exit(0)
})
