@echo off
set GROQ_API_KEY=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
set PORT=3001
set MONGO_URI=mongodb://localhost:27017/voicera_voice
set REDIS_HOST=localhost
set REDIS_PORT=6379
node src/index.js
