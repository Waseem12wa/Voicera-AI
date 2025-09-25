const JavaScriptObfuscator = require('javascript-obfuscator');
const fs = require('fs');
const path = require('path');

// Obfuscate frontend code
function obfuscateFrontend() {
  const frontendFiles = [
    'frontend/src/services/translationService.ts',
    'frontend/src/services/multilingualService.ts',
    'frontend/src/components/voice/VoiceRecorder.tsx'
  ];

  frontendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const code = fs.readFileSync(file, 'utf8');
      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
      });
      
      fs.writeFileSync(file.replace('.ts', '.obfuscated.js'), obfuscated.getObfuscatedCode());
    }
  });
}

// Obfuscate backend code
function obfuscateBackend() {
  const backendFiles = [
    'server/services/translationService.js',
    'microservices/voice-service/src/services/multilingualProcessor.js',
    'microservices/voice-service/src/services/voiceProcessor.js'
  ];

  backendFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const code = fs.readFileSync(file, 'utf8');
      const obfuscated = JavaScriptObfuscator.obfuscate(code, {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArrayShuffle: true,
        splitStrings: true,
        stringArrayThreshold: 1
      });
      
      fs.writeFileSync(file.replace('.js', '.obfuscated.js'), obfuscated.getObfuscatedCode());
    }
  });
}

module.exports = { obfuscateFrontend, obfuscateBackend };
