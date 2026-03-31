// Autonomous Minecraft AI Agent - Main Entry Point
// Phase 1: The Senses - Task 3 (Enhanced)
// Advanced features: Auto-reconnect, Session tracking, Connection quality

require('dotenv').config();
const mineflayer = require('mineflayer');

const config = {
  host: process.env.MC_HOST || 'localhost',
  port: parseInt(process.env.MC_PORT) || 25565,
  username: process.env.MC_USERNAME || 'AI_Agent',
};

// Session tracking
let sessionStartTime = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 999; // Keep trying forever
let connectionQuality = {
  latency: 0,
  packetsSent: 0,
  packetsReceived: 0,
  lastPing: Date.now()
};

// Function to reconnect - graceful reconnection with delay
function reconnectBot() {
  reconnectAttempts++;
  // Exponential backoff: 3s, 4.5s, 6.75s, max 30s
  const delay = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 30000);
  
  console.log(`[RECONNECT] ═══════════════════════════════════════`);
  console.log(`[RECONNECT] Bot disconnected. Reconnecting in ${delay}ms...`);
  console.log(`[RECONNECT]   Attempt: ${reconnectAttempts}`);
  console.log(`[RECONNECT] ═══════════════════════════════════════`);
  
  setTimeout(() => {
    console.log('[RECONNECT] Restarting Node process for clean reconnection...');
    process.exit(1); // Still exit for clean restart, but with proper logging
  }, delay);
}

console.log(`[INIT] Creating bot: ${config.username}`);
console.log(`[INIT] Server: ${config.host}:${config.port}`);
console.log(`[INIT] Connection timeout: 30000ms`);
console.log(`[INIT] Version: 1.20.4 (PaperMC compatible)`);

// Create the bot with enhanced settings
const bot = mineflayer.createBot({
  host: config.host,
  port: config.port,
  username: config.username,
  auth: 'offline',
  hideErrors: false,
  connectTimeout: 30000,
  version: '1.20.4',
  keepAlive: true,
  keepAliveInterval: 10000,
});

// ==================== PLUGIN LOADING ====================

// Load pathfinder plugin for movement
try {
  const pathfinderPlugin = require('mineflayer-pathfinder');
  bot.loadPlugin(pathfinderPlugin.pathfinder);
  console.log('[PLUGIN] ✓ pathfinder loaded');
} catch (e) {
  console.log('[PLUGIN] ✗ pathfinder not loaded:', e.message);
}

// Load armor-manager for player attributes
try {
  const armorManager = require('mineflayer-armor-manager');
  bot.loadPlugin(armorManager);
  console.log('[PLUGIN] ✓ armor-manager loaded');
} catch (e) {
  console.log('[PLUGIN] ✗ armor-manager not loaded:', e.message);
}

// Load auto-eat plugin for food management
try {
  const autoEat = require('mineflayer-auto-eat');
  bot.loadPlugin(autoEat);
  console.log('[PLUGIN] ✓ auto-eat loaded');
} catch (e) {
  console.log('[PLUGIN] ✗ auto-eat not loaded (optional)');
}

// ==================== ADVANCED EVENT HANDLERS ====================

// When bot logs in
bot.on('login', () => {
  sessionStartTime = Date.now();
  reconnectAttempts = 0;
  
  const sessionDuration = formatDuration(Date.now() - sessionStartTime);
  console.log(`[LOGIN] ✓ Bot ${bot.username} joined the server!`);
  console.log(`[LOGIN]   Session ID: ${generateSessionId()}`);
  console.log(`[LOGIN]   Server: ${config.host}:${config.port}`);
});

// When bot spawns into the world
bot.on('spawn', () => {
  const pos = bot.entity.position;
  const worldType = bot.world?.type || 'unknown';
  
  console.log(`\n[SPAWN] ═══════════════════════════════════════`);
  console.log(`[SPAWN] ✓ Bot spawned in the world!`);
  console.log(`[SPAWN]   Position: X:${pos.x.toFixed(1)} Y:${pos.y.toFixed(1)} Z:${pos.z.toFixed(1)}`);
  console.log(`[SPAWN]   World Type: ${worldType}`);
  console.log(`[SPAWN] ═══════════════════════════════════════\n`);
  
  // Initial status report
  reportBotStatus();
});

