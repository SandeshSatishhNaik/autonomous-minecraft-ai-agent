// Muscles Module: Survival Behaviors - ULTRA-HUMAN
// Authentic human-like survival reactions and behaviors

const tools = require('./tools');
const executor = require('./executor');
const queue = require('./queue');

let bot = null;
const CHAT_ENABLED = false;

let behaviors = {
  autoEat: true,
  autoFlee: true,
  autoAttack: false,
  smartMining: true,
  shelterAtNight: true,
  proactiveGathering: true,
  checkInventory: true
};

let state = {
  lastHealth: 20,
  lastFood: 20,
  lastTime: 0,
  consecutiveFails: 0,
  nearDeathExperience: false,
  lastDangerTime: 0,
  foodSearchAttempts: 0,
  shelterStreak: 0,
  totalMobsFled: 0,
  totalFoodEaten: 0,
  lastEatTime: 0,
  inventoryChecks: 0,
  panicCount: 0,
  calmSince: 0,
  learnedDangers: []
};

function init(botInstance) {
  bot = botInstance;
  console.log('[SURVIVAL] ✓ Ultra-human survival behaviors initialized');
  
  setInterval(checkSurvival, 1200);
  setInterval(checkEnvironment, 2500);
  setInterval(proactiveBehaviors, 4000);
  setInterval(updateState, 800);
  setInterval(humanBehaviorLoop, 3000);
}

async function updateState() {
  if (!bot || !bot.entity) return;
  
  const health = bot.health || 20;
  const food = bot.food || 20;
  const time = bot.world?.time || 0;
  
  if (health < state.lastHealth && health <= 5 && state.lastHealth > 5) {
    state.nearDeathExperience = true;
    state.lastDangerTime = time;
    state.panicCount++;
    console.log('[SURVIVAL] 💀 WHOA ALMOST DIED! That was close!');
  }
  
  if (health > 12 && food > 12) {
    state.calmSince++;
  } else {
    state.calmSince = 0;
  }
  
  state.lastHealth = health;
  state.lastFood = food;
  state.lastTime = time;
}

async function humanBehaviorLoop() {
  if (!bot || !bot.entity) return;
  
  try {
    const health = bot.health;
    const food = bot.food;
    const pos = bot.entity.position;
    
    if (Math.random() < 0.1 && health > 10 && food > 10) {
      const inventory = bot.inventory.items();
      state.inventoryChecks++;
      if (state.inventoryChecks % 5 === 0) {
        console.log(`[SURVIVAL] *checks inventory* Got ${inventory.length} items`);
      }
    }
    
    if (Math.random() < 0.05 && state.nearDeathExperience) {
      console.log('[SURVIVAL] Still thinking about that near death...');
    }
    
  } catch (e) {}
}

async function checkSurvival() {
  if (!bot || !bot.entity) return;
  
  try {
    const health = bot.health;
    const food = bot.food;
    const pos = bot.entity.position;
    
    if (health <= 4) {
      console.log('[SURVIVAL] 🛑 OH CRAP HEALTH CRITICAL!!!');
      await panicFlee();
      return;
    }
    
    if (health <= 7) {
      console.log('[SURVIVAL] 🛑 Health is really low... need to be careful');
      await cautiousFlee();
      return;
    }
    
    if (food <= 3) {
      console.log('[SURVIVAL] 💀 STARVING! Can\'t think straight!');
      await desperateFoodSearch();
      return;
    }
    
    if (food < 7 && behaviors.autoEat) {
      console.log('[SURVIVAL] 🍖 Getting pretty hungry...');
      const result = await tools.eat();
      if (result.success) {
        state.totalFoodEaten++;
        state.lastEatTime = Date.now();
        console.log('[SURVIVAL] *eats food* Ahh better');
      }
      return;
    }
    
    if (food < 11 && behaviors.autoEat) {
      await tools.autoEat();
    }
    
  } catch (e) {}
}

