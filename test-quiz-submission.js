#!/usr/bin/env node

// Test quiz submission with AI grading
const BASE_URL = 'http://localhost:4000/api'

async function testQuizSubmission() {
  console.log('🧪 Testing Quiz Submission with AI Grading...\n')
  
  try {
    // Get assigned quizzes for student
    console.log('1️⃣ Getting assigned quizzes...')
    const quizzesResponse = await fetch(`${BASE_URL}/student/assigned-quizzes`, {
      headers: { 'x-admin-email': 'i2k@nu.edu.pk' }
    })
    
    if (!quizzesResponse.ok) {
      console.log('❌ Failed to get assigned quizzes:', await quizzesResponse.text())
      return
    }
    
    const quizzes = await quizzesResponse.json()
    console.log(`✅ Found ${quizzes.length} assigned quizzes`)
    
    if (quizzes.length === 0) {
      console.log('❌ No quizzes available for testing')
      return
    }
    
    const quiz = quizzes[0]
    console.log(`📝 Testing with quiz: ${quiz.title}`)
    console.log(`   Questions: ${quiz.questions?.length || 0}`)
    
    // Create sample answers (all correct for testing)
    const answers = {}
    if (quiz.questions) {
      quiz.questions.forEach(q => {
        answers[q._id] = q.correctAnswer || 0 // Use correct answer for testing
      })
    }
    
    console.log(`📋 Sample answers:`, answers)
    
    // Submit quiz
    console.log('\n2️⃣ Submitting quiz...')
    const submitResponse = await fetch(`${BASE_URL}/student/quizzes/${quiz._id}/submit`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-email': 'i2k@nu.edu.pk'
      },
      body: JSON.stringify({ answers })
    })
    
    if (!submitResponse.ok) {
      console.log('❌ Quiz submission failed:', await submitResponse.text())
      return
    }
    
    const result = await submitResponse.json()
    console.log('✅ Quiz submitted successfully!')
    console.log('\n📊 Results:')
    console.log(`   Score: ${result.score}%`)
    console.log(`   Status: ${result.status}`)
    console.log(`   Correct Answers: ${result.correctAnswers}/${result.totalQuestions}`)
    console.log(`   Feedback: ${result.feedback}`)
    
    if (result.gradingDetails) {
      console.log('\n📋 Question Details:')
      result.gradingDetails.forEach((detail, index) => {
        console.log(`   Q${index + 1}: ${detail.isCorrect ? '✅' : '❌'} - ${detail.feedback}`)
      })
    }
    
    if (result.suggestions) {
      console.log(`\n💡 Suggestions: ${result.suggestions}`)
    }
    
    console.log('\n🎉 Quiz submission test completed successfully!')
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testQuizSubmission()