// Track health and food with detailed logging
bot.on('healthUpdated', () => {
  const health = bot.health;
  const maxHealth = bot.maxHealth;
  const food = bot.food;
  const armor = bot.armor ? bot.armor : 0;
  
  // Color-coded status
  let healthStatus = '✓';
  if (health <= 4) healthStatus = '🔴 CRITICAL';
  else if (health <= 10) healthStatus = '🟡 LOW';
  
  let foodStatus = '✓';
  if (food <= 4) foodStatus = '🔴 CRITICAL';
  else if (food <= 10) foodStatus = '🟡 LOW';
  
  console.log(`[STATUS] Health: ${health}/${maxHealth} ${healthStatus} | Food: ${food}/20 ${foodStatus} | Armor: ${armor}`);
});

// Track respawn with death info - REMOVED, handled in events.js

// Entity interaction (when bot is clicked/punched)
bot.on('playerInteract', (player, interaction) => {
  console.log(`[INTERACT] Player ${player.username} interacted with bot!`);
  console.log(`[INTERACT]   Action: ${interaction.action}`);
  console.log(`[INTERACT]   Block: ${interaction.block?.name || 'none'}`);
});

// When bot picks up an item
bot.on('itemPickedUp', (item) => {
  console.log(`[PICKUP] Picked up: ${item.item.name} x${item.item.count}`);
});

// When bot drops an item
bot.on('itemDropped', (item) => {
  console.log(`[DROP] Dropped: ${item.name} x${item.count}`);
});

// ==================== CONNECTION MANAGEMENT ====================

// When bot disconnects - smart auto reconnect
bot.on('disconnect', (reason) => {
  reconnectAttempts++;
  
  console.log(`\n[DISCONNECT] ═══════════════════════════════════════`);
  console.log(`[DISCONNECT] Bot disconnected: ${reason}`);
  console.log(`[DISCONNECT]   Reconnect attempts: ${reconnectAttempts}`);
  console.log(`[DISCONNECT]   Session duration: ${sessionStartTime ? formatDuration(Date.now() - sessionStartTime) : 'N/A'}`);
  console.log(`[DISCONNECT] ═══════════════════════════════════════\n`);
  
  // Keep trying to reconnect
  reconnectBot();
});

// When bot gets kicked
bot.on('kicked', (reason) => {
  const reasonStr = typeof reason === 'object' ? JSON.stringify(reason) : String(reason);
  
  console.log(`\n[KICKED] ═══════════════════════════════════════`);
  console.log(`[KICKED] Bot was kicked!`);
  console.log(`[KICKED]   Reason: ${reasonStr}`);
  console.log(`[KICKED]   Reconnect attempts: ${reconnectAttempts}`);
  console.log(`[KICKED] ═══════════════════════════════════════\n`);
  
  // Wait longer after kick, then reconnect
  setTimeout(() => {
    reconnectBot();
  }, 5000);
});

// Error handling
bot.on('error', (err) => {
  console.error(`[ERROR] Bot error: ${err.message}`);
  if (err.message.includes('ECONNREFUSED')) {
    console.error('[ERROR] Server may be offline. Check if Minecraft server is running.');
  }
  console.error('[ERROR] Stack:', err.stack);
});

// Warning events
bot.on('warning', (warning) => {
  console.log(`[WARNING] ${warning}`);
});

// Log ALL events to see what's happening
bot.on('packet', (packet) => {
  // Only log disconnects
  if (packet.name === 'disconnect') {
    console.log('[PACKET] Received disconnect packet:', packet);
  }
});

bot.on('end', (reason) => {
  console.log(`[END] ═══════════════════════════════════════════`);
  console.log(`[END] Bot ended. Reason: "${reason}"`);
  console.log(`[END] IMMEDIATE RECONNECT...`);
  console.log(`[END] ═══════════════════════════════════════════`);
  
  // Reconnect immediately
  reconnectBot();
});

// Auto-respawn if dead and not respawned - check more frequently
setInterval(() => {
  if (bot.health === 0 && bot.entity) {
    console.log('[AUTOSPAWN] Bot is dead, forcing respawn...');
    bot.respawn();
  }
}, 3000);

