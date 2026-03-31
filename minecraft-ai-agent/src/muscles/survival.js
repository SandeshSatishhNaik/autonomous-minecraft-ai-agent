// Muscles Module: Survival Behaviors
// Phase 3: The Muscles - Real-player behavior patterns
// Makes the bot feel like a real person playing Minecraft

const tools = require('./tools');
const executor = require('./executor');
const queue = require('./queue');

let bot = null;
let behaviors = {
  autoEat: true,
  autoFlee: true,
  autoAttack: false, // Only attack if attacked
  smartMining: true,
  shelterAtNight: true
};

function init(botInstance) {
  bot = botInstance;
  console.log('[SURVIVAL] ✓ Survival behaviors initialized');
  
  // Set up automatic behavior loops
  setInterval(checkSurvival, 2000); // Check every 2 seconds
  setInterval(checkEnvironment, 5000); // Check environment every 5 seconds
}

// Main survival check loop
async function checkSurvival() {
  if (!bot || !bot.entity) return;
  
  try {
    const health = bot.health;
    const food = bot.food;
    const pos = bot.entity.position;
    
    // Priority 1: Critical health
    if (health <= 4) {
      console.log('[SURVIVAL] 🔴 CRITICAL HEALTH - FLEEING');
      await fleeFromDanger();
      return;
    }
    
    // Priority 2: Hungry
    if (food < 8 && behaviors.autoEat) {
      console.log('[SURVIVAL] 🍖 Very hungry - eating');
      const result = await tools.eat();
      if (result.success) {
        bot.chat('😋 Delicious!');
      }
      return;
    }
    
    // Priority 3: Low food
    if (food < 14 && behaviors.autoEat) {
      console.log('[SURVIVAL] 🍖 Getting hungry');
      await tools.autoEat();
    }
    
  } catch (e) {
    // Ignore errors in survival check
  }
}

// Environment check loop
async function checkEnvironment() {
  if (!bot || !bot.entity) return;
  
  try {
    const time = bot.world.time;
    const pos = bot.entity.position;
    
    // Check time of day
    // 0-12000 = day, 12000-14000 = sunset, 14000-22000 = night, 22000-24000 = sunrise
    const isNight = time > 14000 && time < 22000;
    const isDangerousNight = time > 18000 && time < 22000;
    
    // At night - find shelter
    if (isDangerousNight && behaviors.shelterAtNight) {
      console.log('[SURVIVAL] 🌙 Night time - seeking shelter');
      await findShelter();
    }
    
    // Check for nearby dangers
    const entities = Object.values(bot.entities);
    const hostiles = entities.filter(e => 
      ['creeper', 'zombie', 'skeleton', 'spider', 'enderman'].includes(e.name)
    );
    
    if (hostiles.length > 0) {
      const nearest = hostiles[0];
      const dist = Math.sqrt(
        Math.pow(nearest.position.x - bot.entity.position.x, 2) +
        Math.pow(nearest.position.z - bot.entity.position.z, 2)
      );
      
      if (dist < 8) {
        console.log(`[SURVIVAL] ⚠️ ${nearest.name} nearby (${Math.floor(dist)} blocks)`);
        
        if (behaviors.autoFlee && bot.health < 12) {
          console.log('[SURVIVAL] Running from danger!');
          await fleeFromDanger();
        }
      }
    }
    
    // Check for lava/fire nearby
    const nearbyBlock = await checkBlocksAround(3, ['lava', 'fire']);
    if (nearbyBlock) {
      console.log('[SURVIVAL] 🔥 Danger detected - fleeing');
      await fleeFromDanger();
    }
    
    // Check if falling
    if (bot.entity.velocity && bot.entity.velocity.y < -0.5) {
      console.log('[SURVIVAL] Falling!');
      await handleFalling();
    }
    
  } catch (e) {
    // Ignore
  }
}

// Flee from danger
async function fleeFromDanger() {
  console.log('[SURVIVAL] Running away!');
  
  // Stop any current action
  await executor.emergencyStop();
  
  // Sprint in random safe direction
  bot.setControlState('sprint', true);
  
  // Run for 3 seconds
  bot.setControlState('forward', true);
  await sleep(3000);
  bot.setControlState('forward', false);
  bot.setControlState('sprint', false);
  
  // Look for safe spot
  await findSafeSpot();
}

