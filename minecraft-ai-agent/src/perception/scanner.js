// Perception Module: Scanner (Enhanced)
// Phase 1: The Senses - Task 4
// Advanced environment scanning with smart detection

let bot = null;

// Cache for performance
let scanCache = {
  lastScan: null,
  timestamp: 0,
  cacheDuration: 1000 // 1 second cache
};

// Block categories for smart scanning
const BLOCK_CATEGORIES = {
  ORE: ['coal_ore', 'iron_ore', 'gold_ore', 'diamond_ore', 'redstone_ore', 'lapis_ore', 'emerald_ore', 'copper_ore', 'deepslate_coal_ore', 'deepslate_iron_ore', 'deepslate_gold_ore', 'deepslate_diamond_ore', 'deepslate_redstone_ore', 'deepslate_lapis_ore', 'deepslate_emerald_ore'],
  MINERAL: ['clay', 'gravel', 'sand', 'dirt', 'stone', 'granite', 'diorite', 'andesite', 'tuff', 'dripstone', ' calcite', 'sandstone'],
  DANGER: ['lava', 'fire', 'magma_block', 'cactus', 'sweet_berry_bush', 'wither_rose', 'powder_snow'],
  WATER: ['water', 'bubbles', 'kelp', 'seagrass', 'tall_seagrass'],
  TREE: ['oak_log', 'birch_log', 'spruce_log', 'jungle_log', 'dark_oak_log', 'acacia_log', 'mangrove_log', 'oak_leaves', 'birch_leaves', 'spruce_leaves', 'jungle_leaves'],
  BUILDING: ['oak_planks', 'birch_planks', 'spruce_planks', 'cobblestone', 'bricks', 'stone_bricks', 'glass', 'iron_bars', 'fence'],
  INTERACTIVE: ['furnace', 'blast_furnace', 'smoker', 'chest', 'trapped_chest', 'barrel', 'crafting_table', 'anvil', 'grindstone', 'loom', 'cartography_table', 'lectern', 'bookshelf', 'enchanting_table'],
  LIGHT: ['torch', 'soul_torch', 'lantern', 'glowstone', 'sea_lantern', 'shroomlight'],
  CROPS: ['wheat', 'carrots', 'potatoes', 'beetroots', 'pumpkin', 'melon', 'sweet_berry_bush', 'cocoa']
};

// Initialize scanner with bot reference
function init(botInstance) {
  bot = botInstance;
  console.log('[SCANNER] ✓ Scanner module initialized (enhanced)');
}

// Get bot's current position with metadata
function getPosition() {
  if (!bot || !bot.entity || !bot.entity.position) return null;
  
  const pos = bot.entity.position;
  const velocity = bot.entity.velocity;
  
  // Handle NaN or invalid positions
  const x = isNaN(pos.x) ? 0 : Math.floor(pos.x);
  const y = isNaN(pos.y) ? 0 : Math.floor(pos.y);
  const z = isNaN(pos.z) ? 0 : Math.floor(pos.z);
  
  return {
    x: x,
    y: y,
    z: z,
    exact: { 
      x: isNaN(pos.x) ? '0' : pos.x.toFixed(2), 
      y: isNaN(pos.y) ? '0' : pos.y.toFixed(2), 
      z: isNaN(pos.z) ? '0' : pos.z.toFixed(2) 
    },
    velocity: velocity ? { 
      x: isNaN(velocity.x) ? '0' : velocity.x.toFixed(2), 
      y: isNaN(velocity.y) ? '0' : velocity.y.toFixed(2), 
      z: isNaN(velocity.z) ? '0' : velocity.z.toFixed(2) 
    } : null,
    isOnGround: bot.entity.isInWater || bot.entity.onGround
  };
}

