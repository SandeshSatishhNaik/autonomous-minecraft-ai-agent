// Intellect Module: Brain - ULTRA-HUMAN LLM Integration
// Hyper-realistic decision making that mirrors real human thought patterns

const ollama = require('./ollama');
const { getSystemPrompt, getSurvivalMindset, getThreatResponseTemplate } = require('./systemPrompt');
const promptFormatter = require('./promptFormatter');

const CHAT_ENABLED = false;

const CONFIG = {
  maxRetries: 2,
  model: process.env.LLM_MODEL_FAST || 'phi3:latest',
  temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.3,
  decisionDelay: 500
};

let bot = null;
let lastDecision = null;
let lastSurvivalState = null;
let survivalOverrides = 0;
let recentErrors = [];
let decisionHistory = [];

function init(botInstance) {
  bot = botInstance;
  promptFormatter.setModules(botInstance, null, null);
  console.log('[BRAIN] ✓ Ultra-human brain initialized');
}

function getBotStatus() {
  if (!bot || !bot.entity) {
    return { connected: false, health: 20, food: 20 };
  }
  return {
    connected: true,
    health: bot.health || 20,
    food: bot.food || 20,
    position: bot.entity.position,
    armor: bot.inventory?.armor || 0
  };
}

function isCriticalState() {
  const status = getBotStatus();
  return status.health <= 5 || status.food <= 4;
}

function shouldOverrideWithSurvival() {
  const perception = promptFormatter.getFullPerceptionData();
  const state = perception.survival.state;
  const threats = perception.threats.level;
  const dangerScore = perception.dangerScore;

  return state === 'critical' || 
         threats === 'critical' || 
         dangerScore > 70 ||
         (state === 'danger' && threats === 'danger') ||
         (state === 'danger' && perception.survival.food < 8);
}

function getForcedSurvivalAction() {
  const perception = promptFormatter.getFullPerceptionData();
  const state = perception.survival.state;
  const threats = perception.threats;
  const time = perception.time;
  const resources = perception.resources;

  if (state === 'critical' || threats.level === 'critical') {
    if (threats.nearest) {
      if (threats.nearest.name === 'creeper') {
        return {
          think: 'CREEPER IS GONNA EXPLODE AAAAHH!',
          action: 'flee',
          target: 'away_from_creeper',
          priority: 1,
          reasoning: 'CREEPER EXPLOSION INCOMING - MUST RUN NOW!',
          forced: true,
          emotion: 'panic'
        };
      }

      if (threats.nearest.distance < 4) {
        const response = getThreatResponseTemplate(1, threats.nearest.name);
        return {
          think: `It's a ${threats.nearest.name} and it's RIGHT ON ME!`,
          action: response.action,
          target: threats.nearest.name,
          priority: 1,
          reasoning: `Too close to ${threats.nearest.name} - danger!`,
          forced: true,
          emotion: 'panic'
        };
      }
    }

    if (perception.survival.health <= 5) {
      return {
        think: 'I\'M GONNA DIE! Need to get away!',
        action: 'flee',
        target: 'find_safe_spot',
        priority: 1,
        reasoning: 'Health too low - critical danger!',
        forced: true,
        emotion: 'panic'
      };
    }

    if (perception.survival.food <= 4) {
      return {
        think: 'STARVING! Need food NOW!',
        action: 'eat',
        target: 'any_food_available',
        priority: 1,
        reasoning: 'Food critical - starvation!',
        forced: true,
        emotion: 'desperation'
      };
    }
  }

  if (state === 'danger') {
    if (perception.survival.food < 8 && !resources.hasFood) {
      return {
        think: 'Getting really hungry... need to find food',
        action: 'eat',
        target: 'search_for_food',
        priority: 2,
        reasoning: 'Food getting low - should eat something',
        forced: false,
        emotion: 'concerned'
      };
    }

    if (perception.survival.health < 10 && threats.threats.length > 0) {
      return {
        think: `Health is low... can't fight ${threats.nearest?.name || 'mobs'}`,
        action: 'flee',
        target: 'away_from_mobs',
        priority: 2,
        reasoning: 'Too damaged to fight - better run',
        forced: false,
        emotion: 'cautious'
      };
    }

    if (threats.nearest && threats.nearest.distance < 6) {
      const threatName = threats.nearest.name;
      const threatType = threatName === 'creeper' ? 'creeper' :
                        ['zombie', 'spider', 'pig_zombie'].includes(threatName) ? 'zombie' :
                        threatName === 'skeleton' ? 'skeleton' :
                        threatName === 'enderman' ? 'enderman' : 'hostile_melee';
      
      const response = getThreatResponseTemplate(2, threatType);
      return {
        think: `${threatName} is getting close... ${response.think || 'should I fight or run?'}`,
        action: response.action,
        target: threatName,
        priority: 2,
        reasoning: response.reasoning,
        forced: false,
        emotion: 'nervous'
      };
    }
  }

  if (time.period === 'night' && !perception.shelter.safeAtNight && time.urgency === 'high') {
    return {
      think: 'It\'s getting dark! I don\'t wanna be outside!',
      action: 'hide',
      target: 'find_shelter_quick',
      priority: 2,
      reasoning: 'Night time and no shelter - mobs will spawn!',
      forced: false,
      emotion: 'scared'
    };
  }

  if (perception.environment.dangers.includes('fire') || perception.environment.dangers.includes('lava')) {
    return {
      think: 'Fire or lava nearby! Gotta get away!',
      action: 'flee',
      target: 'away_from_fire',
      priority: 1,
      reasoning: 'Fire/lava danger - immediate escape!',
      forced: true,
      emotion: 'panic'
    };
  }

  return null;
}

