// Intellect Module: Brain (Core LLM Integration)
// Phase 2: The Intellect - SIMPLIFIED VERSION
// Handles Ollama connection with plain text parsing

const ollama = require('./ollama');
const { getSystemPrompt } = require('./systemPrompt');
const promptFormatter = require('./promptFormatter');

const CONFIG = {
  maxRetries: 2,
  model: process.env.LLM_MODEL_FAST || 'phi3:latest',
  temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.3
};

let bot = null;
let lastDecision = null;

function init(botInstance) {
  bot = botInstance;
  console.log('[BRAIN] ✓ Intellect module initialized');
}

// Simple parser for plain text responses
function simpleParse(text) {
  const lower = text.toLowerCase();
  
  // Check for keywords in priority order
  if (lower.includes('attack') || lower.includes('fight') || lower.includes('zombie') || lower.includes('skeleton') || lower.includes('creeper')) {
    return { think: 'Hostile detected', action: 'attack', target: 'nearest_hostile', priority: 2, reasoning: 'Combat detected' };
  }
  if (lower.includes('mine') || lower.includes('gather') || lower.includes('ore') || lower.includes('wood') || lower.includes('tree')) {
    return { think: 'Resource found', action: 'mineBlock', target: 'nearest_resource', priority: 3, reasoning: 'Gathering detected' };
  }
  if (lower.includes('eat') || lower.includes('food') || lower.includes('hungry') || lower.includes('cook')) {
    return { think: 'Need to eat', action: 'eat', target: 'any_food', priority: 1, reasoning: 'Hunger detected' };
  }
  if (lower.includes('move') || lower.includes('walk') || lower.includes('go') || lower.includes('explore') || lower.includes('run')) {
    return { think: 'Moving around', action: 'moveTo', target: 'explore', priority: 4, reasoning: 'Exploration mode' };
  }
  if (lower.includes('place') || lower.includes('build') || lower.includes('craft')) {
    return { think: 'Building something', action: 'placeBlock', target: 'build', priority: 3, reasoning: 'Building detected' };
  }
  
  return { think: 'No specific action', action: 'idle', target: null, priority: 5, reasoning: 'Default idle' };
}

async function think(context = {}) {
  try {
    const promptData = promptFormatter.buildDecisionPrompt(context);
    
    console.log('[BRAIN] Calling Ollama...');
    console.log('[BRAIN] Prompt:', promptData.user.substring(0, 80));
    
    const response = await ollama.chat(
      [
        { role: 'system', content: promptData.system },
        { role: 'user', content: promptData.user + '\n\nReply with one action: idle, moveTo, mineBlock, eat, attack, or explore' }
      ],
      CONFIG.model,
      { temperature: CONFIG.temperature }
    );
    
    const rawResponse = response.message.content.trim();
    console.log('[BRAIN] Response:', rawResponse.substring(0, 100));
    
    const decision = simpleParse(rawResponse);
    console.log('[BRAIN] Parsed:', decision.action, '(priority:', decision.priority + ')');
    
    lastDecision = decision;
    return decision;
    
  } catch (error) {
    console.error('[BRAIN] Error:', error.message);
    return {
      action: 'idle',
      target: null,
      priority: 5,
      think: 'Error occurred',
      reasoning: error.message
    };
  }
}

async function executeDecision(decision) {
  if (!bot) return { success: false, error: 'No bot' };
  
  const action = decision.action;
  console.log(`[BRAIN] Executing: ${action}`);
  
  switch (action) {
    case 'moveTo':
      return { success: true, action: 'moveTo', note: 'Movement not fully implemented' };
    case 'mineBlock':
      return { success: true, action: 'mineBlock', note: 'Mining not fully implemented' };
    case 'eat':
      return { success: true, action: 'eat', note: 'Eating not fully implemented' };
    case 'attack':
      return { success: true, action: 'attack', note: 'Attacking not fully implemented' };
    case 'chat':
      if (bot && decision.target) {
        bot.chat(decision.target);
        return { success: true, action: 'chat' };
      }
      return { success: false, error: 'No message' };
    default:
      return { success: true, action: 'idle' };
  }
}

async function thinkAndAct(context = {}) {
  const decision = await think(context);
  console.log(`[BRAIN] Decision: ${decision.action} -> ${decision.target || 'none'} (p:${decision.priority})`);
  
  if (decision.priority <= 3) {
    const result = await executeDecision(decision);
    return { decision, result };
  }
  
  return { decision, result: { success: true, action: 'skipped' } };
}

function getLastDecision() {
  return lastDecision;
}

module.exports = {
  init,
  think,
  executeDecision,
  thinkAndAct,
  getLastDecision
};