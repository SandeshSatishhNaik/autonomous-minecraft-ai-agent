// Muscles Module: Tools - Simplified Working Version
// Phase 3: The Muscles - Core action functions

let bot = null;
let Vec3 = null;

function init(botInstance) {
  bot = botInstance;
  try {
    Vec3 = require('prismarine-vector');
  } catch (e) {
    console.log('[MUSCLES] prismarine-vector not available, using fallback');
  }
  console.log('[MUSCLES] ✓ Tools initialized');
}

// ============================================
// MOVEMENT
// ============================================

async function walkTo(x, y, z) {
  if (!bot || !bot.entity) {
    return { success: false, error: 'No bot' };
  }
  
  if (x === null || y === null || z === null || isNaN(x) || isNaN(y) || isNaN(z)) {
    console.log('[WALK] Invalid coordinates, returning error');
    return { success: false, error: 'Invalid coordinates' };
  }
  
  const currentPos = bot.entity.position;
  console.log(`[WALK] Going to ${x}, ${y}, ${z}`);
  
  try {
    // Stop any existing pathfinder goal first
    if (bot.pathfinder) {
      bot.pathfinder.stop();
    }
    
    if (bot.pathfinder) {
      const { GoalNear } = require('mineflayer-pathfinder').goals;
      const goal = new GoalNear(x, y, z, 1);
      await bot.pathfinder.goto(goal);
    }
    
    return { success: true, action: 'walkTo' };
  } catch (error) {
    console.log(`[WALK] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function explore(distance = 15) {
  if (!bot || !bot.entity || !bot.entity.position) {
    console.log('[EXPLORE] No valid position, waiting...');
    return await simpleExplore();
  }
  
  const pos = bot.entity.position;
  
  // Validate position
  if (!pos || isNaN(pos.x) || isNaN(pos.z)) {
    console.log('[EXPLORE] Invalid position, using simple movement...');
    return await simpleExplore();
  }
  
  const angle = Math.random() * Math.PI * 2;
  const targetX = Math.floor(pos.x + Math.cos(angle) * distance);
  const targetZ = Math.floor(pos.z + Math.sin(angle) * distance);
  
  console.log(`[EXPLORE] Going random: ${targetX}, ${pos.y}, ${targetZ}`);
  
  return await walkTo(targetX, pos.y, targetZ);
}

// Simple fallback exploration without pathfinder
async function simpleExplore() {
  console.log('[EXPLORE] Using simple movement');
  const directions = ['forward', 'back', 'left', 'right'];
  const direction = directions[Math.floor(Math.random() * directions.length)];
  bot.setControlState(direction, true);
  await new Promise(r => setTimeout(r, 1000));
  bot.setControlState(direction, false);
  return { success: true, action: 'simpleExplore' };
}

// ============================================
// MINING
// ============================================

const RESOURCE_PRIORITY = ['oak_log', 'cobblestone', 'dirt', 'coal_ore', 'stone'];

async function mineBlock(blockName = 'cobblestone', quantity = 1) {
  if (!bot) return { success: false, error: 'No bot' };
  
  console.log(`[MINE] Mining: ${blockName}`);
  
  // Find block
  const pos = bot.entity.position;
  const range = 5;
  let targetBlock = null;
  
  for (let bx = pos.x - range; bx <= pos.x + range && !targetBlock; bx++) {
    for (let by = pos.y - range; by <= pos.y + range && !targetBlock; by++) {
      for (let bz = pos.z - range; bz <= pos.z + range && !targetBlock; bz++) {
        try {
          const blockPos = { x: bx, y: by, z: bz };
          const block = bot.blockAt(blockPos);
          if (block && (block.name === blockName || block.name.includes(blockName))) {
            targetBlock = block;
          }
        } catch (e) {}
      }
    }
  }
  
  if (!targetBlock) {
    // Try any resource
    for (const resource of RESOURCE_PRIORITY) {
      for (let bx = pos.x - range; bx <= pos.x + range && !targetBlock; bx++) {
        for (let by = pos.y - range; by <= pos.y + range && !targetBlock; by++) {
          for (let bz = pos.z - range; bz <= pos.z + range && !targetBlock; bz++) {
            try {
              const blockPos = { x: bx, y: by, z: bz };
          const block = bot.blockAt(blockPos);
              if (block && block.name === resource) {
                targetBlock = block;
                blockName = resource;
              }
            } catch (e) {}
          }
        }
      }
    }
  }
  
  if (!targetBlock) {
    console.log('[MINE] No blocks found');
    return { success: false, error: 'No blocks nearby' };
  }
  
  try {
    await bot.dig(targetBlock);
    console.log(`[MINE] Mined ${blockName}`);
    return { success: true, action: 'mineBlock', target: blockName };
  } catch (error) {
    console.log(`[MINE] Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// ============================================
// EQUIPPING
// ============================================

async function equipItem(itemName, slot = 'hand') {
  if (!bot) return { success: false, error: 'No bot' };
  
  try {
    const inventory = bot.inventory.items();
    const item = inventory.find(i => i.name.includes(itemName));
    
    if (!item) {
      return { success: false, error: 'Item not found' };
    }
    
    await bot.equip(item, slot);
    return { success: true, action: 'equipItem', item: item.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// EATING
// ============================================

async function eat(foodName = null) {
  if (!bot) return { success: false, error: 'No bot' };
  
  const foodLevel = bot.food;
  if (foodLevel >= 18) {
    return { success: false, error: 'Not hungry' };
  }
  
  const foods = ['bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'carrot', 'cookie'];
  
  try {
    const inventory = bot.inventory.items();
    let foodItem = null;
    
    if (foodName) {
      foodItem = inventory.find(i => i.name.includes(foodName));
    } else {
      for (const food of foods) {
        foodItem = inventory.find(i => i.name.includes(food));
        if (foodItem) break;
      }
    }
    
    if (!foodItem) {
      return { success: false, error: 'No food' };
    }
    
    await bot.equip(foodItem, 'hand');
    await bot.consume();
    
    return { success: true, action: 'eat', item: foodItem.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function autoEat() {
  if (!bot) return { success: false };
  
  if (bot.food < 14 || (bot.health < 12 && bot.food < 18)) {
    return await eat();
  }
  return { success: false };
}

// ============================================
// ATTACKING
// ============================================

async function attack(targetName = null, duration = 2000) {
  if (!bot) return { success: false, error: 'No bot' };
  
  try {
    // Find target
    let target = null;
    
    if (targetName) {
      target = Object.values(bot.entities).find(e => 
        e.name === targetName || e.username === targetName
      );
    } else {
      // Find nearest hostile
      const hostiles = Object.values(bot.entities).filter(e => 
        ['zombie', 'skeleton', 'creeper', 'spider', 'enderman'].includes(e.name)
      );
      
      if (hostiles.length === 0) {
        return { success: false, error: 'No hostiles' };
      }
      
      const pos = bot.entity.position;
      target = hostiles.reduce((nearest, e) => {
        if (!nearest) return e;
        const dist = Math.sqrt(Math.pow(e.position.x - pos.x, 2) + Math.pow(e.position.z - pos.z, 2));
        const nearestDist = Math.sqrt(Math.pow(nearest.position.x - pos.x, 2) + Math.pow(nearest.position.z - pos.z, 2));
        return dist < nearestDist ? e : nearest;
      }, null);
    }
    
    if (!target) {
      return { success: false, error: 'Target not found' };
    }
    
    await bot.attack(target);
    return { success: true, action: 'attack', target: target.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ============================================
// UTILITIES
// ============================================

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  init,
  walkTo,
  explore,
  mineBlock,
  equipItem,
  eat,
  autoEat,
  attack
};