async function checkEnvironment() {
  if (!bot || !bot.entity) return;
  
  try {
    const time = bot.world.time;
    const pos = bot.entity.position;
    const health = bot.health;
    const food = bot.food;
    
    const dayTime = time % 24000;
    const isSunrise = dayTime > 0 && dayTime < 1000;
    const isMorning = dayTime > 1000 && dayTime < 6000;
    const isAfternoon = dayTime > 6000 && dayTime < 10000;
    const isSunset = dayTime > 10000 && dayTime < 12000;
    const isNight = dayTime > 12000 && dayTime < 22000;
    const isMidnight = dayTime > 22000 && dayTime < 24000;
    
    if (isSunset && behaviors.shelterAtNight) {
      console.log('[SURVIVAL] 🌅 Whoa it\'s getting late... better find somewhere safe');
      await prepareForNight();
    }
    
    if (isNight && behaviors.shelterAtNight) {
      console.log('[SURVIVAL] 🌙 It\'s dark... mobs are gonna be out');
      state.shelterStreak++;
      await findShelter();
    }
    
    if (isMidnight && food > 15) {
      console.log('[SURVIVAL] 🌌 Deep night... hope nothing finds me');
    }
    
    if (isMorning && state.nearDeathExperience) {
      console.log('[SURVIVAL] ☀️ Made it through the night... thank god');
      state.nearDeathExperience = false;
    }
    
    const entities = Object.values(bot.entities);
    const hostiles = entities.filter(e => 
      ['creeper', 'zombie', 'skeleton', 'spider', 'enderman', 'pillager', 'vex', 'witch'].includes(e.name)
    );
    
    for (const mob of hostiles) {
      const dist = Math.sqrt(
        Math.pow(mob.position.x - pos.x, 2) +
        Math.pow(mob.position.y - pos.y, 2) +
        Math.pow(mob.position.z - pos.z, 2)
      );
      
      if (mob.name === 'creeper') {
        if (dist < 10) {
          console.log('[SURVIVAL] ⚠️ CREEPER!!! GET AWAY!!!');
          state.totalMobsFled++;
          await fleeFromCreeper(mob);
          return;
        }
        if (dist < 16) {
          console.log('[SURVIVAL] Is that a creeper? I hear something...');
        }
      }
      
      if (mob.name === 'skeleton' && dist < 8 && health < 12) {
        console.log('[SURVIVAL] ⚠️ Archers hurt! Can\'t fight this!');
        await fleeFromDanger();
        return;
      }
      
      if (mob.name === 'zombie' && dist < 5 && health < 10) {
        console.log('[SURVIVAL] ⚠️ Zombie too close and I\'m hurt!');
        await fleeFromDanger();
        return;
      }
      
      if (dist < 4) {
        console.log(`[SURVIVAL] ⚠️ ${mob.name} is RIGHT THERE!`);
        await panicFlee();
        return;
      }
      
      if (dist < 7 && behaviors.autoFlee && health < 12) {
        console.log(`[SURVIVAL] ⚠️ ${mob.name} nearby and I\'m hurt - run!`);
        await fleeFromDanger();
        return;
      }
    }
    
    const envDangers = checkEnvironmentDangers();
    if (!envDangers.safe) {
      console.log('[SURVIVAL] 🔥 Something\'s burning nearby!');
      await fleeFromDanger();
    }
    
    if (bot.entity.velocity && bot.entity.velocity.y < -0.8) {
      console.log('[SURVIVAL] AAAAHH FALLING!');
      await handleFalling();
    }
    
  } catch (e) {}
}

async function proactiveBehaviors() {
  if (!bot || !bot.entity) return;
  
  try {
    const health = bot.health;
    const food = bot.food;
    const time = bot.world?.time || 0;
    const pos = bot.entity.position;
    
    if (food < 14 && behaviors.proactiveGathering) {
      const inventory = bot.inventory.items();
      const hasFood = inventory.some(i => 
        ['bread', 'cooked_beef', 'cooked_porkchop', 'apple', 'carrot', 'cookie', 'cake'].includes(i.name)
      );
      
      if (!hasFood || inventory.filter(i => 
        ['bread', 'cooked_beef', 'cooked_porkchop', 'apple'].includes(i.name)
      ).length < 2) {
        console.log('[SURVIVAL] Not much food left... should find more');
        await findFoodSource();
      }
    }
    
    if (health < 14 && food >= 10) {
      console.log('[SURVIVAL] A bit banged up... eating might help');
      await tools.eat();
    }
    
    const dayTime = time % 24000;
    if (dayTime > 10000 && dayTime < 11000) {
      const inventory = bot.inventory.items();
      const hasTorch = inventory.some(i => i.name === 'torch');
      const hasLight = inventory.some(i => 
        ['torch', 'soul_torch', 'lantern', 'soul_lantern'].includes(i.name)
      );
      
      if (!hasLight) {
        console.log('[SURVIVAL] It\'s getting late... wish I had more light');
      }
    }
    
  } catch (e) {}
}

