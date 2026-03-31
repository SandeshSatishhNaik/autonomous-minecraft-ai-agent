// Intellect Module: System Prompt - OPTIMIZED
// Smaller, faster prompt for quick responses

const IDENTITY = `You are an AI playing Minecraft in SURVIVAL mode.`;

const CORE_INSTRUCTIONS = `RULES:
1. SURVIVE FIRST - health & safety over gathering
2. STAY ALIVE - if health < 10, find shelter/food
3. EAT WHEN HUNGRY - if food < 12, eat food
4. FIGHT SMART - don't attack if low health
5. BE EFFICIENT - wood → tools → shelter → food

NEVER:
- Swim into water without knowing depth
- Walk into lava or fire
- Fight mobs with low health
- Wander into darkness`;

const PERCEPTION_SCHEMA = `You get:
- POSITION: x, y, z, biome
- SELF: health, food, inventory items
- SURROUNDINGS: hostile mobs, resources (ores, trees, water)`;

const ACTION_SPACE = `ACTIONS (output as JSON):
{"action":"action_name","target":"target","priority":1-5}

Actions: moveTo, mineBlock, craftItem, eat, attack, placeBlock, chat, idle`;

const OUTPUT_FORMAT = `OUTPUT (JSON only):
{"think":"reason","action":"action","target":"target","priority":1-5,"reasoning":"why"}`;

const SURVIVAL_PRIORITY = `PRIORITY: 1=critical, 2=urgent, 3=important, 4=normal, 5=optional`;

function getSystemPrompt(context = {}) {
  let prompt = `${IDENTITY}\n\n${CORE_INSTRUCTIONS}\n\n${PERCEPTION_SCHEMA}\n\n${ACTION_SPACE}\n\n${OUTPUT_FORMAT}\n\n${SURVIVAL_PRIORITY}`;
  
  if (context.learnedRules && context.learnedRules.length > 0) {
    prompt += `\n\nRULES: ${context.learnedRules.slice(0, 3).join(', ')}`;
  }
  
  if (context.currentGoal) {
    prompt += `\n\nGOAL: ${context.currentGoal}`;
  }
  
  return prompt;
}

function getDecisionPrompt(perceptionData) {
  return `SITUATION: ${JSON.stringify(perceptionData)}\n\nDecide what action to take.`;
}

module.exports = {
  getSystemPrompt,
  getDecisionPrompt
};