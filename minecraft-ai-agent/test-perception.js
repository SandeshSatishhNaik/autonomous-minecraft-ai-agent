// Test perception data flow
require('dotenv').config();

console.log('=== Testing Perception Data Flow ===\n');

// Load modules
const scanner = require('./src/perception/scanner');
const inventory = require('./src/perception/inventory');
const promptFormatter = require('./src/intellect/promptFormatter');

// Create mock bot
const mockBot = {
  entity: {
    position: { x: -27, y: 112, z: -36 },
    yaw: 0
  },
  health: 20,
  food: 20,
  quickBarSlot: 0,
  world: { time: 6000 }
};

// Initialize modules
scanner.init(mockBot);
inventory.init(mockBot);

console.log('1. Testing scanner...');
const scan = scanner.scanEnvironment(true);
console.log('   Scan result:', JSON.stringify(scan, null, 2).substring(0, 300));

console.log('\n2. Testing inventory...');
const inv = inventory.getInventory();
console.log('   Inventory:', inv);

console.log('\n3. Testing promptFormatter...');
const promptData = promptFormatter.buildDecisionPrompt({ currentGoal: 'test' });
console.log('   System prompt length:', promptData.system.length);
console.log('   User prompt:', promptData.user.substring(0, 200));

console.log('\n=== Test Complete ===');
process.exit(0);