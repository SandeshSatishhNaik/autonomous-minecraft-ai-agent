// Intellect Module: Prompt Formatter - SIMPLIFIED
// Handles missing bot data gracefully, returns compact prompts

const { getSystemPrompt, getDecisionPrompt } = require('./systemPrompt');

let scanner = null;
let inventory = null;

function setModules(scannerMod, inventoryMod) {
  scanner = scannerMod;
  inventory = inventoryMod;
}

function formatScannerData() {
  try {
    if (!scanner || !scanner.scanEnvironment) {
      return { status: 'no_scanner', position: 'unknown', biome: 'unknown', hostiles: 0 };
    }
    
    const scan = scanner.scanEnvironment(true);
    
    if (!scan) {
      return { status: 'no_scan', position: 'unknown', biome: 'unknown', hostiles: 0 };
    }
    
    const pos = scan.position || {};
    const hostiles = scan.entities?.hostile || [];
    
    return {
      status: scan.status || 'ok',
      position: pos.x != null ? `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}` : 'unknown',
      biome: scan.biome?.name || 'unknown',
      time: scan.time?.period || 'day',
      weather: scan.weather?.name || 'clear',
      hostiles: hostiles.length,
      hostileTypes: hostiles.slice(0, 3).map(e => e.name).join(', ') || 'none',
      ores: scan.resources?.ores?.slice(0, 3).join(', ') || 'none',
      trees: scan.resources?.trees?.slice(0, 3).join(', ') || 'none'
    };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

function formatInventoryData() {
  try {
    if (!inventory || !inventory.getStats) {
      return { status: 'no_inventory', health: 20, food: 20, items: 'none' };
    }
    
    const stats = inventory.getStats();
    const inv = inventory.getInventory ? inventory.getInventory() : [];
    const equipped = inventory.getEquippedItem ? inventory.getEquippedItem() : null;
    
    return {
      status: 'ok',
      health: stats.health || 20,
      food: stats.food || 20,
      armor: stats.armor || 0,
      itemCount: inv.length,
      items: inv.slice(0, 5).map(i => i.name).join(', ') || 'none',
      equipped: equipped || 'none'
    };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

function getFullPerceptionData() {
  const scannerData = formatScannerData();
  const inventoryData = formatInventoryData();
  
  return {
    scanner: scannerData,
    inventory: inventoryData
  };
}

function buildDecisionPrompt(context = {}) {
  const perceptionData = getFullPerceptionData();
  
  const systemPrompt = getSystemPrompt({
    learnedRules: context.learnedRules || [],
    currentGoal: context.currentGoal || null
  });
  
  let userPrompt = `Health:${perceptionData.inventory.health} Food:${perceptionData.inventory.food} `;
  userPrompt += `Pos:${perceptionData.scanner.position} Biome:${perceptionData.scanner.biome} `;
  userPrompt += `Hostiles:${perceptionData.scanner.hostiles} (${perceptionData.scanner.hostileTypes}) `;
  userPrompt += `Items:${perceptionData.inventory.items} `;
  userPrompt += `Goal:${context.currentGoal || 'survive'}`;
  
  return {
    system: systemPrompt,
    user: userPrompt,
    perception: perceptionData
  };
}

module.exports = {
  setModules,
  formatScannerData,
  formatInventoryData,
  getFullPerceptionData,
  buildDecisionPrompt
};