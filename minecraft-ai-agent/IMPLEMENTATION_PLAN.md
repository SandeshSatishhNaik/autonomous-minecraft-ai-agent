# 🎯 IMPLEMENTATION PLAN: Making the Bot a Real Minecraft Player

> Status: In Progress
> Created: April 1, 2026
> Purpose: Comprehensive feature list for bot enhancement

---

## 📋 COMPLETE IMPLEMENTATION LIST

### 🔴 PHASE 1: TOOL-BASED MINING SYSTEM (CRITICAL)

#### File: `src/muscles/tools.js` - ENHANCE

```
1.1 TOOL_REQUIREMENT_MATRIX
    - Add constant: block → required tool mapping
    - stone/cobblestone/ores → pickaxe
    - oak_log/birch_log → axe
    - dirt/sand/gravel → shovel
    - grass_block/dirt → hand (any)

1.2 TOOL_EFFICIENCY constant
    - wooden: 2, stone: 4, iron: 6, diamond: 8, netherite: 9

1.3 findBestTool(toolType)
    - Input: toolType ('pickaxe', 'axe', 'shovel', 'sword', 'any')
    - Output: best available tool from inventory
    - Check durability, prefer higher durability

1.4 smartMine(blockName)
    - Check TOOL_REQUIREMENT_MATRIX
    - Call findBestTool() to get appropriate tool
    - Equip tool in hand before digging
    - Handle fallback to hand if no tool
    - Calculate and wait mining time

1.5 getMiningTime(blockName, toolName)
    - Return delay in ms based on block hardness + tool efficiency
```

---

### 🔴 PHASE 2: CRAFTING SYSTEM (CRITICAL)

#### NEW FILE: `src/muscles/crafter.js`

```
2.1 RECIPE_DATABASE
    - Load recipes from 'minecraft-data'
    - Store in memory for quick access

2.2 getAvailableRecipes()
    - Filter recipes that can be crafted with current inventory
    - Return list of craftable items

2.3 canCraft(recipeName, count)
    - Check if all ingredients exist in inventory
    - Calculate: required vs available
    - Return boolean

2.4 findNearbyCraftingTable()
    - Scan nearby blocks for 'crafting_table'
    - Return position or null

2.5 craftItem(recipeName, count)
    - Find crafting table if recipe needs it
    - Open crafting interface (bot.openContainer() or crafting)
    - Place ingredients in correct pattern
    - Click result slot
    - Collect crafted items
    - Return { success: true/false, item: itemName }

2.6 CRAFTING_RECIPES constant (common recipes)
    - oak_planks: 1 oak_log → 4 planks
    - crafting_table: 4 oak_planks → 1 table
    - wooden_pickaxe: 2 planks + 2 sticks → 1
    - stone_pickaxe: 3 cobblestone + 2 sticks → 1
    - torch: 1 coal + 1 stick → 4 torches
    - stick: 2 planks → 4 sticks
    - chest: 8 oak_planks → 1
    - furnace: 8 cobblestone → 1
    - sword: varies by material
```

---

### 🔴 PHASE 3: BLOCK PLACEMENT SYSTEM (CRITICAL)

#### File: `src/muscles/tools.js` - ADD

```
3.1 selectBlockFromInventory(blockName)
    - Search inventory for block
    - If found, select in hotbar (quick bar)
    - Return success/failure

3.2 placeBlock(blockName, targetPosition, face)
    - targetPosition: {x, y, z} - adjacent block position
    - face: 'north', 'south', 'east', 'west', 'up', 'down'
    - Get reference block at targetPosition
    - Call bot.placeBlock(referenceBlock, face)
    - Return success/failure

3.3 placeBlockAt(blockName, absolutePosition)
    - Calculate adjacent position and face
    - Call placeBlock()

3.4 buildSimpleStructure(type, startPosition)
    - shelter: 3x3 floor, walls 2 high, door gap
    - floor: 3x3 blocks
    - wall: linear x or z direction
    - tower: vertical stack
```

---

### 🟡 PHASE 4: NATURAL MOVEMENT PHYSICS (HIGH)

#### File: `src/index.js` - ENHANCE keepalive
#### File: `src/muscles/survival.js` - ADD

```
4.1 randomJumpWhileWalking()
    - 10% chance to jump every 2 seconds while pathfinding active
    - Jump duration: 200-400ms
    - Makes movement more natural

4.2 sprintWhenFleeing()
    - In fleeToSafety() function
    - Enable sprint: bot.setControlState('sprint', true)
    - Disable after fleeing complete

4.3 swimmingBehavior()
    - Detect water blocks at bot position
    - If in water: setControlState('jump', true) to swim up
    - Find water surface and exit

4.4 sneakAtEdges()
    - Check block 1 unit in movement direction
    - If empty/air: enable sneak to prevent falling
    - After passing edge: disable sneak

4.5 lookAroundNaturally()
    - Randomly change look direction 5% of time
    - Small yaw/pitch changes
```

---

### 🟡 PHASE 5: SMART INVENTORY MANAGEMENT (HIGH)

#### NEW FILE: `src/muscles/inventory.js`

```
5.1 JUNK_ITEMS constant
    ['rotten_flesh', 'bone', 'string', 'arrow', 'gunpowder', 
     'spider_eye', 'leather', 'feather', 'rabbit_hide']

5.2 KEEP_THRESHOLDS constant
    cobblestone: 64
    dirt: 32
    oak_log: 16
    coal: 16
    iron_ingot: 8
    torch: 16
    bread: 8
    pickaxe: 1
    sword: 1

5.3 organizeInventory()
    - Drop all JUNK_ITEMS
    - Combine partial stacks (same item, < 64)
    - Drop items exceeding KEEP_THRESHOLDS

5.4 checkInventoryStatus()
    - Return current counts of all items
    - Alert for low items below threshold

5.5 tossItem(itemName, count)
    - Drop specific items using bot.toss()

5.6 findEmptySlots()
    - Count available inventory slots

5.7 getItemCount(itemName)
    - Return total count of item in inventory
```