function parseHumanResponse(text, perception) {
  const lower = text.toLowerCase();
  
  const threat = perception.threats;
  const state = perception.survival.state;
  const food = perception.survival.food;
  const health = perception.survival.health;

  if (lower.includes('flee') || lower.includes('run') || lower.includes('escape') || lower.includes('away') || lower.includes('hide')) {
    const target = threat.nearest ? `away_from_${threat.nearest.name}` : 'danger';
    const thought = threat.nearest 
      ? `Getting away from that ${threat.nearest.name}!`
      : 'Running from danger!';
    return { 
      think: thought, 
      action: 'flee', 
      target, 
      priority: 2, 
      reasoning: 'Danger detected - flee to safety',
      emotion: 'scared'
    };
  }

  if (lower.includes('eat') || lower.includes('food') || lower.includes('hungry') || lower.includes('bread') || 
      lower.includes('beef') || lower.includes('pork') || lower.includes('apple') || lower.includes('carrot')) {
    const thought = food < 8 
      ? 'Really need to eat something...' 
      : 'Should probably eat something soon';
    return { 
      think: thought, 
      action: 'eat', 
      target: 'find_food', 
      priority: food < 8 ? 1 : 3, 
      reasoning: food < 8 ? 'Hungry - need food now!' : 'Food is getting low',
      emotion: 'concerned'
    };
  }

  if (lower.includes('attack') || lower.includes('fight') || lower.includes('kill') || lower.includes('zombie') || 
      lower.includes('skeleton') || lower.includes('creeper') || lower.includes('spider') || lower.includes('hit')) {
    if (state === 'danger' || health < 10) {
      return { 
        think: 'Can\'t fight right now... too dangerous', 
        action: 'flee', 
        target: 'nearest_hostile', 
        priority: 1, 
        reasoning: 'Too damaged to fight - must run!',
        emotion: 'cautious'
      };
    }
    return { 
      think: `Gonna fight that ${threat.nearest?.name || 'mob'}!`, 
      action: 'attack', 
      target: threat.nearest?.name || 'nearest_hostile', 
      priority: 3, 
      reasoning: 'Can fight - have health advantage',
      emotion: 'determined'
    };
  }

  if (lower.includes('mine') || lower.includes('gather') || lower.includes('ore') || lower.includes('wood') || 
      lower.includes('tree') || lower.includes('stone') || lower.includes('dig')) {
    return { 
      think: 'Need to get some resources', 
      action: 'mineBlock', 
      target: 'nearest_resource', 
      priority: 4, 
      reasoning: 'Need to gather stuff',
      emotion: 'neutral'
    };
  }

  if (lower.includes('place') || lower.includes('build') || lower.includes('craft') || lower.includes('torch') || 
      lower.includes('fence') || lower.includes('wall')) {
    return { 
      think: 'Should build something for safety', 
      action: 'placeBlock', 
      target: 'build_structure', 
      priority: 4, 
      reasoning: 'Building for protection',
      emotion: 'neutral'
    };
  }

  if (lower.includes('explore') || lower.includes('walk') || lower.includes('go') || lower.includes('look') || 
      lower.includes('find') || lower.includes('check')) {
    return { 
      think: 'Let me look around...', 
      action: 'explore', 
      target: 'new_area', 
      priority: 5, 
      reasoning: 'Exploring surroundings',
      emotion: 'curious'
    };
  }

  if (lower.includes('rest') || lower.includes('wait') || lower.includes('stay') || lower.includes('safe')) {
    return { 
      think: 'Just gonna stay here for a bit...', 
      action: 'idle', 
      target: 'rest', 
      priority: 5, 
      reasoning: 'Taking a break',
      emotion: 'relaxed'
    };
  }

  return { 
    think: 'Hmm... what should I do?', 
    action: 'idle', 
    target: null, 
    priority: 5, 
    reasoning: 'Thinking about what to do next',
    emotion: 'neutral'
  };
}

