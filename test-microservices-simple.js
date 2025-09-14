// Simple Microservices Test
// This creates mock services to test the architecture

import express from 'express'
import cors from 'cors'

console.log('🚀 Starting Voicera AI Microservices Test...')
console.log('===============================================')

// Create mock services
const services = [
  { name: 'Voice Service', port: 3001, path: '/api/voice' },
  { name: 'User Service', port: 3002, path: '/api/users' },
  { name: 'Analytics Service', port: 3003, path: '/api/analytics' },
  { name: 'API Gateway', port: 3000, path: '/api' }
]

// Function to create a mock service
function createMockService(name, port, path) {
  const app = express()
  
  app.use(cors())
  app.use(express.json())
  
  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      service: name.toLowerCase().replace(' ', '-'),
      timestamp: new Date().toISOString(),
      port: port
    })
  })
  
  // Metrics
  app.get('/metrics', (req, res) => {
    res.json({
      service: name.toLowerCase().replace(' ', '-'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    })
  })
  
  // Mock API endpoints
  if (name === 'Voice Service') {
    app.post('/api/voice/process', (req, res) => {
      const { command } = req.body
      res.json({
        command,
        response: `I heard: "${command}". This is a mock response.`,
        intent: 'general_query',
        confidence: 0.85,
        timestamp: new Date().toISOString()
      })
    })
  }
  
  if (name === 'User Service') {
    app.get('/api/users', (req, res) => {
      res.json({
        users: [
          { id: '1', name: 'John Doe', email: 'john@example.com', role: 'student' },
          { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'teacher' }
        ]
      })
    })
  }
  
  if (name === 'Analytics Service') {
    app.get('/api/analytics/real-time', (req, res) => {
      res.json({
        activeUsers: 25,
        currentSessions: 15,
        requestsPerMinute: 120,
        errorRate: 0.5,
        timestamp: new Date().toISOString()
      })
    })
  }
  
  if (name === 'API Gateway') {
    app.get('/api/docs', (req, res) => {
      res.json({
        name: 'Voicera AI API Gateway',
        version: '1.0.0',
        services: services.map(s => ({
          name: s.name,
          port: s.port,
          status: 'healthy'
        }))
      })
    })
  }
  
  // Start the service
  app.listen(port, () => {
    console.log(`✅ ${name} running on port ${port}`)
    console.log(`   Health: http://localhost:${port}/health`)
    console.log(`   Metrics: http://localhost:${port}/metrics`)
  })
  
  return app
}

// Start all services
console.log('🔧 Starting mock services...')
services.forEach(service => {
  createMockService(service.name, service.port, service.path)
})

// Wait and test
setTimeout(() => {
  console.log('\n🧪 Testing services...')
  
  const testServices = async () => {
    const tests = [
      { name: 'API Gateway', url: 'http://localhost:3000/health' },
      { name: 'Voice Service', url: 'http://localhost:3001/health' },
      { name: 'User Service', url: 'http://localhost:3002/health' },
      { name: 'Analytics Service', url: 'http://localhost:3003/health' }
    ]
    
    for (const test of tests) {
      try {
        const response = await fetch(test.url)
        if (response.ok) {
          console.log(`✅ ${test.name} - Working`)
        } else {
          console.log(`❌ ${test.name} - Failed (${response.status})`)
        }
      } catch (error) {
        console.log(`❌ ${test.name} - Error: ${error.message}`)
      }
    }
    
    console.log('\n🎉 Microservices Test Complete!')
    console.log('===============================================')
    console.log('📊 Service URLs:')
    console.log('  • API Gateway: http://localhost:3000')
    console.log('  • Voice Service: http://localhost:3001')
    console.log('  • User Service: http://localhost:3002')
    console.log('  • Analytics Service: http://localhost:3003')
    console.log('\n📚 Test Endpoints:')
    console.log('  • Health: http://localhost:3000/health')
    console.log('  • API Docs: http://localhost:3000/api/docs')
    console.log('  • Voice Test: POST http://localhost:3000/api/voice/process')
    console.log('  • Users: http://localhost:3000/api/users')
    console.log('  • Analytics: http://localhost:3000/api/analytics/real-time')
  }
  
  testServices()
}, 2000)

// Keep the process running
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down services...')
  process.exit(0)
})