---

### 🟡 PHASE 6: COMBAT ENHANCEMENT (HIGH)

#### NEW FILE: `src/muscles/combat.js`

```
6.1 evaluateThreat(entity)
    - Check if entity is hostile (zombie, skeleton, creeper, spider, etc.)
    - Calculate distance to bot
    - Return threat object: { entity, distance, damage, level }

6.2 isHostile(entity)
    - Check entity.type === 'hostile'
    - Or entity.name in HOSTILE_MOBS list

6.3 equipBestWeapon()
    - Get all swords/axes from inventory
    - Sort by damage value
    - Equip highest damage to hand

6.4 equipBestArmor()
    - Get all armor pieces
    - Sort by protection points
    - Equip to appropriate slots (hand, chest, legs, feet)

6.5 autoCombat(target)
    - If threat level HIGH (close distance): flee
    - If threat level MEDIUM: equip weapon + attack
    - If threat level LOW: ignore or keep distance

6.6 attackWithCooldown(target)
    - Use bot.attack() with proper timing
    - Attack speed: ~2 attacks/second for sword
    - Wait 500ms between attacks
```

---

### 🟡 PHASE 7: TOOL DURABILITY SYSTEM (HIGH)

#### File: `src/muscles/inventory.js` - ADD

```
7.1 checkToolDurability()
    - Get currently equipped item
    - Check item.durability (or item metadata)
    - Return percentage remaining
    - Alert if < 20%

7.2 findBackupTool(toolType)
    - Search inventory for same tool type
    - Return best one with highest durability

7.3 replaceBrokenTool()
    - Called when current tool breaks (dig fails)
    - Find backup and equip
    - If no backup, try to craft new one
```

---

### 🟢 PHASE 8: FARMING SYSTEM (MEDIUM)

#### NEW FILE: `src/muscles/farming.js` (Future)

```
8.1 detectCrops()
    - Find wheat, carrots, potatoes nearby
    - Check growth stage

8.2 harvestCrop(position)
    - Right-click mature crop
    - Collect drops

8.3 plantCrop(cropType, position)
    - Use seeds on tilled soil
    - Wait for growth

8.4 treeChop()
    - Find tree logs nearby
    - Mine all logs (use axe)
    - Collect drops
    - Plant saplings
```

---

### 🟢 PHASE 9: BUILDING STRUCTURES (MEDIUM)

#### File: `src/muscles/builder.js` (Future)

```
9.1 buildShelter(position)
    - Check time of day
    - If night: build 3x3 shelter
    - Place floor, walls, ceiling
    - Leave door gap

9.2 buildStorage()
    - Place chests in rows
    - Connect with walls/roof

9.3 buildFence(enclosureType)
    - Create animal pen
    - 4 walls + gate
```

---

## 📁 NEW FILE STRUCTURE

```
minecraft-ai-agent/src/
├── index.js                           (MODIFIED)
├── perception/
│   ├── scanner.js
│   ├── events.js
│   └── inventory.js
├── muscles/
│   ├── tools.js                       (MODIFIED - add mining, placement)
│   ├── executor.js
│   ├── queue.js
│   ├── survival.js                    (MODIFIED - add movement physics)
│   ├── crafter.js                     (NEW - crafting)
│   ├── inventory.js                   (NEW - smart inventory)
│   ├── combat.js                      (NEW - combat)
│   ├── farming.js                     (NEW - future)
│   └── builder.js                      (NEW - future)
└── intellect/
    ├── brain.js
    ├── ollama.js
    ├── systemPrompt.js
    └── promptFormatter.js
```

---

## ⏱️ IMPLEMENTATION ORDER

```
WEEK 1:
├── Phase 1.1-1.3: Tool Requirement Matrix + findBestTool
├── Phase 1.4-1.5: smartMine + mining time
├── Phase 2.1-2.3: Recipe database + canCraft
└── Phase 2.4-2.6: Find crafting table + craftItem

WEEK 2:
├── Phase 3.1-3.2: Block selection + placement
├── Phase 3.3-3.4: Build structures
├── Phase 4.1-4.2: Random jump + sprint
└── Phase 4.3-4.5: Swimming + sneak + look

WEEK 3:
├── Phase 5.1-5.3: Junk drop + thresholds
├── Phase 5.4-5.7: Organization functions
├── Phase 6.1-6.3: Threat evaluation
└── Phase 6.4-6.6: Auto combat

WEEK 4:
├── Phase 7: Tool durability
├── Phase 8: Farming (if time)
└── Phase 9: Building (if time)
```

---

## ✅ CHECKLIST

- [ ] Phase 1: Tool-Based Mining
- [ ] Phase 2: Crafting System  
- [ ] Phase 3: Block Placement
- [ ] Phase 4: Natural Movement
- [ ] Phase 5: Smart Inventory
- [ ] Phase 6: Combat Enhancement
- [ ] Phase 7: Durability Tracking
- [ ] Phase 8: Farming (Future)
- [ ] Phase 9: Building (Future)

---

## ⚙️ REQUIRED NPM PACKAGES

```bash
npm install mineflayer-tool mineflayer-pvp
```

---

## 📝 NOTES

- Remove this file after implementation complete
- Focus on Tier 1 (Phases 1-3) first - they are critical
- Phases 4-7 can run in parallel
- Phases 8-9 are advanced, implement later