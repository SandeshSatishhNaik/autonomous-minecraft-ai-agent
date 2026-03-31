// Test Phase 2: Intellect Module (standalone)
const systemPrompt = require('./src/intellect/systemPrompt');
const promptFormatter = require('./src/intellect/promptFormatter');

console.log('=== Testing Phase 2: The Intellect ===\n');

console.log('1. Testing System Prompt...');
const prompt = systemPrompt.getSystemPrompt({
  learnedRules: ['Build shelter before sunset'],
  currentGoal: 'Gather wood',
  recentReflection: 'Died to zombie at night - need weapon'
});
console.log('✓ System prompt generated (' + prompt.length + ' chars)\n');

console.log('2. Testing Prompt Formatter (without bot)...');
try {
  const perceptionData = promptFormatter.getFullPerceptionData();
  console.log('✓ Perception data formatted');
  console.log('   Status:', perceptionData.self.status || perceptionData.environment.status || 'ready');
  console.log('');
} catch (e) {
  console.log('⚠ Error:', e.message, '\n');
}

console.log('3. Testing LLM Ollama connection...');
const brain = require('./src/intellect/brain');

brain.think({ currentGoal: 'Test response' }).then(decision => {
  console.log('✓ LLM response received:');
  console.log('   Think:', decision.think);
  console.log('   Decision:', decision.decision);
  console.log('   Action:', decision.action);
  console.log('   Target:', decision.target);
  console.log('   Priority:', decision.priority);
  console.log('');
  console.log('=== Phase 2 Tests Complete ===');
}).catch(err => {
  console.error('✗ LLM call failed:', err.message);
});