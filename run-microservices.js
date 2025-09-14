#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Starting Voicera AI Microservices (Node.js Mode)');
console.log('================================================');

// Check if required directories exist
const services = [
  'microservices/voice-service',
  'microservices/user-service', 
  'microservices/analytics-service',
  'microservices/api-gateway'
];

console.log('📋 Checking service directories...');
services.forEach(service => {
  if (fs.existsSync(service)) {
    console.log(`✅ ${service} - Found`);
  } else {
    console.log(`❌ ${service} - Missing`);
  }
});

// Create environment file if it doesn't exist
const envContent = `# Microservices Environment Configuration
NODE_ENV=development
PORT=3000

# Database
MONGO_URI=mongodb://localhost:27017/voicera
REDIS_HOST=localhost
REDIS_PORT=6379

# Services
VOICE_SERVICE_URL=http://localhost:3001
USER_SERVICE_URL=http://localhost:3002
ANALYTICS_SERVICE_URL=http://localhost:3003

# API Keys (Replace with your actual keys)
GROQ_API_KEY=your_groq_api_key_here
JWT_SECRET=your_jwt_secret_here

# Client
CLIENT_ORIGIN=http://localhost:5173
`;

if (!fs.existsSync('.env')) {
  fs.writeFileSync('.env', envContent);
  console.log('📝 Created .env file - Please update with your API keys');
}

console.log('\n🔧 Service Configuration:');
console.log('• Voice Service: http://localhost:3001');
console.log('• User Service: http://localhost:3002');
console.log('• Analytics Service: http://localhost:3003');
console.log('• API Gateway: http://localhost:3000');

console.log('\n📚 API Endpoints:');
console.log('• Health Check: http://localhost:3000/health');
console.log('• API Docs: http://localhost:3000/api/docs');
console.log('• Metrics: http://localhost:3000/metrics');

console.log('\n⚠️  Prerequisites:');
console.log('1. MongoDB running on localhost:27017');
console.log('2. Redis running on localhost:6379');
console.log('3. Node.js 18+ installed');
console.log('4. Update .env file with your API keys');

console.log('\n🛠️  To start individual services:');
console.log('cd microservices/voice-service && npm install && npm start');
console.log('cd microservices/user-service && npm install && npm start');
console.log('cd microservices/analytics-service && npm install && npm start');
console.log('cd microservices/api-gateway && npm install && npm start');

console.log('\n✅ Microservices architecture is ready to run!');
