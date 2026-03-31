// Muscles Module: Executor
// Phase 3: The Muscles - Smart action execution with retries and error handling
// Acts like a real person: tries, adapts, learns from failures

const tools = require('./tools');

let bot = null;
let isExecuting = false;
let currentAction = null;
let actionHistory = [];
const MAX_HISTORY = 50;
const MAX_RETRIES = 2;

function init(botInstance) {
  bot = botInstance;
  tools.init(bot);
  console.log('[EXECUTOR] ✓ Executor initialized');
}

// Main execute function - routes actions to tools
async function execute(decision) {
  if (!bot) {
    return { success: false, error: 'Bot not initialized' };
  }
  
  if (isExecuting) {
    console.log('[EXECUTOR] Already executing action, queuing...');
    return { success: false, error: 'Busy' };
  }
  
  const { action, target, priority } = decision;
  
  console.log(`[EXECUTOR] Executing: ${action} -> ${target || 'none'} (priority: ${priority})`);
  
  isExecuting = true;
  currentAction = { action, target, startTime: Date.now() };
  
  let result = { success: false, action, target };
  let retries = 0;
  
  // Retry loop - like a real person trying again
  while (retries <= MAX_RETRIES) {
    try {
      result = await executeAction(action, target, priority);
      
      if (result.success) {
        console.log(`[EXECUTOR] ✓ Success: ${action}`);
        break;
      } else {
        // Check if we should fall back to explore
        if (action === 'mineBlock' && result.error?.includes('No blocks')) {
          console.log('[EXECUTOR] No blocks found, falling back to explore...');
          const exploreResult = await tools.explore(15);
          if (exploreResult.success) {
            console.log('[EXECUTOR] ✓ Explore fallback success');
            result = exploreResult;
            break;
          }
        }
        
        if (retries < MAX_RETRIES) {
          console.log(`[EXECUTOR] Failed (attempt ${retries + 1}), retrying...`);
          retries++;
          await sleep(500);
        } else {
          console.log(`[EXECUTOR] ✗ Failed after ${MAX_RETRIES} retries`);
          break;
        }
      }
      
    } catch (error) {
      console.log(`[EXECUTOR] Error: ${error.message}`);
      result = { success: false, error: error.message, action, target };
      
      if (retries < MAX_RETRIES) {
        retries++;
        await sleep(500);
      } else {
        break;
      }
    }
  }
  
  // Record in history
  actionHistory.push({
    decision,
    result,
    attempts: retries + 1,
    duration: Date.now() - currentAction.startTime
  });
  
  // Keep history manageable
  if (actionHistory.length > MAX_HISTORY) {
    actionHistory = actionHistory.slice(-MAX_HISTORY);
  }
  
  isExecuting = false;
  currentAction = null;
  
  return result;
}

// Execute specific action based on type
async function executeAction(action, target, priority) {
  // Handle special cases based on priority
  if (priority <= 1) {
    // Critical priority - survival actions
    return await executeCritical(action, target);
  }
  
  switch (action) {
    case 'walkTo':
    case 'moveTo':
    case 'explore':
      if (target === 'explore') {
        return await tools.explore(15);
      }
      const coords = parseTargetCoords(target);
      if (coords) {
        return await tools.walkTo(coords.x, coords.y, coords.z);
      }
      return await tools.explore(15);
      
    case 'mineBlock':
      if (target === 'nearest_resource') {
        // Find any nearby resource
        return await tools.mineBlock('cobblestone', 1);
      }
      return await tools.mineBlock(target || 'cobblestone', 1);
      
    case 'eat':
      return await tools.eat(target);
      
    case 'attack':
      return await tools.attack(target, 3000);
      
    case 'equipItem':
      return await tools.equipItem(target, 'hand');
      
    case 'placeBlock':
      return await tools.placeBlock(target);
      
    case 'openContainer':
      return await tools.openContainer(parseTargetCoords(target));
      
    case 'follow':
      return await tools.followPlayer(target, 3);
      
    case 'idle':
    case 'chat':
    case 'look':
    default:
      return { success: true, action: 'idle', note: 'No action needed' };
  }
}

// Execute critical survival actions
async function executeCritical(action, target) {
  console.log(`[EXECUTOR] 🔴 Critical action: ${action}`);
  
  switch (action) {
    case 'attack':
      return await tools.attack(null, 2000);
      
    case 'eat':
      return await tools.eat();
      
    case 'flee':
    case 'run':
      // Random direction run
      return await tools.explore(15);
      
    default:
      return await executeAction(action, target, 2);
  }
}

// Parse target coordinates from string "x,y,z"
function parseTargetCoords(target) {
  if (!target || target === 'explore' || target === 'nearest_resource' || target === 'nearest_hostile') {
    return null;
  }
  
  const parts = target.split(',').map(s => parseFloat(s.trim()));
  
  if (parts.length === 3 && !parts.some(isNaN)) {
    return { x: parts[0], y: parts[1], z: parts[2] };
  }
  
  return null;
}

// Check if executor is busy
function isBusy() {
  return isExecuting;
}

// Get current action
function getCurrentAction() {
  return currentAction;
}

// Get action history
function getHistory(count = 10) {
  return actionHistory.slice(-count);
}

// Get last result
function getLastResult() {
  return actionHistory.length > 0 ? actionHistory[actionHistory.length - 1].result : null;
}

// Clear history
function clearHistory() {
  actionHistory = [];
  console.log('[EXECUTOR] History cleared');
}

// Emergency stop
async function emergencyStop() {
  console.log('[EXECUTOR] 🔴 Emergency stop!');
  
  // Stop all movement
  if (bot) {
    bot.setControlState('forward', false);
    bot.setControlState('back', false);
    bot.setControlState('jump', false);
    bot.setControlState('sprint', false);
  }
  
  isExecuting = false;
  currentAction = null;
  
  return { success: true, action: 'emergencyStop' };
}

// Auto-recovery from stuck state
async function recover() {
  console.log('[EXECUTOR] Attempting recovery...');
  
  // Stop current action
  await emergencyStop();
  
  // Clear pathfinder
  if (bot && bot.pathfinder) {
    bot.pathfinder.stop();
  }
  
  // Try to move slightly to unstuck
  try {
    bot.setControlState('forward', true);
    await sleep(500);
    bot.setControlState('forward', false);
  } catch (e) {
    // Ignore
  }
  
  return { success: true, action: 'recover' };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  init,
  execute,
  isBusy,
  getCurrentAction,
  getHistory,
  getLastResult,
  clearHistory,
  emergencyStop,
  recover
};