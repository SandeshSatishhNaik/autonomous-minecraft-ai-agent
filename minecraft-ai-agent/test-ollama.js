const ollama = require('ollama');

async function testOllama() {
  try {
    const response = await ollama.chat({
      model: 'qwen2.5-coder:7b',
      messages: [{ role: 'user', content: 'Say "Hello from Ollama" in exactly 3 words.' }],
      options: { temperature: 0.3 }
    });
    console.log('✅ Ollama npm package works!');
    console.log('Response:', response.message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOllama();