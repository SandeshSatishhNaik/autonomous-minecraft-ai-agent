// Direct test of brain with detailed output
require('dotenv').config();
const brain = require('./src/intellect/brain');
const ollama = require('./src/intellect/ollama');

console.log('=== Direct Brain Test ===\n');

brain.init(null);
console.log('Brain initialized\n');

brain.think({ currentGoal: 'Explore' }).then(decision => {
  console.log('\n=== DECISION RESULT ===');
  console.log('Think:', decision.think);
  console.log('Decision:', decision.decision);
  console.log('Action:', decision.action);
  console.log('Target:', decision.target);
  console.log('Priority:', decision.priority);
  console.log('Reasoning:', decision.reasoning);
  console.log('=======================\n');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});

setTimeout(() => { console.log('Timeout'); process.exit(1); }, 45000);