// Find shelter at night
async function findShelter() {
  console.log('[SURVIVAL] Looking for shelter...');
  
  // Check for nearby caves or buildings
  const blocks = scanNearbyBlocks(8, ['cave_air', 'oak_planks', 'cobblestone']);
  
  if (blocks.length > 0) {
    // Go to shelter
    const shelter = blocks[0];
    await tools.walkTo(shelter.x, shelter.y, shelter.z);
    bot.chat('🏠 Safe for the night');
  } else {
    // Find a wall to hide against
    await explore(10);
  }
}

// Find safe spot
async function findSafeSpot() {
  console.log('[SURVIVAL] Looking for safe spot...');
  
  // Look for water or open area
  const water = scanNearbyBlocks(6, ['water']);
  
  if (water.length > 0) {
    const w = water[0];
    await tools.walkTo(w.x, w.y, w.z);
    bot.chat('💧 Safe at water');
    return;
  }
  
  // Just explore away from danger
  await tools.explore(15);
}

// Handle falling
async function handleFalling() {
  if (!bot) return;
  
  // Try to place water bucket below
  const inventory = bot.inventory.items();
  const waterBucket = inventory.find(i => i.name === 'water_bucket');
  
  if (waterBucket) {
    await bot.equip(waterBucket, 'hand');
    // Place below
    const pos = bot.entity.position;
    try {
      await bot.placeBlock(
        bot.blockAt({ x: Math.floor(pos.x), y: Math.floor(pos.y) - 1, z: Math.floor(pos.z) }),
        new (require('prismarine-vector'))(0, -1, 0)
      );
      console.log('[SURVIVAL] Water bucket placed!');
    } catch (e) {
      // Ignore
    }
  }
}

// Scan blocks around player
function scanNearbyBlocks(range, blockTypes) {
  if (!bot || !bot.entity) return [];
  
  const pos = bot.entity.position;
  const blocks = [];
  
  for (let x = pos.x - range; x <= pos.x + range; x++) {
    for (let y = pos.y - range; y <= pos.y + range; y++) {
      for (let z = pos.z - range; z <= pos.z + range; z++) {
        try {
          const block = bot.blockAt(new (require('prismarine-vector'))(x, y, z));
          if (block && blockTypes.includes(block.name)) {
            blocks.push({ x, y, z, name: block.name });
          }
        } catch (e) {
          // Ignore
        }
      }
    }
  }
  
  return blocks;
}

// Check specific blocks
async function checkBlocksAround(range, blockTypes) {
  return scanNearbyBlocks(range, blockTypes);
}

// Manual trigger behaviors
async function onPlayerAttack(attacker) {
  if (!behaviors.autoAttack) return;
  
  console.log(`[SURVIVAL] Attacked by ${attacker.username || attacker.name}`);
  bot.chat(`😠 Why did you attack me?!`);
  
  // Attack back once
  await tools.attack(attacker.username || attacker.name, 1000);
}

async function onPlayerInteract(player) {
  console.log(`[SURVIVAL] Interacted by ${player.username}`);
  
  // Friendly response
  const greetings = ['Hello!', 'Hi there!', 'Hey!', 'Greetings!'];
  const greeting = greetings[Math.floor(Math.random() * greetings.length)];
  bot.chat(greeting);
}

// Enable/disable behaviors
function setBehavior(name, enabled) {
  if (behaviors.hasOwnProperty(name)) {
    behaviors[name] = enabled;
    console.log(`[SURVIVAL] ${name}: ${enabled ? 'ON' : 'OFF'}`);
  }
}

function getBehaviors() {
  return { ...behaviors };
}

// Get survival status
function getStatus() {
  if (!bot || !bot.entity) {
    return { connected: false };
  }
  
  return {
    connected: true,
    health: bot.health,
    food: bot.food,
    behaviors: behaviors,
    isNight: bot.world.time > 14000 && bot.world.time < 22000,
    nearbyHostiles: Object.values(bot.entities).filter(e => 
      ['creeper', 'zombie', 'skeleton'].includes(e.name)
    ).length
  };
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  init,
  setBehavior,
  getBehaviors,
  getStatus,
  onPlayerAttack,
  onPlayerInteract,
  fleeFromDanger,
  findShelter
};