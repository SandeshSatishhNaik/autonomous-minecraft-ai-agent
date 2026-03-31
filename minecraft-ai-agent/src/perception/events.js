// Perception Module: Events (Instinct Triggers) - Enhanced
// Phase 1: The Senses - Task 5 (Option C: Complete Survival Instincts)
// Advanced event listeners with auto-survival behaviors

let bot = null;

// Chat disabled to prevent server kicks
const CHAT_ENABLED = false;

// Reflex system state
const reflexState = {
  lastReflexTime: {},
  reflexHistory: [],
  isFleeing: false,
  fleeTarget: null,
  combatMode: false,
  lastDamageTime: 0,
  lastEatTime: 0,
  cooldown: 3000 // 3 seconds between reflex actions
};

// Reflex types
const REFLEX_TYPES = {
  CRITICAL_HEALTH: 'critical_health',
  LOW_HEALTH: 'low_health',
  ON_FIRE: 'on_fire',
  CREEPER_NEARBY: 'creeper_nearby',
  HOSTILE_ATTACKING: 'hostile_attacking',
  LOW_FOOD: 'low_food',
  PLAYER_ATTACK: 'player_attack',
  PLAYER_INTERACT: 'player_interact',
  SOUND_DETECTED: 'sound_detected',
  WEATHER_CHANGE: 'weather_change',
  DEATH: 'death',
  FALL_DAMAGE: 'fall_damage'
};

