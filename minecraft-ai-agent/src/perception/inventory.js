// Perception Module: Inventory & Self-Awareness
// Phase 1.5: Inventory & Self-Awareness - Task 1.5.1
// Tracks bot's inventory, equipment, armor, and self-state

let bot = null;

// Initialize inventory module with bot reference
function init(botInstance) {
  bot = botInstance;
  console.log('[INVENTORY] ✓ Inventory module initialized');
}

// ==================== INVENTORY FUNCTIONS ====================

// Get all items in bot's inventory
function getInventory() {
  if (!bot.inventory) return [];
  
  try {
    const items = bot.inventory.items();
    const inventoryList = [];
    
    for (const item of items) {
      if (item && item.name) {
        inventoryList.push({
          name: item.name,
          count: item.count || 1,
          durability: item.durability || null,
          maxDurability: item.maxDurability || null,
          enchantments: item.enchantments || [],
          displayName: item.displayName || item.name
        });
      }
    }
    
    return inventoryList;
  } catch (e) {
    console.log('[INVENTORY] Error reading inventory:', e.message);
    return [];
  }
}

// Get inventory grouped by item type
function getInventoryGrouped() {
  const inventory = getInventory();
  const grouped = {};
  
  for (const item of inventory) {
    if (!grouped[item.name]) {
      grouped[item.name] = { count: 0, items: [] };
    }
    grouped[item.name].count += item.count;
    grouped[item.name].items.push(item);
  }
  
  return grouped;
}

// Get item count by name
function getItemCount(itemName) {
  const inventory = getInventory();
  let count = 0;
  
  for (const item of inventory) {
    if (item.name.includes(itemName)) {
      count += item.count;
    }
  }
  
  return count;
}

// ==================== EQUIPMENT FUNCTIONS ====================