function validateAction(decision, perception) {
  const state = perception.survival.state;
  const threats = perception.threats.level;
  const health = perception.survival.health;
  const food = perception.survival.food;
  const envDangers = perception.environment.dangers;

  if (decision.forced) {
    return decision;
  }

  if (decision.action === 'attack' && (state === 'danger' || state === 'critical')) {
    return {
      ...decision,
      action: 'flee',
      think: 'Can\'t fight right now! Too dangerous!',
      reasoning: 'Forced to flee - too damaged to fight!',
      emotion: 'scared'
    };
  }

  if (decision.action === 'mineBlock' && food < 6) {
    return {
      ...decision,
      action: 'eat',
      target: 'find_food',
      priority: 1,
      think: 'Too hungry to mine... need food first',
      reasoning: 'Must eat before working - starving!',
      emotion: 'desperation'
    };
  }

  if (decision.action === 'explore' && threats === 'critical') {
    return {
      ...decision,
      action: 'flee',
      target: 'find_safety',
      priority: 1,
      think: 'Dangerous to explore! Need to be safe!',
      reasoning: 'Too dangerous to explore - flee!',
      emotion: 'scared'
    };
  }

  if (decision.action === 'idle' && state === 'critical') {
    return {
      ...decision,
      action: 'flee',
      target: 'anywhere_safe',
      priority: 1,
      think: 'Can\'t just stand here! Gotta move!',
      reasoning: 'Cannot idle in critical state!',
      emotion: 'panic'
    };
  }

  if (decision.action === 'attack' && threats === 'critical' && perception.threats.nearest?.name === 'creeper') {
    return {
      ...decision,
      action: 'flee',
      target: 'away_from_creeper',
      priority: 1,
      think: 'NO CREEPERS ARE SUICIDE DONT ATTACK!',
      reasoning: 'Never attack creepers - always run!',
      emotion: 'panic'
    };
  }

  if (envDangers.includes('lava') && (decision.action === 'mineBlock' || decision.action === 'explore')) {
    return {
      ...decision,
      action: 'flee',
      target: 'away_from_lava',
      priority: 1,
      think: 'Lava nearby! Too dangerous!',
      reasoning: 'Lava danger - flee immediately!',
      emotion: 'scared'
    };
  }

  return decision;
}

function addToHistory(decision) {
  decisionHistory.push({
    ...decision,
    timestamp: Date.now()
  });
  
  if (decisionHistory.length > 10) {
    decisionHistory.shift();
  }
}

function getContextFromHistory() {
  if (decisionHistory.length < 2) return null;
  
  const recent = decisionHistory.slice(-3);
  const goals = recent.map(d => d.action).join(' -> ');
  const stuck = recent.every(d => d.action === 'idle' || d.action === 'explore');
  
  if (stuck && recent.length >= 3) {
    return 'Seems stuck - try a different approach';
  }
  
  return null;
}