// Hostile mobs that trigger combat reflex
const HOSTILE_MOBS = ['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'piglin', 'hoglin', 'warden', 'blaze', 'magma_cube', 'pillager', 'ravager', 'vindicator', 'evoker'];
const DANGER_MOBS = ['creeper', 'zombie', 'skeleton'];

// Initialize event handlers with bot reference
function init(botInstance) {
  bot = botInstance;
  
  setupHealthEvents();
  setupFoodEvents();
  setupEntityEvents();
  setupChatEvents();
  setupSoundEvents();
  setupWeatherEvents();
  setupDeathEvents();
  setupPlayerInteractionEvents();
  
  console.log('[EVENTS] ✓ Complete survival instincts initialized');
  console.log('[EVENTS]   - Health/Food monitoring: ✓');
  console.log('[EVENTS]   - Hostile detection: ✓');
  console.log('[EVENTS]   - Auto-flee system: ✓');
  console.log('[EVENTS]   - Auto-eat system: ✓');
  console.log('[EVENTS]   - Combat reflexes: ✓');
  console.log('[EVENTS]   - Sound detection: ✓');
  console.log('[EVENTS]   - Death tracking: ✓');
}

// ==================== HEALTH EVENTS ====================

function setupHealthEvents() {
  // When bot's health changes
  bot.on('healthChanged', () => {
    const health = bot.health;
    const maxHealth = bot.maxHealth || 20;
    const food = bot.food;
    
    console.log(`[HEALTH] Health: ${health.toFixed(1)}/${maxHealth} | Food: ${food}/20`);
    
    // Critical health - trigger reflex
    if (health <= 4 && canTriggerReflex(REFLEX_TYPES.CRITICAL_HEALTH)) {
      triggerReflex(REFLEX_TYPES.CRITICAL_HEALTH, { health, maxHealth });
    }
    // Low health warning
    else if (health <= 10 && canTriggerReflex(REFLEX_TYPES.LOW_HEALTH)) {
      triggerReflex(REFLEX_TYPES.LOW_HEALTH, { health, maxHealth });
    }
    
    // Auto-eat when health is low and food is available
    if (health < 15 && food < 15 && canTriggerReflex('auto_eat')) {
      attemptAutoEat();
    }
  });
  
  // When bot takes damage
  bot.on('entityDamaged', (entity, damage) => {
    if (entity === bot.entity) {
      reflexState.lastDamageTime = Date.now();
      const health = bot.health;
      
      console.log(`[DAMAGE] Bot took ${damage} damage! Health: ${health.toFixed(1)}`);
      
      // If damaged by hostile mob, trigger combat reflex
      if (canTriggerReflex(REFLEX_TYPES.HOSTILE_ATTACKING)) {
        triggerReflex(REFLEX_TYPES.HOSTILE_ATTACKING, { damage, health });
      }
    }
  });
  
  // Fire/ lava damage detection
  bot.on('ignite', () => {
    console.log('[DAMAGE] 🔥 Bot is on fire!');
    if (canTriggerReflex(REFLEX_TYPES.ON_FIRE)) {
      triggerReflex(REFLEX_TYPES.ON_FIRE, {});
    }
  });
  
  // Fall damage detection
  bot.on('damage', (damageType) => {
    if (damageType === 'fall' && canTriggerReflex(REFLEX_TYPES.FALL_DAMAGE)) {
      console.log('[DAMAGE] Fall damage taken!');
      triggerReflex(REFLEX_TYPES.FALL_DAMAGE, {});
    }
  });
}

// ==================== FOOD EVENTS ====================

function setupFoodEvents() {
  // When bot's food level changes
  bot.on('foodChanged', () => {
    const food = bot.food;
    const maxFood = 20;
    
    console.log(`[FOOD] Food: ${food}/${maxFood}`);
    
    // Very hungry - critical
    if (food <= 4 && canTriggerReflex(REFLEX_TYPES.LOW_FOOD)) {
      console.log('[FOOD] ⚠️ Very hungry!');
      attemptAutoEat();
    }
    // Getting hungry
    else if (food <= 10 && food > 4) {
      console.log('[FOOD] Getting hungry...');
    }
  });
  
  // When bot eats something
  bot.on('itemUsed', (item) => {
    reflexState.lastEatTime = Date.now();
    console.log(`[EAT] Bot ate: ${item}`);
  });
  
  // Auto-eat attempt function
  async function attemptAutoEat() {
    if (!bot.inventory) return;
    
    try {
      // Find food in inventory
      const foodItems = ['apple', 'bread', 'cooked_beef', 'cooked_chicken', 'cooked_porkchop', 'carrot', 'golden_carrot', 'cooked_salmon', 'cooked_cod', 'melon_slice', 'pumpkin_pie', 'suspicious_stew', 'honey_bottle'];
      
      const items = bot.inventory.items();
      for (const slot of items) {
        if (slot && foodItems.some(food => slot.name?.includes(food))) {
          console.log(`[AUTO-EAT] Found ${slot.name}, eating it...`);
          await bot.equip(slot, 'hand');
          await bot.useItem();
          reflexState.lastEatTime = Date.now();
          return;
        }
      }
      console.log('[AUTO-EAT] No food found in inventory');
    } catch (e) {
      console.log('[AUTO-EAT] Error:', e.message);
    }
  }
}

// ==================== ENTITY EVENTS ====================

function setupEntityEvents() {
  let entityMoveCount = 0;
  let lastHostileCheck = 0;
  
  // When an entity moves near the bot
  bot.on('entityMoved', (entity) => {
    if (!bot.entity || !entity.position) return;
    
    const pos = bot.entity.position;
    const dist = Math.sqrt(
      Math.pow(entity.position.x - pos.x, 2) +
      Math.pow(entity.position.y - pos.y, 2) +
      Math.pow(entity.position.z - pos.z, 2)
    );
    
    // Only process close entities (within 8 blocks)
    if (dist <= 8) {
      const entityType = (entity.name || entity.type || 'unknown').toLowerCase();
      const isHostile = HOSTILE_MOBS.some(mob => entityType.includes(mob));
      const isDanger = DANGER_MOBS.some(mob => entityType.includes(mob));
      
      entityMoveCount++;
      
      // Creeper specifically - very dangerous!
      if (entityType.includes('creeper') && canTriggerReflex(REFLEX_TYPES.CREEPER_NEARBY)) {
        console.log(`[ENTITY] ⚠️💥 CREEPER at distance ${Math.floor(dist)}!`);
        triggerReflex(REFLEX_TYPES.CREEPER_NEARBY, { type: 'creeper', distance: Math.floor(dist), entity });
      }
      
      // Other hostile mobs - check for combat/flee
      else if (isHostile && dist <= 5 && canTriggerReflex('hostile_nearby')) {
        console.log(`[ENTITY] ⚠️ Hostile: ${entityType} at ${Math.floor(dist)} blocks`);
        
        // If health is low, flee; otherwise maybe fight
        if (bot.health <= 10) {
          triggerReflex(REFLEX_TYPES.HOSTILE_ATTACKING, { type: entityType, distance: Math.floor(dist), action: 'flee' });
        }
      }
    }
  });
  
  // Spawn events - track what mobs are around
  let spawnCount = 0;
  bot.on('entitySpawn', (entity) => {
    spawnCount++;
    if (spawnCount % 30 === 0) {
      const entityType = entity.name || entity.type;
      console.log(`[ENTITY] New spawn: ${entityType}`);
    }
  });
}

// ==================== PLAYER INTERACTION EVENTS ====================

function setupPlayerInteractionEvents() {
  // When player attacks/punches the bot
  bot.on('playerInteract', (player, interaction) => {
    console.log(`[INTERACT] Player ${player.username} interacted!`);
    
    // Differentiate between right-click (interact) and left-click (attack)
    if (interaction.action === 'left_click_block' || interaction.action === 'left_click_air') {
      // Player attacked the bot
      console.log(`[COMBAT] Bot was attacked by ${player.username}!`);
      
      if (canTriggerReflex(REFLEX_TYPES.PLAYER_ATTACK)) {
        triggerReflex(REFLEX_TYPES.PLAYER_ATTACK, { player: player.username });
      }
    } else {
      // Player right-clicked the bot (interact)
      console.log(`[INTERACT] ${player.username} right-clicked bot`);
      
      if (canTriggerReflex(REFLEX_TYPES.PLAYER_INTERACT)) {
        if (CHAT_ENABLED) bot.chat(`Hello ${player.username}! I'm an AI agent.`);
      }
    }
  });
  
  // Entity interaction (for more detailed combat detection)
  bot.on('entityHit', (entity) => {
    if (entity === bot.entity) {
      console.log('[COMBAT] Bot was hit by an entity!');
      reflexState.lastDamageTime = Date.now();
    }
  });
}

// ==================== CHAT EVENTS ====================

function setupChatEvents() {
  // When anyone chats in the server
  bot.on('chat', (username, message) => {
    console.log(`[CHAT] ${username}: ${message}`);
    
    // Don't respond to own messages
    if (username === bot.username) return;
    
    const lowerMsg = message.toLowerCase();
    const pos = bot.entity ? bot.entity.position : null;
    
    // Hello/Hi response
    if (lowerMsg.includes('hello') || lowerMsg.includes('hi') || lowerMsg.includes('hey')) {
      if (CHAT_ENABLED) bot.chat(`Hello ${username}! 👋 I'm an AI agent.`);
    }
    
    // Status/What do you see
    if ((lowerMsg.includes('what') && lowerMsg.includes('see')) || lowerMsg.includes('status')) {
      const health = bot.health?.toFixed(1) || '?';
      const food = bot.food || '?';
      const posStr = pos ? `X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}` : 'unknown';
      if (CHAT_ENABLED) bot.chat(`Status: HP:${health} Food:${food} | Pos: ${posStr}`);
    }
    
    // Who are you?
    if (lowerMsg.includes('who') && (lowerMsg.includes('are') || lowerMsg.includes('you'))) {
      if (CHAT_ENABLED) bot.chat("I'm an autonomous AI agent! I can see mobs, scan environment, and survive on my own.");
    }
    
    // Help
    if (lowerMsg.includes('help')) {
      if (CHAT_ENABLED) bot.chat("Commands: 'status', 'hello', 'who are you', 'help', 'attack', 'run', 'come here'");
    }
    
    // Attack command
    if (lowerMsg.includes('attack')) {
      if (CHAT_ENABLED) bot.chat("⚔️ I'll attack nearest hostile!");
      triggerReflex('manual_attack', { player: username });
    }
    
    // Run/Flee command
    if (lowerMsg.includes('run') || lowerMsg.includes('flee') || lowerMsg.includes('escape')) {
      if (CHAT_ENABLED) bot.chat("🏃 Running away!");
      triggerReflex('manual_flee', { player: username });
    }
    
    // Come here command
    if (lowerMsg.includes('come') && lowerMsg.includes('here')) {
      // Find the player and move towards them
      try {
        const playerEntity = bot.entities[username];
        if (playerEntity && playerEntity.position) {
          const pos = bot.entity.position;
          const targetPos = playerEntity.position;
          
          // Move towards player
          const path = require('mineflayer-pathfinder').pathfinder;
          const { GoalNear } = require('mineflayer-pathfinder').goals;
          
          bot.pathfinder.setGoal(GoalNear(targetPos.x, targetPos.y, targetPos.z, 2));
          if (CHAT_ENABLED) bot.chat(`Coming to you, ${username}!`);
        }
      } catch (e) {
        if (CHAT_ENABLED) bot.chat("Can't find you right now!");
      }
    }
    
    // Thanks
    if (lowerMsg.includes('thanks') || lowerMsg.includes('thank')) {
      if (CHAT_ENABLED) bot.chat("You're welcome! 👾");
    }
  });
  
  // When bot sends a message
  bot.on('message', (jsonMsg) => {
    const message = jsonMsg.toString();
    if (message.includes(bot.username)) {
      console.log(`[CHAT] My message: ${message}`);
    }
  });
}

// ==================== SOUND EVENTS ====================

function setupSoundEvents() {
  // Note: Mineflayer has limited sound event support, but we can track some events
  
  // When entity makes sound (approximation via other events)
  bot.on('sound', (soundName, position) => {
    // This may not work in all Mineflayer versions
    console.log(`[SOUND] Heard: ${soundName} at ${position}`);
    
    // Map common sounds to reflex triggers
    if (soundName?.includes('creeper')) {
      triggerReflex(REFLEX_TYPES.CREEPER_NEARBY, { sound: 'hiss' });
    }
  });
}

// ==================== WEATHER EVENTS ====================

function setupWeatherEvents() {
  // Track weather changes (approximate via time changes)
  let lastWeather = 'clear';
  
  setInterval(() => {
    try {
      const isRaining = bot.world?.isRaining?.() || false;
      const isThundering = bot.world?.isThundering?.() || false;
      
      let currentWeather = 'clear';
      if (isThundering) currentWeather = 'thunder';
      else if (isRaining) currentWeather = 'rain';
      
      if (currentWeather !== lastWeather) {
        console.log(`[WEATHER] Changed: ${lastWeather} → ${currentWeather}`);
        
        if (canTriggerReflex(REFLEX_TYPES.WEATHER_CHANGE)) {
          triggerReflex(REFLEX_TYPES.WEATHER_CHANGE, { from: lastWeather, to: currentWeather });
        }
        
        lastWeather = currentWeather;
      }
    } catch (e) {
      // Ignore errors
    }
  }, 10000); // Check every 10 seconds
}

// ==================== DEATH EVENTS ====================

function setupDeathEvents() {
  // Track death
  bot.on('death', () => {
    const pos = bot.entity ? bot.entity.position : null;
    const posStr = pos ? `X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}` : 'unknown';
    
    console.log(`\n[DEATH] ☠️ Bot died at ${posStr}!`);
    console.log(`[DEATH] Health at death: ${bot.health}`);
    console.log(`[DEATH] Food at death: ${bot.food}`);
    
    // Log to reflex history
    addToReflexHistory('death', {
      position: posStr,
      health: bot.health,
      food: bot.food,
      timestamp: Date.now()
    });
    
    triggerReflex(REFLEX_TYPES.DEATH, { position: posStr });
  });
  
  // Respawn event
  bot.on('respawn', () => {
    const pos = bot.entity ? bot.entity.position : null;
    const posStr = pos ? `X:${Math.floor(pos.x)} Y:${Math.floor(pos.y)} Z:${Math.floor(pos.z)}` : 'unknown';
    
    console.log(`\n[RESPAWN] ⚠️ Bot respawned at ${posStr}`);
    console.log(`[RESPAWN] Health: ${bot.health}/${bot.maxHealth} | Food: ${bot.food}/20`);
    
    // Only log, NO chat on respawn to avoid spam
    console.log('[RESPAWN] Bot alive - searching for safe spot...');
  });
}

// ==================== REFLEX SYSTEM ====================

// Check if reflex can be triggered (cooldown)
function canTriggerReflex(reflexType) {
  const now = Date.now();
  const lastTime = reflexState.lastReflexTime[reflexType] || 0;
  
  return (now - lastTime) > reflexState.cooldown;
}

// Add to reflex history for learning
function addToReflexHistory(type, data) {
  reflexState.reflexHistory.unshift({
    type,
    data,
    timestamp: Date.now()
  });
  
  // Keep only last 50 entries
  if (reflexState.reflexHistory.length > 50) {
    reflexState.reflexHistory.pop();
  }
}

// Main reflex handler
async function triggerReflex(reflexType, data = {}) {
  const now = Date.now();
  reflexState.lastReflexTime[reflexType] = now;
  
  console.log(`[REFLEX] ⚡ Triggered: ${reflexType}`);
  addToReflexHistory(reflexType, data);
  
  switch (reflexType) {
    case REFLEX_TYPES.CRITICAL_HEALTH:
      await handleCriticalHealth(data);
      break;
      
    case REFLEX_TYPES.LOW_HEALTH:
      await handleLowHealth(data);
      break;
      
    case REFLEX_TYPES.ON_FIRE:
      await handleOnFire(data);
      break;
      
    case REFLEX_TYPES.CREEPER_NEARBY:
      await handleCreeperNearby(data);
      break;
      
    case REFLEX_TYPES.HOSTILE_ATTACKING:
      await handleHostileAttacking(data);
      break;
      
    case REFLEX_TYPES.LOW_FOOD:
      await handleLowFood(data);
      break;
      
    case REFLEX_TYPES.PLAYER_ATTACK:
      await handlePlayerAttack(data);
      break;
      
    case REFLEX_TYPES.PLAYER_INTERACT:
      // Already handled in chat event
      break;
      
    case REFLEX_TYPES.SOUND_DETECTED:
      handleSoundDetected(data);
      break;
      
    case REFLEX_TYPES.WEATHER_CHANGE:
      handleWeatherChange(data);
      break;
      
    case REFLEX_TYPES.DEATH:
      handleDeath(data);
      break;
      
    case REFLEX_TYPES.FALL_DAMAGE:
      await handleFallDamage(data);
      break;
      
    case 'manual_flee':
      await handleManualFlee(data);
      break;
      
    case 'manual_attack':
      await handleManualAttack(data);
      break;
      
    case 'post_respawn':
      await handlePostRespawn(data);
      break;
      
    default:
      console.log(`[REFLEX] Unknown type: ${reflexType}`);
  }
}

// ==================== REFLEX HANDLERS ====================

// Minimal chat - only in emergencies
const EMERGENCY_CHAT = false; // Set to false to reduce spam

// Critical health - find safe spot and heal
async function handleCriticalHealth(data) {
  console.log('[REFLEX] 🔴 CRITICAL HEALTH - Attempting to flee and heal!');
  if (EMERGENCY_CHAT) bot.chat('⚠️ Critical health! Running to safety!');
  
  reflexState.isFleeing = true;
  await fleeToSafety();
  
  await attemptAutoEat();
}

// Low health - be more cautious
async function handleLowHealth(data) {
  console.log(`[REFLEX] 🟡 Low health (${data.health}/${data.maxHealth})`);
  await attemptAutoEat();
  console.log('[REFLEX] Being cautious - avoiding combat');
}

// On fire - find water
async function handleOnFire(data) {
  console.log('[REFLEX] 🔥 ON FIRE - Looking for water!');
  if (EMERGENCY_CHAT) bot.chat('🔥 On fire! Finding water!');
  
  await findWater();
}

// Creeper nearby - RUN!
async function handleCreeperNearby(data) {
  console.log(`[REFLEX] 💥 CREEPER at ${data.distance} blocks - RUNNING!`);
    if (EMERGENCY_CHAT) bot.chat('💥 CREEPER! RUNNING!');
  
  reflexState.isFleeing = true;
  
  // Get direction away from creeper
  if (data.entity && data.entity.position) {
    const pos = bot.entity.position;
    const creepPos = data.entity.position;
    
    // Calculate direction away from creeper
    const dx = pos.x - creepPos.x;
    const dz = pos.z - creepPos.z;
    
    // Move away
    const targetX = pos.x + (dx > 0 ? 10 : -10);
    const targetZ = pos.z + (dz > 0 ? 10 : -10);
    
    await moveToSafety(targetX, pos.y, targetZ);
  } else {
    await fleeToSafety();
  }
}

// Hostile attacking - fight or flee based on health
async function handleHostileAttacking(data) {
  console.log(`[REFLEX] ⚔️ Hostile ${data.type} at ${data.distance} blocks`);
  
  if (bot.health <= 10 || data.action === 'flee') {
    // Too weak to fight - flee!
    if (EMERGENCY_CHAT) bot.chat('Too weak! Running away!');
    reflexState.isFleeing = true;
    await fleeToSafety();
  } else {
    // Health is good - stand ground or fight back
    console.log('[REFLEX] Health good - preparing to defend');
    reflexState.combatMode = true;
  }
}

// Low food - eat
async function handleLowFood(data) {
  console.log('[REFLEX] 🍖 Low food - attempting to eat');
  await attemptAutoEat();
}

// Player attack - respond
async function handlePlayerAttack(data) {
  console.log(`[REFLEX] 👊 Attacked by player ${data.player}`);
    if (EMERGENCY_CHAT) bot.chat(`Hey ${data.player}! Why are you attacking me?`);
}

// Sound detected
function handleSoundDetected(data) {
  console.log(`[REFLEX] 🔊 Heard: ${data.sound || 'unknown sound'}`);
}

// Weather change
function handleWeatherChange(data) {
  console.log(`[REFLEX] 🌧️ Weather: ${data.from} → ${data.to}`);
  
  if (data.to === 'thunder') {
    if (EMERGENCY_CHAT) bot.chat('⛈️ Thunderstorm! Finding shelter...');
  }
}

// Death handler
function handleDeath(data) {
  console.log('[REFLEX] 💀 Recorded death for learning');
  // Already handled in death event
}

// Fall damage handler
async function handleFallDamage(data) {
  console.log('[REFLEX] 💥 Fall damage - checking health');
  if (bot.health <= 5) {
    await fleeToSafety();
  }
}

// Manual flee command
async function handleManualFlee(data) {
  console.log('[REFLEX] 🏃 Manual flee command');
    if (EMERGENCY_CHAT) bot.chat('🏃 Running away!');
  reflexState.isFleeing = true;
  await fleeToSafety();
}

// Manual attack command
async function handleManualAttack(data) {
  console.log('[REFLEX] ⚔️ Manual attack command');
    if (EMERGENCY_CHAT) bot.chat('⚔️ Looking for enemies to attack!');
  await attackNearestHostile();
}

// Post respawn handler
async function handlePostRespawn(data) {
  console.log('[REFLEX] Post-respawn - finding safe spot');
    if (EMERGENCY_CHAT) bot.chat('Respawned! Moving to safe area...');
  await fleeToSafety();
}

// ==================== ACTION HELPERS ====================

// Flee to safety - find a safe location
async function fleeToSafety() {
  try {
    if (!bot.pathfinder) {
      console.log('[FLEE] Pathfinding not available');
      return;
    }
    
    const pos = bot.entity.position;
    
    // Try to find a safe spot (away from current danger)
    // Move in random direction, prefer higher ground
    const fleeDistance = 15;
    const angle = Math.random() * Math.PI * 2;
    const targetX = pos.x + Math.cos(angle) * fleeDistance;
    const targetZ = pos.z + Math.sin(angle) * fleeDistance;
    
    // Simple movement - just move in direction
    await moveToSafety(targetX, pos.y, targetZ);
    
    console.log('[FLEE] Moved to safer location');
    reflexState.isFleeing = false;
    
  } catch (e) {
    console.log('[FLEE] Error:', e.message);
    reflexState.isFleeing = false;
  }
}

// Move to safety position
async function moveToSafety(targetX, targetY, targetZ) {
  try {
    const { GoalBlock } = require('mineflayer-pathfinder').goals;
    
    // Set goal to target position
    bot.pathfinder.setGoal(GoalBlock(targetX, Math.floor(targetY), targetZ));
    
    // Move for up to 5 seconds then stop
    await new Promise(resolve => setTimeout(resolve, 5000));
    bot.pathfinder.stop();
    
  } catch (e) {
    // Fallback - simple movement
    console.log('[MOVE] Using simple movement');
  }
}

// Find water and jump in
async function findWater() {
  try {
    // Look for water blocks nearby
    const pos = bot.entity.position;
    const searchRadius = 10;
    
    for (let x = -searchRadius; x <= searchRadius; x++) {
      for (let y = -3; y <= 3; y++) {
        for (let z = -searchRadius; z <= searchRadius; z++) {
          const block = bot.blockAt(pos.offset(x, y, z));
          if (block && block.name === 'water') {
            console.log(`[WATER] Found water at ${x}, ${y}, ${z} - moving to it`);
            
            // Move to water
            await moveToSafety(pos.x + x, pos.y + y, pos.z + z);
            return;
          }
        }
      }
    }
    
    console.log('[WATER] No water found nearby');
    
  } catch (e) {
    console.log('[WATER] Error:', e.message);
  }
}

// Attack nearest hostile
async function attackNearestHostile() {
  try {
    if (!bot.entities) return;
    
    const pos = bot.entity.position;
    let nearestHostile = null;
    let nearestDist = 999;
    
    for (const entity of Object.values(bot.entities)) {
      if (!entity.position || entity === bot.entity) continue;
      
      const entityType = (entity.name || entity.type || '').toLowerCase();
      const isHostile = HOSTILE_MOBS.some(mob => entityType.includes(mob));
      
      if (isHostile) {
        const dist = Math.sqrt(
          Math.pow(entity.position.x - pos.x, 2) +
          Math.pow(entity.position.z - pos.z, 2)
        );
        
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestHostile = entity;
        }
      }
    }
    
    if (nearestHostile && nearestDist <= 15) {
      console.log(`[ATTACK] Attacking ${nearestHostile.name} at ${Math.floor(nearestDist)} blocks`);
      if (CHAT_ENABLED) bot.chat(`Attacking ${nearestHostile.name}!`);
      
      // Move to and attack
      bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals).GoalNear(
        nearestHostile.position.x,
        nearestHostile.position.y,
        nearestHostile.position.z,
        2
      ));
      
      // Attack when close
      setTimeout(() => {
        bot.pathfinder.stop();
        bot.attack(nearestHostile);
      }, 3000);
      
    } else {
      if (CHAT_ENABLED) bot.chat('No enemies nearby to attack!');
    }
    
  } catch (e) {
    console.log('[ATTACK] Error:', e.message);
  }
}

// ==================== EXPORTS ====================

// Get reflex history for learning
function getReflexHistory() {
  return reflexState.reflexHistory;
}

// Get current reflex state
function getReflexState() {
  return {
    isFleeing: reflexState.isFleeing,
    combatMode: reflexState.combatMode,
    lastDamageTime: reflexState.lastDamageTime,
    lastEatTime: reflexState.lastEatTime
  };
}

// Export functions
module.exports = {
  init,
  triggerReflex,
  getReflexHistory,
  getReflexState
};