// ==================== PERCEPTION MODULES ====================

const scanner = require('./perception/scanner');
const events = require('./perception/events');
const inventory = require('./perception/inventory');

scanner.init(bot);
events.init(bot);
inventory.init(bot);

console.log('[INIT] ✓ Perception modules loaded (scanner, events, inventory)');

// ==================== INTELLECT MODULE ====================

const brain = require('./intellect/brain');

brain.init(bot);
console.log('[INIT] ✓ Intellect module loaded (brain)');

// ==================== MUSCLES MODULE ====================

const muscles = {
  executor: require('./muscles/executor'),
  queue: require('./muscles/queue'),
  survival: require('./muscles/survival'),
  tools: require('./muscles/tools')
};

muscles.executor.init(bot);
muscles.survival.init(bot);
muscles.tools.init(bot);

console.log('[INIT] ✓ Muscles module loaded (executor, survival, tools)');

// ==================== DECISION LOOP ====================

let decisionLoopActive = false;
let lastDecisionTime = 0;
const DECISION_INTERVAL = 10000; // Make a decision every 10 seconds
const MIN_DECISION_INTERVAL = 5000; // Minimum 5 seconds between decisions

// Main decision loop - called periodically
async function runDecisionLoop() {
  if (!bot.entity || !bot.entity.position) {
    setTimeout(runDecisionLoop, 2000);
    return;
  }
  
  const now = Date.now();
  if (now - lastDecisionTime < MIN_DECISION_INTERVAL) {
    setTimeout(runDecisionLoop, 2000);
    return;
  }
  
  // Skip if survival instincts are active (already handling critical situation)
  if (events && events.isFleeing && events.isFleeing()) {
    setTimeout(runDecisionLoop, 3000);
    return;
  }
  
  // Skip if health is critical - let survival instincts handle it
  if (bot.health <= 10) {
    setTimeout(runDecisionLoop, 5000);
    return;
  }
  
  lastDecisionTime = now;
  
  try {
    console.log('[BRAIN] Thinking...');
    const decision = await brain.think({
      currentGoal: 'Survive and gather resources'
    });
    
    console.log(`[BRAIN] Decision: ${decision.action} -> ${decision.target || 'none'} (priority: ${decision.priority})`);
    console.log(`[BRAIN] Think: ${decision.think}`);
    
    // Execute the decision using muscles executor
    if (decision.priority <= 3) {
      const result = await muscles.executor.execute(decision);
      console.log(`[BRAIN] Result: ${result.success ? '✓ success' : '✗ failed'} - ${result.error || result.action || 'done'}`);
      
      // NO chat messages - to prevent server kick
      // if (result.success) {
      //   const responses = [`👍 Doing: ${decision.action}`, `✅ ${decision.action} complete`, `💪 ${decision.action} done!`, `🎯 Action: ${decision.action}`];
      //   bot.chat(responses[Math.floor(Math.random() * responses.length)]);
      // }
    } else {
      console.log(`[BRAIN] Skipping low priority action (${decision.priority})`);
    }
  } catch (error) {
    console.error('[BRAIN] Decision error:', error.message);
  }
  
  // Schedule next decision
  setTimeout(runDecisionLoop, DECISION_INTERVAL);
}

// Start the decision loop after bot spawns
bot.once('spawn', () => {
  setTimeout(() => {
    decisionLoopActive = true;
    console.log('[BRAIN] Starting decision loop...');
    console.log('[BRAIN] Decision interval: 10 seconds, min interval: 5 seconds');
    runDecisionLoop();
  }, 5000); // Wait 5 seconds after spawn before first decision
});

