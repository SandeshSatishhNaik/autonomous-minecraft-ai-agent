// Test with timeout - check why bot might not connect
const mineflayer = require('mineflayer');

console.log('[TEST] Creating bot...');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'AI_Agent',
  auth: 'offline',
  hideErrors: true,
  connectTimeout: 30000,
  version: '1.20.4',
});

bot.on('login', () => {
  console.log('[TEST] ✓ Bot logged in!');
});

bot.on('spawn', () => {
  console.log('[TEST] ✓ Bot spawned!');
  console.log('[TEST] Position:', bot.entity.position);
  bot.quit();
});

bot.on('error', (err) => {
  console.error('[TEST] Error:', err.message);
  process.exit(1);
});

bot.on('disconnect', (reason) => {
  console.log('[TEST] Disconnected:', reason);
  process.exit(0);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.log('[TEST] Timeout - no connection');
  bot.quit();
  process.exit(1);
}, 30000);