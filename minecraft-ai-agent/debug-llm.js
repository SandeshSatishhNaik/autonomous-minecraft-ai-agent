// Debug script to see raw LLM output
require('dotenv').config();
const ollama = require('./src/intellect/ollama');
const promptFormatter = require('./src/intellect/promptFormatter');

console.log('=== Debug: Raw LLM Output ===\n');

const promptData = promptFormatter.buildDecisionPrompt({
  currentGoal: 'Explore and survive'
});

console.log('System prompt length:', promptData.system.length);
console.log('User prompt:', promptData.user.substring(0, 200), '...\n');

ollama.chat([
  { role: 'system', content: promptData.system },
  { role: 'user', content: promptData.user + '\n\nRespond in JSON: {"think":"reason","action":"idle","target":null,"priority":5}' }
], 'phi3:latest', { temperature: 0.3 })
  .then(response => {
    console.log('Raw response:');
    console.log(response.message.content);
    console.log('\n--- Trying to parse ---');
    try {
      const parsed = JSON.parse(response.message.content);
      console.log('Parsed successfully:', JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Parse failed:', e.message);
      // Try to extract JSON
      const match = response.message.content.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          const extracted = JSON.parse(match[0]);
          console.log('Extracted:', JSON.stringify(extracted, null, 2));
        } catch (e2) {
          console.log('Extraction also failed');
        }
      }
    }
  })
  .catch(err => console.error('Error:', err.message));

setTimeout(() => process.exit(0), 30000);