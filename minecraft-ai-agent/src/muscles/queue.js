// Muscles Module: Action Queue
// Phase 3: The Muscles - Priority action queue system
// Like a real person: thinks, plans, executes in order

let executor = null;

let queue = [];
let isProcessing = false;
let isPaused = false;
const MAX_QUEUE = 20;

function init(botInstance) {
  executor = require('./executor');
  console.log('[QUEUE] ✓ Action queue initialized');
}

// Add action to queue
function enqueue(decision) {
  const { action, target, priority = 3, context = {} } = decision;
  
  // Check queue size
  if (queue.length >= MAX_QUEUE) {
    console.log(`[QUEUE] Queue full (${MAX_QUEUE}), removing lowest priority`);
    removeLowestPriority();
  }
  
  const item = {
    id: Date.now() + Math.random(),
    action,
    target,
    priority,
    context,
    addedAt: Date.now(),
    retries: 0
  };
  
  // Insert based on priority (lower number = higher priority)
  const insertIndex = queue.findIndex(q => q.priority > priority);
  if (insertIndex === -1) {
    queue.push(item);
  } else {
    queue.splice(insertIndex, 0, item);
  }
  
  console.log(`[QUEUE] Added: ${action} -> ${target || 'none'} (priority: ${priority}, queue: ${queue.length})`);
  
  // Start processing if not already
  if (!isProcessing && !isPaused) {
    processQueue();
  }
  
  return item.id;
}

// Remove lowest priority item
function removeLowestPriority() {
  if (queue.length === 0) return;
  
  // Find lowest priority (highest number)
  let lowestIndex = 0;
  let lowestPriority = queue[0].priority;
  
  for (let i = 1; i < queue.length; i++) {
    if (queue[i].priority > lowestPriority) {
      lowestPriority = queue[i].priority;
      lowestIndex = i;
    }
  }
  
  const removed = queue.splice(lowestIndex, 1)[0];
  console.log(`[QUEUE] Removed: ${removed.action} (priority: ${removed.priority})`);
}

// Process queue one by one
async function processQueue() {
  if (isProcessing || isPaused || queue.length === 0) {
    return;
  }
  
  isProcessing = true;
  
  while (queue.length > 0 && !isPaused) {
    const item = queue[0];
    
    console.log(`[QUEUE] Processing: ${item.action} (remaining: ${queue.length})`);
    
    try {
      // Execute the action
      const result = await executor.execute({
        action: item.action,
        target: item.target,
        priority: item.priority
      });
      
      // Remove from queue if successful
      if (result.success) {
        queue.shift();
        console.log(`[QUEUE] ✓ Complete: ${item.action}`);
      } else {
        // Handle failure
        item.retries++;
        
        if (item.retries >= 2) {
          console.log(`[QUEUE] ✗ Failed after retries: ${item.action}`);
          queue.shift(); // Remove failed item
        } else {
          // Move to end of queue
          queue.shift();
          queue.push(item);
          console.log(`[QUEUE] Retry later: ${item.action}`);
        }
      }
      
      // Small delay between actions (like real person)
      await sleep(500);
      
    } catch (error) {
      console.log(`[QUEUE] Error: ${error.message}`);
      queue.shift();
    }
  }
  
  isProcessing = false;
  console.log('[QUEUE] Queue empty, waiting for new items');
}

// Pause queue processing
function pause() {
  isPaused = true;
  console.log('[QUEUE] Queue paused');
}

// Resume queue processing
function resume() {
  isPaused = false;
  console.log('[QUEUE] Queue resumed');
  if (!isProcessing) {
    processQueue();
  }
}

// Clear queue
function clear() {
  queue = [];
  console.log('[QUEUE] Cleared');
}

// Get queue status
function getStatus() {
  return {
    size: queue.length,
    isProcessing,
    isPaused,
    nextAction: queue[0] || null,
    items: queue.map(q => ({
      action: q.action,
      target: q.target,
      priority: q.priority
    }))
  };
}

// Skip current action
function skip() {
  if (queue.length > 0) {
    const skipped = queue.shift();
    console.log(`[QUEUE] Skipped: ${skipped.action}`);
    return skipped;
  }
  return null;
}

// Emergency: clear all and stop
function emergencyClear() {
  const count = queue.length;
  queue = [];
  isPaused = true;
  executor.emergencyStop();
  console.log(`[QUEUE] 🔴 Emergency clear: ${count} items removed`);
  return count;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  enqueue,
  pause,
  resume,
  clear,
  getStatus,
  skip,
  emergencyClear
};