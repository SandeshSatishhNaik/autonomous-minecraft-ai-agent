require('dotenv').config();
const axios = require('axios');

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const DEFAULT_MODEL = process.env.LLM_MODEL_FAST || 'qwen2.5:3b';

const client = axios.create({
  baseURL: OLLAMA_HOST,
  timeout: 60000, // 60 seconds for phi3
  headers: { 'Content-Type': 'application/json' }
});

async function chat(messages, model = DEFAULT_MODEL, options = {}) {
  const payload = {
    model,
    messages,
    stream: false,
    options: {
      temperature: options.temperature || parseFloat(process.env.LLM_TEMPERATURE) || 0.3,
      num_ctx: parseInt(process.env.LLM_NUM_CTX) || 4096,
      ...options
    }
  };

  if (options.format) {
    payload.format = options.format;
  }

  const response = await client.post('/api/chat', payload);
  return response.data;
}

async function generate(prompt, model = DEFAULT_MODEL, options = {}) {
  const payload = {
    model,
    prompt,
    stream: false,
    options: {
      temperature: options.temperature || parseFloat(process.env.LLM_TEMPERATURE) || 0.3,
      num_ctx: parseInt(process.env.LLM_NUM_CTX) || 4096,
      ...options
    }
  };

  if (options.format) {
    payload.format = options.format;
  }

  const response = await client.post('/api/generate', payload);
  return response.data;
}

async function listModels() {
  const response = await client.get('/api/tags');
  return response.data.models;
}

module.exports = { chat, generate, listModels, client };