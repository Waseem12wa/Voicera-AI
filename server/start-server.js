#!/usr/bin/env node

import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🚀 Starting Voicera AI Server...')
console.log('📁 Server directory:', __dirname)

// Check if MongoDB is running
const checkMongoDB = () => {
  return new Promise((resolve) => {
    const mongod = spawn('mongod', ['--version'], { stdio: 'pipe' })
    
    mongod.on('close', (code) => {
      if (code === 0) {
        console.log('✅ MongoDB is available')
        resolve(true)
      } else {
        console.log('❌ MongoDB not found. Please install and start MongoDB.')
        console.log('   Download from: https://www.mongodb.com/try/download/community')
        resolve(false)
      }
    })
    
    mongod.on('error', () => {
      console.log('❌ MongoDB not found. Please install and start MongoDB.')
      console.log('   Download from: https://www.mongodb.com/try/download/community')
      resolve(false)
    })
  })
}

// Start the server
const startServer = async () => {
  const mongoAvailable = await checkMongoDB()
  
  if (!mongoAvailable) {
    console.log('\n🔧 To start MongoDB:')
    console.log('   1. Install MongoDB Community Edition')
    console.log('   2. Start MongoDB service: mongod')
    console.log('   3. Or use MongoDB Atlas cloud database')
    console.log('\n📝 You can also update MONGO_URI in .env file to use a different database')
    process.exit(1)
  }
  
  console.log('\n🌐 Starting server on http://localhost:4000')
  console.log('📊 Database will be automatically seeded with educational data')
  console.log('🔗 Frontend should connect to: http://localhost:5173')
  console.log('\n⏹️  Press Ctrl+C to stop the server\n')
  
  // Start the main server
  const server = spawn('node', ['index.js'], {
    cwd: __dirname,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  })
  
  server.on('close', (code) => {
    console.log(`\n🛑 Server stopped with code ${code}`)
  })
  
  server.on('error', (error) => {
    console.error('❌ Server error:', error)
  })
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...')
    server.kill('SIGINT')
  })
}

startServer().catch(console.error)