async function think(context = {}) {
  try {
    const promptData = promptFormatter.buildDecisionPrompt(context);
    const perception = promptData.perception;
    
    console.log(`[BRAIN] State: ${perception.survival.state} | Threats: ${perception.threats.level} | Danger: ${perception.dangerScore}/100`);

    if (shouldOverrideWithSurvival()) {
      const forcedAction = getForcedSurvivalAction();
      if (forcedAction) {
        survivalOverrides++;
        console.log(`[BRAIN] ⚠️ SURVIVAL OVERRIDE #${survivalOverrides}: ${forcedAction.action} - ${forcedAction.think}`);
        lastDecision = forcedAction;
        lastSurvivalState = perception.survival.state;
        addToHistory(forcedAction);
        return forcedAction;
      }
    }

    console.log('[BRAIN] Thinking...');
    const contextHint = getContextFromHistory();
    const userMessage = promptData.user;
    const contextualMessage = contextHint 
      ? userMessage + `\n\nNote: ${contextHint}`
      : userMessage;

    const response = await ollama.chat(
      [
        { role: 'system', content: promptData.system },
        { role: 'user', content: contextualMessage + '\n\nBe honest - what are you thinking right now? What do you do?' }
      ],
      CONFIG.model,
      { temperature: CONFIG.temperature }
    );

    const rawResponse = response.message.content.trim();
    console.log('[BRAIN] Thought:', rawResponse.substring(0, 150));

    let decision = parseHumanResponse(rawResponse, perception);
    decision = validateAction(decision, perception);

    console.log(`[BRAIN] Decision: ${decision.action} - "${decision.think}" (P${decision.priority})`);

    lastDecision = decision;
    lastSurvivalState = perception.survival.state;
    addToHistory(decision);
    return decision;

  } catch (error) {
    console.error('[BRAIN] Error:', error.message);
    recentErrors.push({ error: error.message, time: Date.now() });
    if (recentErrors.length > 5) recentErrors.shift();
    
    if (isCriticalState()) {
      const fallback = getForcedSurvivalAction();
      if (fallback) {
        return fallback;
      }
    }

    return {
      action: 'idle',
      target: null,
      priority: 5,
      think: 'Something went wrong...',
      reasoning: error.message,
      emotion: 'confused'
    };
  }
}

async function executeDecision(decision) {
  if (!bot) return { success: false, error: 'No bot' };

  console.log(`[BRAIN] Acting: ${decision.action} -> ${decision.target || 'none'}`);

  switch (decision.action) {
    case 'flee':
      return { success: true, action: 'flee', note: 'Fleeing from danger' };
    case 'eat':
      return { success: true, action: 'eat', note: 'Eating food' };
    case 'hide':
      return { success: true, action: 'hide', note: 'Finding shelter' };
    case 'attack':
      return { success: true, action: 'attack', note: 'Fighting mob' };
    case 'mineBlock':
      return { success: true, action: 'mineBlock', note: 'Mining resource' };
    case 'explore':
      return { success: true, action: 'explore', note: 'Exploring area' };
    case 'placeBlock':
      return { success: true, action: 'placeBlock', note: 'Building structure' };
    case 'craft':
      return { success: true, action: 'craft', note: 'Crafting item' };
    default:
      return { success: true, action: 'idle', note: 'Resting' };
  }
}

async function thinkAndAct(context = {}) {
  await new Promise(r => setTimeout(r, CONFIG.decisionDelay));
  
  const decision = await think(context);
  
  console.log(`[BRAIN] Final: ${decision.action} | "${decision.think}" | P${decision.priority} ${decision.forced ? '[SURVIVAL]' : ''}`);

  if (decision.priority <= 3 || decision.forced) {
    const result = await executeDecision(decision);
    return { decision, result };
  }

  return { decision, result: { success: true, action: 'skipped', reason: 'Low priority - no urgent need' } };
}

function getLastDecision() {
  return lastDecision;
}

function getStats() {
  return {
    lastDecision,
    lastSurvivalState,
    survivalOverrides,
    decisionHistory: decisionHistory.slice(-5),
    recentErrors: recentErrors.slice(-3),
    botStatus: getBotStatus()
  };
}

module.exports = {
  init,
  think,
  executeDecision,
  thinkAndAct,
  getLastDecision,
  getStats,
  getBotStatus,
  getSurvivalState: () => promptFormatter.getSurvivalState(),
  getThreatLevel: () => promptFormatter.getThreatLevel()
};