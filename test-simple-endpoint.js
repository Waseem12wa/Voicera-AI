#!/usr/bin/env node

// Test simple endpoint
const BASE_URL = 'http://localhost:4000/api'

async function testSimpleEndpoint() {
  console.log('🧪 Testing Simple Endpoint...\n')
  
  try {
    const response = await fetch(`${BASE_URL}/student/test-submit/123`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-admin-email': 'test@example.com'
      },
      body: JSON.stringify({ test: 'data' })
    })
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Simple endpoint works!')
      console.log('Response:', result)
    } else {
      console.log('❌ Simple endpoint failed:', await response.text())
    }
    
  } catch (error) {
    console.log('❌ Test failed:', error.message)
  }
}

testSimpleEndpoint()