// Get currently equipped item in hand
function getEquippedItem() {
  try {
    // Try main hand first
    if (bot.heldItem) {
      return {
        name: bot.heldItem.name,
        count: bot.heldItem.count || 1,
        durability: bot.heldItem.durability || null,
        maxDurability: bot.heldItem.maxDurability || null,
        slot: 'mainhand'
      };
    }
    
    // Try to get from quickBarSlot
    if (bot.quickBarSlot !== undefined && bot.inventory) {
      const hotbarStart = 36; // Hotbar starts at slot 36
      const slot = hotbarStart + bot.quickBarSlot;
      const item = bot.inventory.slots[slot];
      
      if (item && item.name) {
        return {
          name: item.name,
          count: item.count || 1,
          durability: item.durability || null,
          maxDurability: item.maxDurability || null,
          slot: 'mainhand',
          quickBarSlot: bot.quickBarSlot
        };
      }
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// Get offhand item
function getOffhandItem() {
  try {
    if (bot.inventory && bot.inventory.slots) {
      // Offhand slot is slot 45
      const offhandSlot = 45;
      const item = bot.inventory.slots[offhandSlot];
      
      if (item && item.name) {
        return {
          name: item.name,
          count: item.count || 1,
          durability: item.durability || null,
          maxDurability: item.maxDurability || null,
          slot: 'offhand'
        };
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

// Get all armor pieces
function getArmor() {
  const armorSlots = {
    100: { slot: 'head', name: 'helmet' },
    101: { slot: 'chest', name: 'chestplate' },
    102: { slot: 'legs', name: 'leggings' },
    103: { slot: 'feet', name: 'boots' }
  };
  
  const armor = [];
  
  try {
    if (bot.inventory && bot.inventory.slots) {
      for (const [slotNum, slotInfo] of Object.entries(armorSlots)) {
        const slot = parseInt(slotNum);
        const item = bot.inventory.slots[slot];
        
        if (item && item.name) {
          armor.push({
            slot: slotInfo.slot,
            name: item.name,
            count: item.count || 1,
            durability: item.durability || null,
            maxDurability: item.maxDurability || null
          });
        }
      }
    }
  } catch (e) {
    console.log('[INVENTORY] Error reading armor:', e.message);
  }
  
  return armor;
}

// Calculate total armor protection
function getArmorProtection() {
  const armor = getArmor();
  let protection = 0;
  
  // Approximate armor points (vanilla values)
  const armorPoints = {
    'leather': 2,
    'iron': 5,
    'diamond': 6,
    'netherite': 7,
    'gold': 3,
    'chainmail': 5,
    'turtle': 5,
    'elytra': 6
  };
  
  for (const piece of armor) {
    const material = Object.keys(armorPoints).find(m => piece.name?.includes(m));
    if (material) {
      protection += armorPoints[material];
    }
  }
  
  return protection;
}

// ==================== HEALTH STATUS ====================

// Get detailed health status
function getHealthStatus() {
  return {
    health: bot.health || 0,
    maxHealth: bot.maxHealth || 20,
    food: bot.food || 0,
    maxFood: 20,
    saturation: bot.saturation || 0,
    exhaustion: bot.exhaustion || 0,
    oxygen: bot.oxygen || 300,
    maxOxygen: 300
  };
}

// Get health percentage
function getHealthPercentage() {
  const health = bot.health || 0;
  const maxHealth = bot.maxHealth || 20;
  return Math.round((health / maxHealth) * 100);
}

// Get food percentage
function getFoodPercentage() {
  const food = bot.food || 0;
  return Math.round((food / 20) * 100);
}

// ==================== INTERACTIVE BLOCKS ====================

// Scan for nearby interactive blocks
function getNearbyInteractiveBlocks(radius = 8) {
  if (!bot || !bot.entity) return [];
  
  const pos = bot.entity.position;
  const interactiveBlockTypes = [
    'crafting_table', 'furnace', 'blast_furnace', 'smoker',
    'chest', 'trapped_chest', 'barrel', 'hopper', 'dispenser',
    'dropper', 'anvil', 'grindstone', 'stonecutter', 'lectern',
    'loom', 'cartography_table', 'smithing_table', 'campfire',
    'soul_campfire', 'beacon', 'enchanting_table', 'bookshelf'
  ];
  
  const foundBlocks = [];
  
  try {
    for (let x = -radius; x <= radius; x++) {
      for (let y = -2; y <= radius; y++) {
        for (let z = -radius; z <= radius; z++) {
          try {
            const block = bot.blockAt(pos.offset(x, y, z));
            if (block && block.name && interactiveBlockTypes.includes(block.name)) {
              foundBlocks.push({
                name: block.name,
                x: Math.floor(pos.x) + x,
                y: Math.floor(pos.y) + y,
                z: Math.floor(pos.z) + z,
                distance: Math.floor(Math.sqrt(x*x + y*y + z*z))
              });
            }
          } catch (e) {
            // Ignore errors
          }
        }
      }
    }
  } catch (e) {
    console.log('[INVENTORY] Error scanning blocks:', e.message);
  }
  
  // Sort by distance
  return foundBlocks.sort((a, b) => a.distance - b.distance);
}

// ==================== COMPLETE SELF-STATE ====================

// Get complete self-state JSON
function getSelfState() {
  const healthStatus = getHealthStatus();
  const position = getPosition();
  const time = getTimeOfDay();
  const biome = getBiome();
  const weather = getWeather();
  
  return {
    // Core stats
    health: healthStatus.health,
    maxHealth: healthStatus.maxHealth,
    healthPercentage: getHealthPercentage(),
    food: healthStatus.food,
    maxFood: healthStatus.maxFood,
    foodPercentage: getFoodPercentage(),
    saturation: healthStatus.saturation,
    oxygen: healthStatus.oxygen,
    
    // Position & Location
    position: position,
    biome: biome,
    timeOfDay: time,
    weather: weather,
    
    // Equipment
    mainHand: getEquippedItem(),
    offHand: getOffhandItem(),
    armor: getArmor(),
    armorProtection: getArmorProtection(),
    
    // Inventory
    inventory: getInventory(),
    inventoryCount: getInventory().length,
    
    // Nearby
    nearbyInteractiveBlocks: getNearbyInteractiveBlocks(),
    nearbyEntities: getNearbyEntities(),
    
    // Metadata
    timestamp: Date.now(),
    botName: bot.username
  };
}

// ==================== HELPER FUNCTIONS ====================

// Get bot position
function getPosition() {
  if (!bot || !bot.entity) return null;
  
  const pos = bot.entity.position;
  return {
    x: Math.floor(pos.x),
    y: Math.floor(pos.y),
    z: Math.floor(pos.z)
  };
}

// Get time of day
function getTimeOfDay() {
  if (!bot || !bot.world) return 'unknown';
  
  const time = bot.world.time || 0;
  
  if (time >= 0 && time < 6000) return 'day';
  if (time >= 6000 && time < 12000) return 'sunset';
  if (time >= 12000 && time < 18000) return 'night';
  if (time >= 18000 && time < 24000) return 'midnight';
  
  return 'day';
}

// Get biome
function getBiome() {
  if (!bot || !bot.entity) return 'unknown';
  
  try {
    const pos = bot.entity.position;
    return bot.world.getBiome(Math.floor(pos.x), Math.floor(pos.y), Math.floor(pos.z)) || 'unknown';
  } catch (e) {
    return 'unknown';
  }
}

// Get weather
function getWeather() {
  try {
    const isRaining = bot.world?.isRaining?.() || false;
    const isThundering = bot.world?.isThundering?.() || false;
    
    if (isThundering) return 'thunderstorm';
    if (isRaining) return 'rain';
    return 'clear';
  } catch (e) {
    return 'clear';
  }
}

// Get nearby entities
function getNearbyEntities(radius = 10) {
  if (!bot || !bot.entity || !bot.entities) return [];
  
  const pos = bot.entity.position;
  const entities = [];
  
  const HOSTILE = ['creeper', 'zombie', 'skeleton', 'spider', 'enderman'];
  
  for (const entity of Object.values(bot.entities)) {
    if (!entity.position || entity === bot.entity) continue;
    
    const dist = Math.sqrt(
      Math.pow(entity.position.x - pos.x, 2) +
      Math.pow(entity.position.y - pos.y, 2) +
      Math.pow(entity.position.z - pos.z, 2)
    );
    
    if (dist <= radius) {
      const name = entity.name || entity.type || 'unknown';
      const isHostile = HOSTILE.some(h => name.toLowerCase().includes(h));
      
      entities.push({
        name: name,
        type: entity.type,
        distance: Math.floor(dist),
        hostile: isHostile
      });
    }
  }
  
  return entities;
}

// ==================== QUICK STATUS ====================

// Quick status for heartbeat
function getQuickStatus() {
  const healthStatus = getHealthStatus();
  
  return {
    health: `${healthStatus.health}/${healthStatus.maxHealth}`,
    food: `${healthStatus.food}/20`,
    mainHand: getEquippedItem()?.name || 'empty',
    inventoryCount: getInventory().length,
    armorProtection: getArmorProtection()
  };
}

// ==================== REPORTS ====================

// Generate human-readable inventory report
function generateInventoryReport() {
  const state = getSelfState();
  const healthStatus = getHealthStatus();
  
  let report = `📦 Inventory Report:\n`;
  report += `❤️ Health: ${healthStatus.health}/${healthStatus.maxHealth} (${getHealthPercentage()}%)\n`;
  report += `🍎 Food: ${healthStatus.food}/20 (${getFoodPercentage()}%)\n`;
  
  const mainHand = getEquippedItem();
  report += `✋ Holding: ${mainHand ? mainHand.name : 'nothing'}\n`;
  
  const armor = getArmor();
  if (armor.length > 0) {
    report += `🛡️ Armor: ${armor.map(a => a.name.split('_')[0]).join(', ')}\n`;
  } else {
    report += `🛡️ Armor: none\n`;
  }
  
  const inventory = getInventory();
  if (inventory.length > 0) {
    report += `📦 Items: ${inventory.length} types\n`;
    report += `   Top: ${inventory.slice(0, 5).map(i => `${i.name}x${i.count}`).join(', ')}`;
  } else {
    report += `📦 Items: empty`;
  }
  
  return report;
}

// ==================== EXPORTS ====================

module.exports = {
  init,
  // Inventory
  getInventory,
  getInventoryGrouped,
  getItemCount,
  // Equipment
  getEquippedItem,
  getOffhandItem,
  getArmor,
  getArmorProtection,
  // Health
  getHealthStatus,
  getHealthPercentage,
  getFoodPercentage,
  // Blocks
  getNearbyInteractiveBlocks,
  // Main
  getSelfState,
  getQuickStatus,
  generateInventoryReport
};