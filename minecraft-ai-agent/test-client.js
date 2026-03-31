const ollama = require('./src/intellect/ollama');

async function test() {
  try {
    const response = await ollama.chat([
      { role: 'user', content: 'Reply with exactly 3 words.' }
    ]);
    console.log('✅ Ollama client works!');
    console.log('Response:', response.message.content);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

test();