// Get compass direction (N/S/E/W)
function getCompassDirection() {
  if (!bot || !bot.entity) return 'unknown';
  
  const yaw = bot.entity.yaw || 0;
  // Convert yaw to compass direction (Minecraft yaw: 0 = South, negative = West)
  const degrees = (yaw * 180 / Math.PI) % 360;
  
  if (degrees > 135 || degrees < -135) return 'north';
  if (degrees >= -135 && degrees <= -45) return 'east';
  if (degrees > -45 && degrees <= 45) return 'south';
  if (degrees > 45 && degrees <= 135) return 'west';
  
  return 'unknown';
}

// Get time of day with detailed info
function getTimeOfDay() {
  if (!bot || !bot.world) return { period: 'unknown', ticks: 0 };
  
  const time = bot.world.time;
  let period, phase;
  
  if (time >= 0 && time < 6000) {
    period = 'day';
    phase = 'morning';
  } else if (time >= 6000 && time < 7000) {
    period = 'day';
    phase = 'afternoon';
  } else if (time >= 7000 && time < 12000) {
    period = 'sunset';
    phase = 'dusk';
  } else if (time >= 12000 && time < 18000) {
    period = 'night';
    phase = 'evening';
  } else if (time >= 18000 && time < 22000) {
    period = 'night';
    phase = 'midnight';
  } else {
    period = 'dawn';
    phase = 'early';
  }
  
  return { period, phase, ticks: time };
}

// Get dimension name
function getDimension() {
  if (!bot || !bot.world) return 'unknown';
  
  try {
    const dimension = bot.world.dimension;
    if (dimension?.includes('nether')) return 'nether';
    if (dimension?.includes('end')) return 'end';
    return 'overworld';
  } catch (e) {
    return 'overworld';
  }
}

// Get weather status
function getWeather() {
  if (!bot || !bot.world) return 'clear';
  
  try {
    // Check if it's raining (world has weather)
    const isRaining = bot.world.isRaining?.() || false;
    const isThunder = bot.world.isThundering?.() || false;
    
    if (isThunder) return 'thunderstorm';
    if (isRaining) return 'rain';
    return 'clear';
  } catch (e) {
    return 'clear';
  }
}

// Get biome name with ID
function getBiome() {
  if (!bot || !bot.entity) return { name: 'unknown', id: -1 };
  
  try {
    const pos = bot.entity.position;
    if (!pos || isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) {
      return { name: 'unknown', id: -1 };
    }
    const biomeName = bot.world.getBiome(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z));
    return { name: biomeName || 'unknown', id: 0 };
  } catch (e) {
    return { name: 'unknown', id: -1 };
  }
}

// Get block below the bot
function getBlockBelow() {
  if (!bot || !bot.entity || !bot.entity.position) return null;
  
  try {
    const pos = bot.entity.position;
    if (!pos || isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return null;
    
    const blockBelow = bot.blockAt(pos.offset(0, -1, 0));
    
    if (blockBelow) {
      return {
        name: blockBelow.name,
        type: getBlockType(blockBelow.name),
        hardness: blockBelow.hardness
      };
    }
  } catch (e) {
    return null;
  }
  
  return null;
}

// Categorize block type
function getBlockType(blockName) {
  for (const [category, blocks] of Object.entries(BLOCK_CATEGORIES)) {
    if (blocks.includes(blockName)) return category;
  }
  return 'OTHER';
}

// Smart block scanner - only detect important blocks
function scanBlocks(radius = 3) {
  if (!bot || !bot.entity || !bot.entity.position) return { all: [], important: [], byCategory: {} };
  
  const pos = bot.entity.position;
  if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return { all: [], important: [], byCategory: {} };
  
  const allBlocks = [];
  const importantBlocks = [];
  const byCategory = {};
  
  // Optimized scan with bounding box
  for (let x = -radius; x <= radius; x++) {
    for (let y = -1; y <= radius + 2; y++) {
      for (let z = -radius; z <= radius; z++) {
        try {
          const block = bot.blockAt(pos.offset(x, y, z));
          if (block && block.name !== 'air') {
            const blockInfo = {
              name: block.name,
              type: getBlockType(block.name),
              x: Math.floor(pos.x) + x,
              y: Math.floor(pos.y) + y,
              z: Math.floor(pos.z) + z
            };
            
            allBlocks.push(blockInfo);
            
            // Track important blocks
            if (blockInfo.type !== 'OTHER') {
              importantBlocks.push(blockInfo);
              
              if (!byCategory[blockInfo.type]) {
                byCategory[blockInfo.type] = [];
              }
              byCategory[blockInfo.type].push(blockInfo.name);
            }
          }
        } catch (e) {
          // Ignore errors for unreachable blocks
        }
      }
    }
  }
  
  // Remove duplicates from categories
  for (const category in byCategory) {
    byCategory[category] = [...new Set(byCategory[category])];
  }
  
  return { all: allBlocks, important: importantBlocks, byCategory };
}

// Enhanced entity scanner with threat assessment
function scanEntities(radius = 12) {
  if (!bot || !bot.entity || !bot.entity.position) return { all: [], hostile: [], passive: [], players: [] };
  
  const pos = bot.entity.position;
  if (isNaN(pos.x) || isNaN(pos.y) || isNaN(pos.z)) return { all: [], hostile: [], passive: [], players: [] };
  
  const all = [];
  const hostile = [];
  const passive = [];
  const players = [];
  
  const HOSTILE_MOBS = ['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'piglin', 'hoglin', 'warden', 'blaze', 'magma_cube', 'ghast', 'piglin_brute', 'zoglin'];
  const PASSIVE_MOBS = ['cow', 'pig', 'sheep', 'chicken', 'horse', 'donkey', 'rabbit', 'fox', 'bat', 'cod', 'salmon', 'tropical_fish', 'axolotl', 'glow_squid', 'sniffer'];
  
  if (!bot.entities) return { all: [], hostile: [], passive: [], players: [] };
  
  for (const entity of Object.values(bot.entities)) {
    if (!entity.position || entity === bot.entity) continue;
    
    // Skip entities with invalid positions
    if (isNaN(entity.position.x) || isNaN(entity.position.y) || isNaN(entity.position.z)) continue;
    
    const dist = Math.sqrt(
      Math.pow(entity.position.x - pos.x, 2) +
      Math.pow(entity.position.y - pos.y, 2) +
      Math.pow(entity.position.z - pos.z, 2)
    );
    
    if (dist > radius || dist <= 0) continue;
    
    const entityName = (entity.name || entity.type || 'unknown').toLowerCase();
    const isHostile = HOSTILE_MOBS.some(m => entityName.includes(m));
    const isPassive = PASSIVE_MOBS.some(m => entityName.includes(m));
    const isPlayer = entity.type === 'player';
    
    const entityInfo = {
      name: entity.name || entity.type,
      type: entity.type,
      distance: Math.floor(dist),
      x: Math.floor(entity.position.x),
      y: Math.floor(entity.position.y),
      z: Math.floor(entity.position.z),
      threatLevel: isHostile ? 'high' : isPassive ? 'low' : 'neutral'
    };
    
    all.push(entityInfo);
    
    if (isHostile) hostile.push(entityInfo);
    else if (isPassive) passive.push(entityInfo);
    else if (isPlayer) players.push(entityInfo);
  }
  
  return { all, hostile, passive, players };
}

// Scan for specific resources
function findNearbyResources() {
  const blocks = scanBlocks(4);
  const resources = {
    ores: [],
    trees: [],
    water: [],
    dangers: []
  };
  
  for (const block of blocks.all) {
    switch (block.type) {
      case 'ORE':
        resources.ores.push(block.name);
        break;
      case 'TREE':
        resources.trees.push(block.name);
        break;
      case 'WATER':
        resources.water.push({ name: block.name, y: block.y });
        break;
      case 'DANGER':
        resources.dangers.push({ name: block.name, x: block.x, y: block.y, z: block.z });
        break;
    }
  }
  
  // Deduplicate
  resources.ores = [...new Set(resources.ores)];
  resources.trees = [...new Set(resources.trees)];
  
  return resources;
}

// Main scan function - enhanced version with caching
function scanEnvironment(forceRefresh = false) {
  // If bot is not initialized, return empty state
  if (!bot || !bot.entity || !bot.entity.position) {
    return {
      position: null,
      time: getTimeOfDay(),
      biome: getBiome(),
      blocks: { all: [], important: [], byCategory: {} },
      entities: { all: [], hostile: [], passive: [], players: [] },
      status: 'waiting_for_bot'
    };
  }
  
  const now = Date.now();
  
  // Return cached result if recent
  if (!forceRefresh && scanCache.lastScan && (now - scanCache.timestamp) < scanCache.cacheDuration) {
    return scanCache.lastScan;
  }
  
  try {
    const result = {
      timestamp: now,
      position: getPosition(),
      direction: getCompassDirection(),
      time: getTimeOfDay(),
      dimension: getDimension(),
      weather: getWeather(),
      biome: getBiome(),
      blockBelow: getBlockBelow(),
      blocks: scanBlocks(3),
      entities: scanEntities(12),
      resources: findNearbyResources(),
      summary: generateSummary()
    };
    
    // Update cache
    scanCache.lastScan = result;
    scanCache.timestamp = now;
    
    return result;
  } catch (e) {
    console.log('[SCANNER] Error in scanEnvironment:', e.message);
    return {
      position: getPosition(),
      time: getTimeOfDay(),
      biome: getBiome(),
      blocks: { all: [], important: [], byCategory: {} },
      entities: { all: [], hostile: [], passive: [], players: [] },
      error: e.message
    };
  }
}

// Generate human-readable summary for LLM
function generateSummary() {
  try {
    if (!bot || !bot.entity || !bot.entity.position) {
      return 'Bot position not available';
    }
    
    const pos = bot.entity.position;
    const biomeName = getBiome().name || 'unknown';
    const timePeriod = getTimeOfDay().period || 'unknown';
    const entities = scanEntities(12);
    const resources = findNearbyResources();
    
    let summary = `Bot at ${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)} `;
    summary += `in ${biomeName} biome. Time: ${timePeriod}. `;
    
    if (entities.hostile.length > 0) {
      const names = [...new Set(entities.hostile.map(e => e.name))].join(', ');
      summary += `⚠️ Hostiles: ${names} (${entities.hostile.length} nearby). `;
    }
    
    if (resources.ores.length > 0) {
      summary += `💎 Ores: ${resources.ores.join(', ')}. `;
    }
    
    if (resources.trees.length > 0) {
      summary += `🌲 Trees: ${resources.trees.join(', ')}. `;
    }
    
    if (resources.water.length > 0) {
      summary += `💧 Water found. `;
    }
    
    if (resources.dangers.length > 0) {
      const dangers = resources.dangers.map(d => d.name).join(', ');
      summary += `🔥 Dangers: ${dangers}. `;
    }
    
    return summary;
  } catch (e) {
    return `Error generating summary: ${e.message}`;
  }
}

// Get quick status for heartbeat
function getQuickStatus() {
  if (!bot || !bot.entity) return null;
  
  const pos = bot.entity.position;
  const entities = scanEntities(8);
  
  return {
    position: `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}`,
    health: bot.health,
    food: bot.food,
    nearbyHostiles: entities.hostile.length,
    dimension: getDimension(),
    time: getTimeOfDay().period
  };
}

// Export all functions
module.exports = {
  init,
  getPosition,
  getCompassDirection,
  getTimeOfDay,
  getDimension,
  getWeather,
  getBiome,
  getBlockBelow,
  scanBlocks,
  scanEntities,
  findNearbyResources,
  scanEnvironment,
  generateSummary,
  getQuickStatus
};