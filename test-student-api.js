#!/usr/bin/env node

// Using built-in fetch (Node.js 18+)

const BASE_URL = 'http://localhost:4000/api'

// Test data
const testTeacherEmail = 'sarah.johnson@stanford.edu'
const testStudentEmail = 'i2k@nu.edu.pk'

async function testAPI() {
  console.log('🧪 Testing Student Management API...\n')
  
  try {
    // Test 1: Get registered students
    console.log('1️⃣ Testing GET /teacher/students/registered')
    const registeredResponse = await fetch(`${BASE_URL}/teacher/students/registered`, {
      headers: { 'x-admin-email': testTeacherEmail }
    })
    const registeredStudents = await registeredResponse.json()
    console.log(`✅ Found ${registeredStudents.length} registered students`)
    console.log(`   Sample: ${registeredStudents[0]?.name} (${registeredStudents[0]?.email})`)
    
    // Test 2: Get active students
    console.log('\n2️⃣ Testing GET /teacher/students/active')
    const activeResponse = await fetch(`${BASE_URL}/teacher/students/active`, {
      headers: { 'x-admin-email': testTeacherEmail }
    })
    const activeStudents = await activeResponse.json()
    console.log(`✅ Found ${activeStudents.length} active students`)
    if (activeStudents.length > 0) {
      console.log(`   Sample: ${activeStudents[0]?.name} (${activeStudents[0]?.email})`)
    }
    
    // Test 3: Get student notifications
    console.log('\n3️⃣ Testing GET /student/notifications')
    const notificationsResponse = await fetch(`${BASE_URL}/student/notifications`, {
      headers: { 'x-admin-email': testStudentEmail }
    })
    const notifications = await notificationsResponse.json()
    console.log(`✅ Found ${notifications.length} notifications`)
    if (notifications.length > 0) {
      console.log(`   Sample: ${notifications[0]?.title} - ${notifications[0]?.message}`)
    }
    
    // Test 3.5: Get assigned quizzes for student
    console.log('\n3️⃣.5️⃣ Testing GET /student/assigned-quizzes')
    const assignedQuizzesResponse = await fetch(`${BASE_URL}/student/assigned-quizzes`, {
      headers: { 'x-admin-email': testStudentEmail }
    })
    const assignedQuizzes = await assignedQuizzesResponse.json()
    console.log(`✅ Found ${assignedQuizzes.length} assigned quizzes`)
    if (assignedQuizzes.length > 0) {
      console.log(`   Sample: ${assignedQuizzes[0]?.title} (Status: ${assignedQuizzes[0]?.status})`)
    }
    
    // Test 4: Get assigned quizzes
    console.log('\n4️⃣ Testing GET /teacher/assigned-quizzes')
    const assignedResponse = await fetch(`${BASE_URL}/teacher/assigned-quizzes`, {
      headers: { 'x-admin-email': testTeacherEmail }
    })
    const teacherAssignedQuizzes = await assignedResponse.json()
    console.log(`✅ Found ${teacherAssignedQuizzes.length} assigned quizzes`)
    if (teacherAssignedQuizzes.length > 0) {
      console.log(`   Sample: ${teacherAssignedQuizzes[0]?.quizId?.title}`)
    }
    
    // Test 5: Get quizzes for assignment
    console.log('\n5️⃣ Testing GET /teacher/quizzes')
    const quizzesResponse = await fetch(`${BASE_URL}/teacher/quizzes`, {
      headers: { 'x-admin-email': testTeacherEmail }
    })
    const quizzes = await quizzesResponse.json()
    console.log(`✅ Found ${quizzes.length} quizzes available for assignment`)
    
    if (quizzes.length > 0 && registeredStudents.length > 0) {
      // Test 6: Assign quiz to students
      console.log('\n6️⃣ Testing POST /teacher/assign-quiz-multiple')
      const quizToAssign = quizzes[0]
      const studentsToAssign = registeredStudents.slice(0, 2).map(s => s._id)
      
      const assignResponse = await fetch(`${BASE_URL}/teacher/assign-quiz-multiple`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': testTeacherEmail
        },
        body: JSON.stringify({
          quizId: quizToAssign._id,
          studentIds: studentsToAssign
        })
      })
      
      if (assignResponse.ok) {
        const assignResult = await assignResponse.json()
        console.log(`✅ Successfully assigned quiz "${quizToAssign.title}" to ${assignResult.students} students`)
        console.log(`   Created ${assignResult.notifications} notifications`)
      } else {
        const error = await assignResponse.json()
        console.log(`❌ Assignment failed: ${error.error}`)
      }
    }
    
    console.log('\n🎉 All API tests completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

// Run tests
testAPI()
