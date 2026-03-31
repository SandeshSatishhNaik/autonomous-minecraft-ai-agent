// Test brain with actual bot connection
const mineflayer = require('mineflayer');
const brain = require('./src/intellect/brain');
const scanner = require('./src/perception/scanner');
const events = require('./src/perception/events');
const inventory = require('./src/perception/inventory');

console.log('[TEST] Starting bot with brain integration...\n');

const bot = mineflayer.createBot({
  host: 'localhost',
  port: 25565,
  username: 'AI_Agent_Test',
  auth: 'offline',
  hideErrors: true,
  connectTimeout: 30000,
  version: '1.20.4',
});

bot.on('login', () => {
  console.log('[TEST] ✓ Bot logged in!');
});

bot.on('spawn', async () => {
  console.log('[TEST] ✓ Bot spawned!');
  console.log('[TEST] Position:', bot.entity.position.x.toFixed(1), bot.entity.position.y.toFixed(1), bot.entity.position.z.toFixed(1));
  
  // Initialize perception modules
  scanner.init(bot);
  events.init(bot);
  inventory.init(bot);
  
  // Initialize brain
  brain.init(bot);
  console.log('[TEST] ✓ Brain initialized\n');
  
  // Wait a bit then make a decision
  setTimeout(async () => {
    console.log('[TEST] Requesting LLM decision...');
    try {
      const decision = await brain.think({
        currentGoal: 'Explore and survive'
      });
      
      console.log('\n=== LLM DECISION ===');
      console.log('Think:', decision.think);
      console.log('Decision:', decision.decision);
      console.log('Action:', decision.action);
      console.log('Target:', decision.target);
      console.log('Priority:', decision.priority);
      console.log('Reasoning:', decision.reasoning);
      console.log('===================\n');
      
      // Execute if high priority
      if (decision.priority <= 2 && decision.action === 'chat') {
        bot.chat(decision.target);
        console.log('[TEST] Sent chat message');
      }
      
    } catch (err) {
      console.error('[TEST] LLM Error:', err.message);
    }
    
    setTimeout(() => {
      console.log('[TEST] Test complete, quitting...');
      bot.quit();
      process.exit(0);
    }, 10000);
    
  }, 5000);
});

bot.on('error', (err) => {
  console.error('[TEST] Error:', err.message);
  process.exit(1);
});

// Timeout after 60 seconds
setTimeout(() => {
  console.log('[TEST] Timeout');
  bot.quit();
  process.exit(0);
}, 60000);