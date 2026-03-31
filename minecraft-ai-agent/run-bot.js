// Run bot with brain integration - Background wrapper
const { spawn } = require('child_process');
const path = require('path');

console.log('[WRAPPER] Starting AI Agent bot...');

const botProcess = spawn('node', ['src/index.js'], {
  cwd: __dirname,
  stdio: 'inherit',
  detached: true,
  shell: true
});

botProcess.on('error', (err) => {
  console.error('[WRAPPER] Failed to start:', err.message);
});

botProcess.on('exit', (code) => {
  console.log(`[WRAPPER] Bot exited with code ${code}`);
});

console.log(`[WRAPPER] Bot started with PID: ${botProcess.pid}`);
console.log('[WRAPPER] Check the bot window for output');