function checkEnvironmentDangers() {
  if (!bot || !bot.entity) return { safe: true, dangers: [] };
  
  const pos = bot.entity.position;
  const range = 4;
  const dangers = [];
  
  for (let x = pos.x - range; x <= pos.x + range; x++) {
    for (let y = pos.y - range; y <= pos.y + range; y++) {
      for (let z = pos.z - range; z <= pos.z + range; z++) {
        try {
          const block = bot.blockAt({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
          if (!block) continue;
          
          if (['lava', 'fire', 'magma_block', 'soul_fire'].includes(block.name)) {
            dangers.push({ type: 'fire', name: block.name, distance: Math.sqrt(Math.pow(x-pos.x,2) + Math.pow(z-pos.z,2)) });
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
  
  return { safe: dangers.length === 0, dangers };
}

async function panicFlee() {
  console.log('[SURVIVAL] OH NO OH NO OH NO RUN RUN RUN!');
  
  await executor.emergencyStop();
  
  bot.setControlState('sprint', true);
  bot.setControlState('jump', true);
  
  const angle = Math.random() * Math.PI * 2;
  bot.look(Math.cos(angle) * Math.PI, 0, true);
  
  bot.setControlState('forward', true);
  await sleep(300 + Math.random() * 200);
  bot.setControlState('forward', false);
  bot.setControlState('jump', false);
  
  await findSafeSpot(25);
  
  bot.setControlState('sprint', false);
  state.consecutiveFails++;
  
  console.log('[SURVIVAL] *panting* Okay okay safe... for now');
}

async function cautiousFlee() {
  console.log('[SURVIVAL] Need to get away from here...');
  
  await executor.emergencyStop();
  
  bot.setControlState('sprint', true);
  bot.setControlState('forward', true);
  
  await sleep(1500 + Math.random() * 1000);
  
  bot.setControlState('forward', false);
  bot.setControlState('sprint', false);
  
  await findSafeSpot(15);
}

async function fleeFromCreeper(creeper) {
  console.log('[SURVIVAL] CREEPER CREEPER CREEPER RUNRUNRUN!');
  
  await executor.emergencyStop();
  
  const pos = bot.entity.position;
  const creeperPos = creeper.position;
  
  const dx = pos.x - creeperPos.x;
  const dz = pos.z - creeperPos.z;
  const dist = Math.sqrt(dx*dx + dz*dz);
  
  const runX = pos.x + (dx / Math.max(dist, 1)) * 25;
  const runZ = pos.z + (dz / Math.max(dist, 1)) * 25;
  
  const angle = Math.atan2(dz, dx);
  bot.look(angle, 0, true);
  
  bot.setControlState('sprint', true);
  bot.setControlState('forward', true);
  bot.setControlState('jump', true);
  
  const fleeTime = Math.min(2500, Math.max(500, dist * 150));
  await sleep(fleeTime);
  
  bot.setControlState('forward', false);
  bot.setControlState('jump', false);
  bot.setControlState('sprint', false);
  
  await findSafeSpot(20);
  
  console.log('[SURVIVAL] *relieved* Okay creeper is gone...');
}

async function fleeFromDanger() {
  console.log('[SURVIVAL] Gotta get away!');
  
  await executor.emergencyStop();
  
  bot.setControlState('sprint', true);
  bot.setControlState('forward', true);
  
  await sleep(1500 + Math.random() * 1000);
  
  bot.setControlState('forward', false);
  bot.setControlState('sprint', false);
  
  await findSafeSpot(12);
}

async function prepareForNight() {
  console.log('[SURVIVAL] It\'s getting dark... should find somewhere safe');
  
  const inventory = bot.inventory.items();
  const hasTorch = inventory.some(i => i.name === 'torch');
  const hasLight = inventory.some(i => 
    ['torch', 'lantern', 'soul_torch', 'soul_lantern', 'glowstone'].includes(i.name)
  );
  
  if (hasLight) {
    console.log('[SURVIVAL] At least I have some light, I\'ll be okay');
  } else {
    console.log('[SURVIVAL] No light... gonna be a scary night');
  }
}

async function findShelter() {
  console.log('[SURVIVAL] Looking for somewhere safe...');
  
  const shelterBlocks = findNearbyBlocks(12, ['oak_planks', 'cobblestone', 'stone_bricks', 'oak_log', 'birch_log', 'spruce_log', 'cave_air']);
  
  if (shelterBlocks.length > 0) {
    const shelter = shelterBlocks[0];
    console.log(`[SURVIVAL] Ooh there's something I can use`);
    await tools.walkTo(shelter.x, shelter.y, shelter.z);
    console.log('[SURVIVAL] *hides* Safe here for now');
    return;
  }
  
  const caves = findNearbyBlocks(10, ['cave_air']);
  if (caves.length > 5) {
    const cave = caves[Math.floor(caves.length / 2)];
    console.log('[SURVIVAL] Found a cave! Perfect!');
    await tools.walkTo(cave.x, cave.y, cave.z);
    return;
  }
  
  const walls = findNearbyBlocks(15, ['stone', 'dirt', 'grass_block', 'cobblestone']);
  if (walls.length > 3) {
    await hideAgainstWall();
    return;
  }
  
  console.log('[SURVIVAL] Can\'t find anywhere... just gotta keep moving I guess');
  await tools.explore(18);
}

async function hideAgainstWall() {
  console.log('[SURVIVAL] I\'ll just stay near this wall...');
  
  const pos = bot.entity.position;
  const directions = [
    { x: 2, z: 0 }, { x: -2, z: 0 },
    { x: 0, z: 2 }, { x: 0, z: -2 },
    { x: 2, z: 2 }, { x: -2, z: -2 }
  ];
  
  for (const dir of directions) {
    try {
      const checkPos = { x: Math.floor(pos.x + dir.x), y: Math.floor(pos.y), z: Math.floor(pos.z + dir.z) };
      const block = bot.blockAt(checkPos);
      if (block && block.name !== 'air' && block.name !== 'water' && block.name !== 'lava') {
        await tools.walkTo(pos.x + dir.x * 0.8, pos.y, pos.z + dir.z * 0.8);
        console.log('[SURVIVAL] *pressed against wall* This will have to do...');
        return;
      }
    } catch (e) {}
  }
  
  await tools.explore(10);
}

async function findSafeSpot(minDistance = 12) {
  console.log(`[SURVIVAL] Looking for somewhere safer...`);
  
  const pos = bot.entity.position;
  
  const water = findNearbyBlocks(8, ['water']);
  if (water.length > 0) {
    const w = water[0];
    await tools.walkTo(w.x, w.y + 1, w.z);
    console.log('[SURVIVAL] Water! At least mobs can\'t follow me here');
    return;
  }
  
  const openAreas = findNearbyBlocks(18, ['air', 'cave_air']);
  if (openAreas.length > 15) {
    await tools.explore(minDistance);
    console.log('[SURVIVAL] Found some open space...');
    return;
  }
  
  await tools.explore(minDistance);
}

async function desperateFoodSearch() {
  console.log('[SURVIVAL] NEED FOOD NOW!');
  
  const animals = findNearbyEntities(25, ['cow', 'pig', 'sheep', 'chicken', 'rabbit', 'horse', 'donkey']);
  
  if (animals.length > 0) {
    console.log(`[SURVIVAL] A ${animals[0].name}! Food!`);
    return;
  }
  
  const inventory = bot.inventory.items();
  const hasSeeds = inventory.some(i => 
    ['wheat_seeds', 'carrot', 'beetroot', 'potato'].includes(i.name)
  );
  
  if (hasSeeds) {
    console.log('[SURVIVAL] Got seeds! Let me find some dirt...');
    const farmland = findNearbyBlocks(20, ['farmland']);
    const dirt = findNearbyBlocks(15, ['dirt', 'grass_block']);
    
    if (farmland.length > 0) {
      await tools.walkTo(farmland[0].x, farmland[0].y + 1, farmland[0].z);
      return;
    }
  }
  
  const anyFood = inventory.find(i => 
    ['bread', 'apple', 'cooked_beef', 'cooked_porkchop', 'cookie', 'carrot', 'golden_apple', 'enchanted_golden_apple'].includes(i.name)
  );
  
  if (anyFood) {
    console.log('[SURVIVAL] At least I have something!');
    await tools.eat();
    return;
  }
  
  console.log('[SURVIVAL] No food anywhere! Just wander I guess...');
  await tools.explore(25);
}

async function findFoodSource() {
  console.log('[SURVIVAL] Should find some food...');
  
  const animals = findNearbyEntities(30, ['cow', 'pig', 'sheep', 'chicken', 'rabbit']);
  
  if (animals.length > 0) {
    const animal = animals[0];
    console.log(`[SURVIVAL] ${animal.name} is nearby! Could hunt it`);
    return;
  }
  
  const inventory = bot.inventory.items();
  const crops = inventory.filter(i => 
    ['wheat', 'carrot', 'potato', 'beetroot', 'pumpkin', 'melon', 'bread', 'cooked_beef', 'cooked_porkchop'].includes(i.name)
  );
  
  if (crops.length >= 3) {
    console.log('[SURVIVAL] Got enough food I think');
  } else {
    console.log('[SURVIVAL] Not enough food... keep looking');
    await tools.explore(15);
  }
}

async function handleFalling() {
  if (!bot) return;
  
  console.log('[SURVIVAL] Falling!!');
  
  const inventory = bot.inventory.items();
  const waterBucket = inventory.find(i => i.name === 'water_bucket');
  
  if (waterBucket) {
    try {
      console.log('[SURVIVAL] Using water bucket!');
      await bot.equip(waterBucket, 'hand');
      const pos = bot.entity.position;
      await bot.placeBlock(
        bot.blockAt({ x: Math.floor(pos.x), y: Math.floor(pos.y) - 2, z: Math.floor(pos.z) }),
        new (require('prismarine-vector'))(0, -1, 0)
      );
      console.log('[SURVIVAL] *splash* Saved myself!');
    } catch (e) {
      console.log('[SURVIVAL] Bucket failed...');
    }
  } else {
    console.log('[SURVIVAL] No water bucket... oof');
  }
}

function findNearbyBlocks(range, blockTypes) {
  if (!bot || !bot.entity) return [];
  
  const pos = bot.entity.position;
  const blocks = [];
  
  for (let x = pos.x - range; x <= pos.x + range; x++) {
    for (let y = pos.y - range; y <= pos.y + range; y++) {
      for (let z = pos.z - range; z <= pos.z + range; z++) {
        try {
          const block = bot.blockAt({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z) });
          if (block && blockTypes.includes(block.name)) {
            blocks.push({ x: Math.floor(x), y: Math.floor(y), z: Math.floor(z), name: block.name });
          }
        } catch (e) {}
      }
    }
  }
  
  return blocks;
}

function findNearbyEntities(range, entityTypes) {
  if (!bot || !bot.entities) return [];
  
  const pos = bot.entity.position;
  const entities = Object.values(bot.entities);
  
  return entities
    .filter(e => entityTypes.includes(e.name))
    .map(e => ({
      name: e.name,
      distance: Math.sqrt(
        Math.pow(e.position.x - pos.x, 2) +
        Math.pow(e.position.y - pos.y, 2) +
        Math.pow(e.position.z - pos.z, 2)
      )
    }))
    .sort((a, b) => a.distance - b.distance);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function setBehavior(name, enabled) {
  if (behaviors.hasOwnProperty(name)) {
    behaviors[name] = enabled;
    console.log(`[SURVIVAL] ${name}: ${enabled ? 'ON' : 'OFF'}`);
  }
}

function getBehaviors() {
  return { ...behaviors };
}

function getStatus() {
  if (!bot || !bot.entity) {
    return { connected: false };
  }
  
  const health = bot.health;
  const food = bot.food;
  const time = bot.world?.time || 0;
  
  let statusText = '👍 Good';
  if (health <= 5 || food <= 4) statusText = '💀 CRITICAL';
  else if (health <= 10 || food <= 8) statusText = '⚠️ Dangerous';
  else if (health <= 15 || food <= 12) statusText = '😐 Okay';
  
  const dayTime = time % 24000;
  let timeText = 'Day';
  if (dayTime > 12000 && dayTime < 22000) timeText = 'Night';
  else if (dayTime > 10000 && dayTime < 12000) timeText = 'Sunset';
  else if (dayTime > 0 && dayTime < 1000) timeText = 'Sunrise';
  
  return {
    connected: true,
    health,
    food,
    status: statusText,
    time: timeText,
    timeValue: Math.floor(dayTime),
    behaviors,
    nearDeath: state.nearDeathExperience,
    shelterStreak: state.shelterStreak,
    totalMobsFled: state.totalMobsFled,
    totalFoodEaten: state.totalFoodEaten,
    panicCount: state.panicCount,
    calmCounter: state.calmSince
  };
}

module.exports = {
  init,
  setBehavior,
  getBehaviors,
  getStatus,
  fleeFromDanger,
  findShelter,
  panicFlee,
  checkSurvival,
  checkEnvironment
};