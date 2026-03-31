// Intellect Module: Prompt Formatter - ULTRA-HUMAN PERCEPTION
// Real human awareness and perception of the Minecraft world

const { getSystemPrompt, getDecisionPrompt, getSurvivalMindset } = require('./systemPrompt');

let scanner = null;
let inventory = null;
let bot = null;

function setModules(botInstance, scannerMod, inventoryMod) {
  bot = botInstance;
  scanner = scannerMod;
  inventory = inventoryMod;
}

function getBotPosition() {
  if (!bot || !bot.entity) return { x: 0, y: 0, z: 0, valid: false };
  return {
    x: Math.floor(bot.entity.position.x),
    y: Math.floor(bot.entity.position.y),
    z: Math.floor(bot.entity.position.z),
    valid: true,
    raw: bot.entity.position
  };
}

function getTimeOfDay() {
  if (!bot || !bot.world) return { period: 'unknown', hours: 12, description: 'Not sure' };
  
  const time = bot.world.time || 0;
  const dayTime = time % 24000;
  const hours = Math.floor(dayTime / 1000);
  
  let period = 'day';
  let description = 'Daytime';
  let urgency = 'none';
  
  if (hours >= 0 && hours < 5) {
    period = 'morning';
    description = 'Early morning - mobs will burn soon';
    urgency = 'low';
  } else if (hours >= 5 && hours < 10) {
    period = 'day';
    description = 'Daytime - safe to explore';
    urgency = 'none';
  } else if (hours >= 10 && hours < 12) {
    period = 'late_day';
    description = 'Getting late... should find shelter soon';
    urgency = 'medium';
  } else if (hours >= 12 && hours < 14) {
    period = 'sunset';
    description = 'Sunset - it\'s getting dark!';
    urgency = 'high';
  } else if (hours >= 14 && hours < 18) {
    period = 'evening';
    description = 'Evening - mobs spawning soon';
    urgency = 'high';
  } else if (hours >= 18 && hours < 22) {
    period = 'night';
    description = 'Night - super dangerous outside!';
    urgency = 'high';
  } else if (hours >= 22) {
    period = 'late_night';
    description = 'Deep night - hope I\'m safe';
    urgency = 'medium';
  }
  
  return {
    period,
    hours,
    description,
    urgency,
    dayTime,
    totalTime: time
  };
}

function getSurvivalState() {
  if (!bot) {
    return {
      state: 'unknown',
      health: 20,
      food: 20,
      dangerLevel: 'unknown',
      needs: [],
      feelings: 'confused'
    };
  }

  const health = bot.health || 20;
  const food = bot.food || 20;

  let state = 'thriving';
  let feelings = 'Feeling good!';
  const needs = [];

  if (health <= 4) {
    state = 'critical';
    feelings = 'OMG I\'M GONNA DIE!';
    needs.push('safety', 'healing');
  } else if (health <= 8) {
    state = 'danger';
    feelings = 'Really hurt... need to be careful';
    needs.push('safety', 'healing');
  } else if (health <= 14) {
    state = 'caution';
    feelings = 'A bit banged up but okay';
    needs.push('healing');
  }

  if (food <= 3) {
    state = 'critical';
    feelings = 'STARVING! Can\'t think straight!';
    needs.unshift('food');
  } else if (food <= 6) {
    state = 'danger';
    feelings = 'So hungry... need food soon';
    needs.push('food');
  } else if (food <= 10) {
    state = 'caution';
    feelings = 'Getting hungry...';
    needs.push('food');
  } else if (food <= 14) {
    feelings = 'Could eat something but not urgent';
  }

  if (state === 'thriving' && health >= 16 && food >= 16) {
    feelings = 'Doing great! Ready for anything!';
  }

  return {
    state,
    health,
    food,
    dangerLevel: state,
    needs,
    feelings
  };
}

