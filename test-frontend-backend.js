#!/usr/bin/env node

// Test if frontend can connect to backend
const BASE_URL = 'http://localhost:4000/api'
const FRONTEND_URL = 'http://localhost:5173'

async function testConnection() {
  console.log('🔗 Testing Frontend-Backend Connection...\n')
  
  try {
    // Test backend API
    console.log('1️⃣ Testing Backend API...')
    const response = await fetch(`${BASE_URL}/teacher/students/registered`, {
      headers: { 'x-admin-email': 'sarah.johnson@stanford.edu' }
    })
    
    if (response.ok) {
      const students = await response.json()
      console.log(`✅ Backend API working - Found ${students.length} students`)
      
      // Test student assigned quizzes
      const studentEmail = students[0]?.email
      if (studentEmail) {
        console.log(`\n2️⃣ Testing Student API with ${studentEmail}...`)
        const studentResponse = await fetch(`${BASE_URL}/student/assigned-quizzes`, {
          headers: { 'x-admin-email': studentEmail }
        })
        
        if (studentResponse.ok) {
          const quizzes = await studentResponse.json()
          console.log(`✅ Student API working - Found ${quizzes.length} assigned quizzes`)
          
          if (quizzes.length > 0) {
            console.log(`   Sample quiz: ${quizzes[0]?.title}`)
          }
        } else {
          console.log('❌ Student API failed:', await studentResponse.text())
        }
      }
    } else {
      console.log('❌ Backend API failed:', await response.text())
    }
    
    // Test frontend
    console.log('\n3️⃣ Testing Frontend...')
    const frontendResponse = await fetch(FRONTEND_URL)
    
    if (frontendResponse.ok) {
      console.log('✅ Frontend is running')
      console.log('\n🎯 Next Steps:')
      console.log('1. Open http://localhost:5173 in your browser')
      console.log('2. Login as a student (e.g., i2k@nu.edu.pk)')
      console.log('3. Go to Student Dashboard → Quizzes tab')
      console.log('4. You should see assigned quizzes with assignment details')
    } else {
      console.log('❌ Frontend not accessible')
    }
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message)
  }
}

testConnection()
