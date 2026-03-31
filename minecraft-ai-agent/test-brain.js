// Test script to verify brain integration
// Run this to test the LLM decision making

require('dotenv').config();
const brain = require('./src/intellect/brain');
const scanner = require('./src/perception/scanner');
const inventory = require('./src/perception/inventory');

console.log('=== Testing Brain Integration ===\n');

// Simulate having a bot
const mockBot = {
  entity: {
    position: { x: -36, y: 64, z: -26 },
    yaw: 0
  },
  health: 20,
  food: 20,
  inventory: {
    items: () => [
      { name: 'oak_log', count: 4, displayName: 'Oak Log' },
      { name: 'cobblestone', count: 8, displayName: 'Cobblestone' }
    ]
  },
  heldItem: null,
  quickBarSlot: 0,
  world: { time: 6000 }
};

// Initialize modules with mock
scanner.init(mockBot);
inventory.init(mockBot);
brain.init(mockBot);

console.log('1. Testing perception...');
const scanData = scanner.scanEnvironment(true);
console.log('   Position:', scanData.position);
console.log('   Biome:', scanData.biome?.name);
console.log('   Time:', scanData.time?.period);

const invData = inventory.getInventory();
console.log('   Inventory items:', invData.length);

console.log('\n2. Testing LLM decision...');
brain.think({
  currentGoal: 'Survive and gather resources'
}).then(decision => {
  console.log('   Think:', decision.think);
  console.log('   Decision:', decision.decision);
  console.log('   Action:', decision.action);
  console.log('   Target:', decision.target);
  console.log('   Priority:', decision.priority);
  console.log('   Reasoning:', decision.reasoning);
  
  console.log('\n=== Test Complete ===');
}).catch(err => {
  console.error('Error:', err.message);
});