function getThreatLevel() {
  if (!bot || !bot.entities) {
    return { level: 'safe', threats: [], nearest: null, distance: Infinity, description: 'Nothing around' };
  }

  const pos = bot.entity?.position;
  if (!pos) return { level: 'safe', threats: [], nearest: null, distance: Infinity, description: 'Not sure where I am' };

  const entities = Object.values(bot.entities);
  
  const dangerousMobs = ['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'pillager', 'vex', 'witch', 'hoglin', 'piglin'];
  const hostiles = entities.filter(e => dangerousMobs.includes(e.name));

  if (hostiles.length === 0) {
    return { 
      level: 'safe', 
      threats: [], 
      nearest: null, 
      distance: Infinity,
      description: 'Looks clear around here'
    };
  }

  let nearest = null;
  let minDist = Infinity;
  let threatDescriptions = [];

  for (const entity of hostiles) {
    const dist = Math.sqrt(
      Math.pow(entity.position.x - pos.x, 2) +
      Math.pow(entity.position.y - pos.y, 2) +
      Math.pow(entity.position.z - pos.z, 2)
    );
    
    let desc = '';
    if (entity.name === 'creeper') desc = 'hissing!';
    else if (entity.name === 'skeleton') desc = 'with a bow!';
    else if (entity.name === 'zombie') desc = 'coming at me!';
    else if (entity.name === 'spider') desc = 'crawling around!';
    else if (entity.name === 'enderman') desc = 'tall and scary!';
    else desc = 'nearby!';
    
    threatDescriptions.push(`${entity.name} ${desc}`);
    
    if (dist < minDist) {
      minDist = dist;
      nearest = entity;
    }
  }

  let level = 'safe';
  let description = 'Something out there...';

  if (minDist < 4) {
    level = 'critical';
    description = nearest.name === 'creeper' 
      ? 'CREEPER IS RIGHT ON ME!' 
      : `${nearest.name} is RIGHT THERE!`;
  } else if (minDist < 7) {
    level = 'danger';
    description = `${nearest.name} is getting close!`;
  } else if (minDist < 12) {
    level = 'caution';
    description = `I see a ${nearest.name} in the distance`;
  } else {
    description = `There\'s a ${nearest.name} somewhere out there`;
  }

  return {
    level,
    threats: hostiles.map(e => ({
      name: e.name,
      distance: Math.sqrt(
        Math.pow(e.position.x - pos.x, 2) +
        Math.pow(e.position.z - pos.z, 2)
      )
    })),
    nearest: nearest ? { name: nearest.name, distance: minDist } : null,
    distance: minDist,
    description,
    threatDescriptions: threatDescriptions.slice(0, 4)
  };
}

function getEnvironmentalDangers() {
  if (!bot || !bot.entity) return { safe: true, dangers: [], description: 'Seems safe' };

  const pos = bot.entity.position;
  const range = 5;
  const dangers = [];
  
  for (let x = pos.x - range; x <= pos.x + range; x++) {
    for (let y = pos.y - range; y <= pos.y + range; y++) {
      for (let z = pos.z - range; z <= pos.z + range; z++) {
        try {
          const block = bot.blockAt({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
          if (!block) continue;

          if (['lava', 'fire', 'magma_block', 'soul_fire'].includes(block.name)) {
            const dist = Math.sqrt(Math.pow(x-pos.x,2) + Math.pow(z-pos.z,2));
            dangers.push({ type: 'fire', name: block.name, distance: dist });
          }
          if (block.name === 'water' && pos.y > y) {
            dangers.push({ type: 'drowning', name: 'water', distance: Math.sqrt(Math.pow(x-pos.x,2) + Math.pow(z-pos.z,2)) });
          }
          if (block.name === 'cactus') {
            dangers.push({ type: 'cactus', name: 'cactus', distance: Math.sqrt(Math.pow(x-pos.x,2) + Math.pow(z-pos.z,2)) });
          }
          if (block.name === 'sweet_berry_bush') {
            dangers.push({ type: 'berries', name: 'berry_bush', distance: Math.sqrt(Math.pow(x-pos.x,2) + Math.pow(z-pos.z,2)) });
          }
        } catch (e) {}
      }
    }
  }

  let description = 'Seems okay around here';
  if (dangers.some(d => d.type === 'fire')) description = 'It\'s hot... fire nearby!';
  if (dangers.some(d => d.type === 'drowning')) description = 'Can\'t swim very high...';
  if (dangers.some(d => d.type === 'cactus')) description = 'Ouch cactus!';

  return {
    safe: dangers.length === 0,
    dangers,
    description
  };
}

function getShelterStatus() {
  if (!bot || !bot.entity) return { hasShelter: false, nearby: [], safeAtNight: false, description: 'No idea' };

  const pos = bot.entity.position;
  const range = 10;
  const shelterBlocks = ['oak_planks', 'cobblestone', 'stone_bricks', 'bricks', 'oak_log', 'birch_log', 'spruce_log', 'dark_oak_log'];
  const lightBlocks = ['torch', 'soul_torch', 'lantern', 'soul_lantern', 'glowstone', 'fire'];
  
  let hasShelter = false;
  let nearby = [];
  let nearLight = false;
  let lightCount = 0;

  for (let x = pos.x - range; x <= pos.x + range; x++) {
    for (let y = pos.y - 2; y <= pos.y + 5; y++) {
      for (let z = pos.z - range; z <= pos.z + range; z++) {
        try {
          const block = bot.blockAt({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
          if (!block) continue;

          if (shelterBlocks.includes(block.name)) {
            hasShelter = true;
            if (nearby.length < 5) nearby.push(block.name);
          }
          if (lightBlocks.includes(block.name)) {
            nearLight = true;
            lightCount++;
          }
        } catch (e) {}
      }
    }
  }

  let description = 'Nothing around...';
  if (hasShelter && nearLight) description = 'Got shelter and light!';
  else if (hasShelter) description = 'There\'s some shelter nearby';
  else if (nearLight) description = 'There\'s some light here';
  else description = 'Nothing around... open area';

  return {
    hasShelter,
    nearby: [...new Set(nearby)],
    safeAtNight: hasShelter || nearLight,
    lightCount,
    description
  };
}

function getResourceInventory() {
  if (!bot || !bot.inventory) {
    return { items: [], hasFood: false, hasTools: false, hasWeapons: false, description: 'Empty' };
  }

  try {
    const inv = bot.inventory.items();
    const itemNames = inv.map(i => i.name);
    
    const foodItems = ['bread', 'cooked_beef', 'cooked_porkchop', 'apple', 'carrot', 'cookie', 'cake', 'melon', 'golden_apple', 'enchanted_golden_apple'];
    const toolItems = ['pickaxe', 'axe', 'shovel', 'hoe'];
    const weaponItems = ['sword', 'bow', 'crossbow'];
    
    const hasFood = itemNames.some(n => foodItems.includes(n));
    const hasTools = itemNames.some(n => toolItems.some(t => n.includes(t)));
    const hasWeapons = itemNames.some(n => weaponItems.some(w => n.includes(w)));
    const hasWood = itemNames.some(n => n.includes('planks') || n.includes('log'));
    const hasStone = itemNames.some(n => n.includes('cobblestone') || n.includes('stone'));
    const hasTorches = itemNames.includes('torch');
    const hasBucket = itemNames.includes('water_bucket');
    
    const foodCount = inv.filter(i => foodItems.includes(i.name)).length;
    const toolCount = inv.filter(i => toolItems.some(t => i.name.includes(t))).length;
    
    let description = '';
    if (foodCount > 0) description += `${foodCount} food, `;
    else description += 'No food, ';
    if (toolCount > 0) description += `${toolCount} tools`;
    else description += 'no tools';
    
    return { 
      items: itemNames.slice(0, 10), 
      fullInventory: itemNames,
      hasFood, 
      hasTools, 
      hasWeapons, 
      hasWood, 
      hasStone, 
      hasTorches,
      hasBucket,
      foodCount,
      toolCount,
      description
    };
  } catch (e) {
    return { items: [], description: 'Error checking inventory' };
  }
}

function getHeightDanger() {
  if (!bot || !bot.entity) return { level: 'safe', fallDistance: 0 };
  
  const pos = bot.entity.position;
  
  let groundY = pos.y;
  for (let y = pos.y - 1; y >= 0; y--) {
    try {
      const block = bot.blockAt({ x: Math.floor(pos.x), y: Math.floor(y), z: Math.floor(pos.z) });
      if (block && block.name !== 'air' && block.name !== 'water' && block.name !== 'lava') {
        groundY = y + 1;
        break;
      }
    } catch (e) {}
  }
  
  const fallDistance = Math.max(0, pos.y - groundY);
  let level = 'safe';
  
  if (fallDistance > 15) level = 'critical';
  else if (fallDistance > 8) level = 'danger';
  else if (fallDistance > 3) level = 'caution';
  
  return { level, fallDistance, groundY };
}

function calculateDangerScore() {
  const survival = getSurvivalState();
  const threats = getThreatLevel();
  const env = getEnvironmentalDangers();
  const time = getTimeOfDay();
  const shelter = getShelterStatus();
  const height = getHeightDanger();

  let score = 0;

  if (survival.health <= 4) score += 60;
  else if (survival.health <= 8) score += 35;
  else if (survival.health <= 14) score += 15;

  if (survival.food <= 3) score += 50;
  else if (survival.food <= 6) score += 25;
  else if (survival.food <= 10) score += 10;

  if (threats.level === 'critical') score += 50;
  else if (threats.level === 'danger') score += 30;
  else if (threats.level === 'caution') score += 15;

  if (!env.safe) score += 25;

  if (time.period === 'night' && !shelter.safeAtNight) score += 25;
  if (time.period === 'sunset' && !shelter.safeAtNight) score += 15;

  if (height.level === 'critical') score += 40;
  else if (height.level === 'danger') score += 20;

  return Math.min(Math.max(score, 0), 100);
}

function formatScannerData() {
  try {
    if (!scanner || !scanner.scanEnvironment) {
      return { status: 'unknown', position: '?', biome: '?', hostiles: 0 };
    }
    
    const scan = scanner.scanEnvironment(true);
    if (!scan) return { status: 'unknown', position: '?', biome: '?', hostiles: 0 };
    
    const pos = scan.position || {};
    const hostiles = scan.entities?.hostile || [];
    
    return {
      status: scan.status || 'ok',
      position: pos.x != null ? `${Math.floor(pos.x)},${Math.floor(pos.y)},${Math.floor(pos.z)}` : '?',
      biome: scan.biome?.name || '?',
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
    if (!bot || !bot.inventory) {
      return { status: 'unknown', health: 20, food: 20, items: 'none' };
    }
    
    const health = bot.health || 20;
    const food = bot.food || 20;
    
    const inv = bot.inventory.items();
    const itemNames = inv.map(i => i.name).slice(0, 8).join(', ') || 'none';
    
    let status = 'Good';
    if (health <= 5 || food <= 4) status = 'Critical';
    else if (health <= 10 || food <= 8) status = 'Bad';
    else if (health <= 15 || food <= 12) status = 'Okay';
    
    return {
      status,
      health,
      food,
      itemCount: inv.length,
      items: itemNames
    };
  } catch (e) {
    return { status: 'error', error: e.message };
  }
}

function getFullPerceptionData() {
  const scannerData = formatScannerData();
  const inventoryData = formatInventoryData();
  const survivalState = getSurvivalState();
  const threats = getThreatLevel();
  const envDangers = getEnvironmentalDangers();
  const timePressure = getTimeOfDay();
  const resources = getResourceInventory();
  const shelterStatus = getShelterStatus();
  const heightDanger = getHeightDanger();
  const dangerScore = calculateDangerScore();

  return {
    scanner: scannerData,
    inventory: inventoryData,
    survival: survivalState,
    threats: {
      level: threats.level,
      nearest: threats.nearest,
      count: threats.threats.length,
      description: threats.description,
      threatDescriptions: threats.threatDescriptions
    },
    environment: {
      safe: envDangers.safe,
      dangers: envDangers.dangers.map(d => d.type),
      description: envDangers.description
    },
    time: {
      period: timePressure.period,
      hours: timePressure.hours,
      description: timePressure.description,
      urgency: timePressure.urgency
    },
    resources: resources,
    shelter: {
      hasShelter: shelterStatus.hasShelter,
      safeAtNight: shelterStatus.safeAtNight,
      lightCount: shelterStatus.lightCount,
      description: shelterStatus.description
    },
    height: heightDanger,
    dangerScore
  };
}

function buildDecisionPrompt(context = {}) {
  const perception = getFullPerceptionData();
  
  const survivalState = perception.survival.state;
  const threatLevel = perception.threats.level;
  const dangerScore = perception.dangerScore;

  const systemPrompt = getSystemPrompt({
    learnedLessons: context.learnedLessons || [],
    currentGoal: context.currentGoal || null,
    dangerLevel: threatLevel,
    survivalState: getSurvivalMindset(survivalState)
  });

  const health = perception.survival.health;
  const food = perception.survival.food;
  const pos = getBotPosition();
  const hostiles = perception.threats.count;
  const threatDesc = perception.threats.description;
  const timeDesc = perception.time.description;
  const safe = perception.environment.safe;
  const needs = perception.survival.needs.join(', ');

  let userPrompt = `📍 WHERE: at ${pos.x}, ${pos.y}, ${pos.z}\n`;
  userPrompt += `❤️ HEALTH: ${health}/20 - ${perception.survival.feelings}\n`;
  userPrompt += `🍖 FOOD: ${food}/20\n`;
  userPrompt += `👁️ SEE: ${threatDesc}\n`;
  userPrompt += `🌤️ TIME: ${timeDesc}\n`;
  userPrompt += `🔥 AROUND: ${safe ? 'Seems safe' : perception.environment.description}\n`;
  userPrompt += `🏠 SHELTER: ${perception.shelter.description}\n`;
  userPrompt += `🎒 HAVE: ${perception.resources.description}\n`;
  
  if (needs) {
    userPrompt += `\n⚠️ NEED: ${needs}\n`;
  }

  userPrompt += `\nWhat do you do? What are you thinking right now?`;

  return {
    system: systemPrompt,
    user: userPrompt,
    perception,
    survivalState,
    threatLevel,
    dangerScore
  };
}

module.exports = {
  setModules,
  formatScannerData,
  formatInventoryData,
  getFullPerceptionData,
  buildDecisionPrompt,
  getSurvivalState,
  getThreatLevel,
  getEnvironmentalDangers,
  getTimeOfDay,
  getResourceInventory,
  getShelterStatus,
  getBotPosition,
  getHeightDanger,
  calculateDangerScore
};