// Quick test - just the LLM call
const ollama = require('./src/intellect/ollama');

console.log('Testing Ollama directly...');

ollama.chat([
  { role: 'user', content: 'Say "test successful" in 3 words.' }
], 'qwen2.5:3b', { temperature: 0.3, format: 'json' })
  .then(response => {
    console.log('Response:', response.message.content);
  })
  .catch(err => {
    console.error('Error:', err.message);
  });