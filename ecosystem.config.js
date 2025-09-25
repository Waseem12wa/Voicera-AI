module.exports = {
  apps: [
    {
      name: 'voicera-api',
      script: './server/index.js',
      cwd: './server',
      instances: 1,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true
    },
    {
      name: 'voicera-voice',
      script: './voice-service/src/index.js',
      cwd: './voice-service',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/voice-error.log',
      out_file: './logs/voice-out.log',
      log_file: './logs/voice-combined.log',
      time: true
    }
  ]
}
