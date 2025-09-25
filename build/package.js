const pkg = require('pkg');
const fs = require('fs');
const path = require('path');

// Build executables for different platforms
const platforms = [
  'node18-win-x64',
  'node18-linux-x64',
  'node18-macos-x64'
];

async function buildExecutables() {
  for (const platform of platforms) {
    console.log(`Building for ${platform}...`);
    
    await pkg.exec([
      'server/index.js',
      '--target', platform,
      '--output', `dist/voicera-server-${platform}.exe`,
      '--options', '--experimental-modules'
    ]);

    await pkg.exec([
      'microservices/voice-service/src/index.js',
      '--target', platform,
      '--output', `dist/voicera-voice-${platform}.exe`,
      '--options', '--experimental-modules'
    ]);
  }
  
  console.log('Executables built successfully!');
}

buildExecutables().catch(console.error);