// Manual brain trigger - type "!brain" in Minecraft chat
bot.on('chat', (username, message) => {
  console.log(`[CHAT] Received: ${username}: ${message}`);
  
  if (message.toLowerCase() === '!brain') {
    console.log('[BRAIN] Manual trigger from chat');
    brain.think({ currentGoal: 'Manual brain trigger from chat command' })
      .then(decision => {
        console.log(`[BRAIN] Decision: ${decision.action} -> ${decision.target || 'none'}`);
        console.log(`[BRAIN] Think: ${decision.think}`);
        
        // NO chat - disabled to prevent server kick
        // bot.chat(`🤔 ${decision.think}`);
        
        // Execute using muscles
        if (decision.priority <= 3) {
          setTimeout(async () => {
            const result = result; // Already executed above
            // NO chat - disabled to prevent server kick
            // const response = result.success ? `✅ ${decision.action} ${result.target ? result.target : ''}` : `❌ ${decision.action} failed`;
            // bot.chat(response);
          }, 1500);
        }
      })
      .catch(err => {
        console.error('[BRAIN] Error:', err.message);
        bot.chat(`❌ Brain error: ${err.message}`);
      });
  }
});

// ==================== HELPER FUNCTIONS ====================

function reportBotStatus() {
  if (!bot.entity) return;
  
  const pos = bot.entity.position;
  const biome = scanner.getBiome();
  const time = scanner.getTimeOfDay();
  const weather = scanner.getWeather();
  const dimension = scanner.getDimension();
  const quickStatus = scanner.getQuickStatus();
  const invStatus = inventory.getQuickStatus();
  
  console.log(`\n[BOT STATUS] ═══════════════════════════════════════════`);
  console.log(`[BOT STATUS] Health: ${bot.health}/${bot.maxHealth} | Food: ${bot.food}/20`);
  console.log(`[BOT STATUS] Position: X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}`);
  console.log(`[BOT STATUS] Biome: ${biome?.name || 'unknown'} | Time: ${time?.period || 'unknown'} | Weather: ${weather}`);
  console.log(`[BOT STATUS] ✋ Holding: ${invStatus.mainHand} | 🛡️ Armor: ${invStatus.armorProtection} | 📦 Items: ${invStatus.inventoryCount}`);
  if (quickStatus?.nearbyHostiles > 0) {
    console.log(`[BOT STATUS] ⚠️ Hostiles: ${quickStatus.nearbyHostiles}`);
  }
  console.log(`[BOT STATUS] ═══════════════════════════════════════════\n`);
}

function formatDuration(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

function generateSessionId() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// Periodic status report (every 30 seconds)
setInterval(() => {
  if (bot.entity && sessionStartTime) {
    const pos = bot.entity.position;
    console.log(`[HEARTBEAT] Session: ${formatDuration(Date.now() - sessionStartTime)} | Pos: ${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)} | HP: ${bot.health}/${bot.maxHealth}`);
  }
}, 30000);

// Keepalive - prevent timeout disconnection
// CONSISTENT KEEPALIVE - Every 3-5 seconds
let lastKeepalive = 0;

function keepalive() {
  if (!bot.entity || !sessionStartTime) {
    setTimeout(keepalive, 5000);
    return;
  }
  
  // Move every 3-5 seconds consistently
  const dirs = ['forward', 'back', 'left', 'right'];
  const dir = dirs[Math.floor(Math.random() * dirs.length)];
  bot.setControlState(dir, true);
  setTimeout(() => {
    bot.setControlState(dir, false);
  }, 100 + Math.random() * 150);
  
  // Also look around occasionally (20% chance)
  if (Math.random() < 0.2) {
    const yaw = Math.random() * 2 - 1;
    bot.look(yaw, 0, false);
  }
  
  // Schedule next keepalive
  setTimeout(keepalive, 3000 + Math.random() * 2000);
}

// Start the keepalive after spawn
bot.once('spawn', () => {
  setTimeout(keepalive, 8000);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Received SIGINT. Saving state...');
  if (sessionStartTime) {
    console.log(`[SHUTDOWN] Total session time: ${formatDuration(Date.now() - sessionStartTime)}`);
  }
  console.log('[SHUTDOWN] Disconnecting bot...');
  bot.quit();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[SHUTDOWN] Received SIGTERM. Saving state...');
  bot.quit();
  process.exit(0);
});

// Keep process running
console.log('[INIT] ✓ Bot is ready!');
console.log('[INFO] ═══════════════════════════════════════════');
console.log('[INFO] Bot running. Press Ctrl+C to stop.');
console.log('[INFO] ═══════════════════════════════════════════\n');