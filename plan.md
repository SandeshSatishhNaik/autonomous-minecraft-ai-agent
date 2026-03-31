# 🗺️ Master Plan: Autonomous Minecraft LLM Agent

> **Version:** 5-Star Enhanced Edition  
> **Architecture:** Mineflayer (Node.js) + Local LLM (Ollama/Qwen) + Agentic Loop  
> **Environment:** T-Launcher Local Server (Offline Mode)  
> **Target:** Windows / Linux / macOS

---

## 📌 Quick Summary

This project builds an autonomous AI bot that plays Minecraft without human control. The bot perceives its environment, thinks using a local LLM, executes actions, learns from mistakes, and plays indefinitely.

---

## 🛠️ Phase 1: The Senses (Environment & Perception)

**Objective:** Establish the connection to the game and build the bot's ability to "see" and "feel."

### Tasks

1. Set up the local Minecraft server (online-mode=false).
2. Initialize the Node.js project and install mineflayer.
3. Write the connection script so the bot spawns in the world.
4. Build the Intellect scanner: Read coordinates, time of day, and nearby blocks.
5. Build the Instinct triggers: Set up event listeners for taking damage, hunger changes, and nearby hostile mobs.

### Milestone

The bot can log into the game, print its surroundings to the terminal, and trigger an alert if you punch it.

---

## 🛡️ Phase 1.5: Inventory & Self-Awareness

**Objective:** The bot must know what it has, not just what it sees.

### Tasks

1. Read and format the bot's full inventory (item name, count, durability).
2. Track health, food level, oxygen, and armor status.
3. Detect nearby interactive blocks (crafting table, furnace, chest, anvil).
4. Track the currently equipped item (mainhand + offhand).
5. Format all of this into a structured `selfState` JSON object.

### Self-State JSON Format

```json
{
  "health": 18,
  "food": 14,
  "armor": 0,
  "position": { "x": 10, "y": 64, "z": -22 },
  "biome": "plains",
  "timeOfDay": "day",
  "mainHand": "wooden_sword",
  "inventory": [
    { "name": "oak_log", "count": 12 },
    { "name": "cobblestone", "count": 34 }
  ],
  "nearbyEntities": ["zombie", "cow"],
  "nearbyBlocks": ["crafting_table", "grass_block"]
}
```

### Milestone

Bot can report: *"I have 12 oak logs, 18 health, and I'm holding a wooden sword. There's a zombie 8 blocks away."*

---

## 🧠 Phase 2: The Intellect (LLM Integration & Communication)

**Objective:** Connect the Perception layer to your local LLM (Ollama) so the bot can understand its environment.

### Tasks

1. Install the API wrapper for Ollama in Node.js (axios or official ollama npm package).
2. Create a "System Prompt" that tells the LLM: "You are an AI inside Minecraft..."
3. Write a function that formats the Phase 1 & 1.5 scan data into a JSON or text prompt and sends to the LLM.
4. Route the LLM's text response back to the Mineflayer bot.chat() function.
5. **Implement Strict JSON Output Enforcement (3 layers):**
   - Layer 1: Use Ollama's `format: "json"` parameter
   - Layer 2: Strip markdown fences via regex
   - Layer 3: try/catch + retry with "Fix your JSON" prompt (max 2 retries)

### JSON Enforcement Code Pattern

```javascript
async function getLLMAction(prompt) {
  const response = await ollama.chat({
    model: 'qwen2.5',
    messages: [{ role: 'user', content: prompt }],
    format: 'json'  // Layer 1
  });

  let text = response.message.content;
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, ''); // Layer 2

  try {
    return JSON.parse(text); // Layer 3
  } catch (e) {
    // Retry with correction prompt
    const retry = await ollama.chat({
      model: 'qwen2.5',
      messages: [
        { role: 'user', content: prompt },
        { role: 'assistant', content: text },
        { role: 'user', content: 'Your response was not valid JSON. Please respond ONLY with valid JSON.' }
      ],
      format: 'json'
    });

    return JSON.parse(retry.message.content);
  }
}
```

### Milestone

You can type "What do you see?" in the Minecraft chat, and the bot will look at its coordinates, process it through the LLM, and reply: "I am at X:10, Y:64. I see grass and it is daytime."

---

## 🦾 Phase 3: The Muscles (Action Execution)

**Objective:** Give the LLM the ability to actually do things instead of just talking.

### Tasks

1. Install mineflayer-pathfinder (a plugin that handles the complex math of walking around blocks).
2. Create a set of JavaScript "Tools" (functions): walkTo(x,z), equipItem(name), mineBlock(type).
3. Update the LLM prompt to use Function Calling / Structured Output. The LLM must output JSON like `{ "action": "mineBlock", "target": "oak_log" }` instead of plain text.
4. Build the Executor module that parses the LLM's JSON and triggers the corresponding Mineflayer tool.
5. **Implement Action Queue System:**
   - New LLM decisions get enqueued, not immediately executed
   - Actions run one at a time with success/failure callbacks
   - Only Priority 1 survival reflexes can interrupt
   - On failure: failed action + error go back to LLM for re-planning

### Action Queue Pattern

```
Queue: [ walkTo(10, 64), mineBlock("oak_log"), craftItem("planks") ]
                 ↑
           Currently executing (locked)
```

### Milestone

You type "Come to me" in chat, the LLM determines your coordinates, outputs a walkTo command, and the bot walks to your character.

---

## 📊 Phase 3.5: Web Dashboard (Observability)

**Objective:** Live debugging and monitoring — stare at terminal logs is painful.

### Tasks

1. Set up a minimal Express.js + WebSocket server.
2. Stream live data from the bot:
   - Current position (render on a 2D minimap)
   - Current goal / active action
   - Inventory contents
   - Full LLM conversation history (prompt → response)
   - Success/failure log
3. Build a simple HTML/CSS/JS frontend (no framework needed).

### Tech

```bash
npm install express ws
```

### Milestone

Open `localhost:3000` in a browser → see the bot's position, inventory, current thought process, and action log updating in real time.

---

## 🔄 Phase 4: The Agentic Loop & The Critic (Self-Correction)

**Objective:** Remove the human from the loop. Make the bot act on its own and fix its own mistakes.

### Tasks

1. Set up a setInterval loop that triggers a thought process every few seconds, OR is triggered by the "Instinct" events from Phase 1.
2. Build the Critic Node: Wrap the Action Executor in try/catch blocks.
3. If mineflayer-pathfinder fails (e.g., bot gets stuck in a hole), catch the error.
4. Feed the error back to the LLM: "Action failed: Path blocked. Adjust coordinates."
5. **Implement Hard-Coded Survival Reflexes (Priority System):**

| Priority | Level | Trigger | Action |
|----------|-------|---------|--------|
| 1 | CRITICAL | Health < 4 | Sprint away from hostile (NO LLM) |
| 1 | CRITICAL | On fire | Jump in water / place water bucket |
| 1 | CRITICAL | Falling | Stop all movement |
| 1 | CRITICAL | Creeper nearby | Sprint away immediately |
| 2 | URGENT | Health < 10 | Eat food if available |
| 2 | URGENT | Night + no shelter | Dig 1x1x3 hole |
| 2 | URGENT | Hostile mob nearby | Fight or flee (LLM decides) |
| 3 | NORMAL | - | Gather, craft, build, explore (full LLM) |

### Implementation

A simple `if/else` priority check that runs **before** the LLM is called each tick.

### Milestone

The bot tries to walk through a wall, realizes it can't, stops, re-evaluates the prompt, and decides to mine through the wall or walk around it automatically.

---

## 🧠 Phase 5: Self-Learning System (Human-Like Learning)

**Objective:** The bot must learn ALL skills in Minecraft through experience, like a human — not just record actions, but genuinely improve over time.

> **Full design document:** See `self_learning_system.md` for detailed architecture.

### The 5 Pillars of Self-Learning

| Pillar | Name | What It Does |
|--------|------|-------------|
| 1 | **Experience Memory** | Log every action + context + result + lesson learned |
| 2 | **Reflection Engine** | Periodically self-evaluate: *"What went well? What went badly?"* |
| 3 | **Strategy Evolution** | Create, score, and evolve behavioral rules from experience |
| 4 | **Skill Progression** | Track XP, levels (Lv0→Lv5), and milestones per skill category |
| 5 | **Curiosity Engine** | Actively seek new experiences and discover game mechanics |

### Tasks

1. **Experience Logger:** Log every action with full context, result, and LLM-generated lesson to `data/experience_log.json`.
2. **Reflection Sessions:** Every 30 minutes (or after death), ask LLM to analyze recent experiences and extract patterns.
3. **Rule Manager:** Maintain `data/learned_rules.json` — behavioral rules with confidence scores (0.0→1.0). Rules that help → confidence rises. Rules that fail → confidence drops. Below 0.2 → deleted.
4. **Skill Levels:** Track XP per skill category (wood_gathering, combat, building, mining, crafting, farming, navigation, survival). Each skill has Lv0→Lv5 with milestones.
5. **Curiosity Triggers:** Unknown block → try mining it. Unknown item → experiment. Unexplored biome → go there. Failed craft → try different recipes.
6. **Smart Context Window Management:**

| Strategy | Details |
|----------|---------|
| Sliding Window | Keep last 5-8 LLM exchanges |
| Summarization | Every 10 turns, LLM summarizes conversation |
| Selective Injection | Inject top 5 relevant rules + skill levels into prompt |
| Tiered Perception | Full scan every 5th tick; changes-only on other ticks |

### Learning Loop

```
ACT → OBSERVE → EVALUATE → LEARN → REMEMBER → REFLECT → ADAPT → IMPROVE → EXPLORE → REPEAT
```

### Files

| File | Purpose |
|------|---------|
| `src/learning/experienceLogger.js` | Logs every action + lesson |
| `src/learning/reflectionEngine.js` | Periodic self-evaluation |
| `src/learning/ruleManager.js` | Create, score, prune rules |
| `src/learning/skillProgression.js` | XP, levels, milestones |
| `src/learning/curiosityEngine.js` | Exploration drive + discoveries |
| `data/experience_log.json` | Full action history |
| `data/reflections.json` | Self-evaluation logs |
| `data/learned_rules.json` | Behavioral rules |
| `data/skill_levels.json` | Skill XP + levels |
| `data/discoveries.json` | World knowledge |

### Milestone

After 2 hours of play, the bot has: learned 15+ behavioral rules from experience, reached Lv2+ in wood gathering and combat, discovered that iron is found below Y:63, and stopped dying at night because it learned to build shelter before sunset — all without being explicitly programmed to do any of this.

---

## 🗺️ Phase 5.5: Spatial Memory & World Map

**Objective:** The bot must remember where things are — locations, points of interest, and death spots.

### Tasks

1. **Location Memory Database:** Create `data/world_map.json` to store named locations.
2. **Auto-save key locations:** When bot finds a village, cave, diamond vein, or builds a base → save coordinates with a label.
3. **Explored area tracking:** Track which chunks/areas have been visited vs unexplored.
4. **Death location tracking:** On death → save coordinates → after respawn, navigate back to collect dropped items before 5-minute despawn.
5. **Point-of-Interest System:**

```json
{
  "home": { "x": 10, "y": 64, "z": -22, "type": "base" },
  "diamond_mine": { "x": 45, "y": 12, "z": -100, "type": "resource" },
  "village_1": { "x": 200, "y": 70, "z": 50, "type": "village" },
  "last_death": { "x": 30, "y": 40, "z": -80, "type": "death", "timestamp": 1711800000 }
}
```

### Milestone

Bot says: *"I remember there's a cave with iron at X:45, Z:-100. Let me go back there."* After dying, bot respawns and rushes to death location to recover items.

---

## 👑 Phase 6: The Goal Engine (True Autonomy)

**Objective:** Give the bot a high-level purpose so it can play the game indefinitely.

### Tasks

1. Build a High-Level prompt layer that dictates long-term goals based on game state (e.g., If no house -> Build house. If night time -> Hide. If hungry -> Hunt).
2. **Implement Crafting State Machine:**
   - Store Minecraft recipes in `recipes.json`
   - Build recursive dependency resolver
   - LLM decides what to craft; state machine handles how
3. **Add Combat System** via mineflayer-pvp plugin.
4. **Add Auto-Eat** via mineflayer-auto-eat plugin.
5. **Add Auto-Equip Armor** via mineflayer-armor-manager plugin.
6. **Add Best Tool Selection** via mineflayer-tool plugin.
7. **Add Resource Collection** via mineflayer-collectblock plugin.
8. Let the bot run on the server 24/7.

### Crafting Dependency Example

```
Goal: craft "wooden_pickaxe"
  └─ Needs: 3x planks + 2x stick
       └─ Needs: 1x oak_log → 4x planks
       └─ Needs: 2x planks → 4x sticks
  └─ Needs: crafting_table nearby
       └─ If none: craft it → place it
```

### Milestone

You start the server. Without any input from you, the bot spawns, punches a tree, crafts tools, mines stone, builds a 5x5 dirt hut, and hides inside when the sun goes down.

---

## 🏠 Phase 6.5: Survival Infrastructure

**Objective:** Build the systems the bot needs to sustain itself indefinitely — shelter, sleep, storage, smelting, lighting.

### 6.5.1 — Building Blueprint System

The bot needs to know *how* to build structures, not just *that* it should.

1. Create `data/blueprints.json` with pre-defined structure layouts.
2. Build a **block placement engine** (place bottom-up, layer by layer).
3. **Material calculator:** "This 5×5 hut needs 80 dirt blocks — do I have enough?"
4. **Upgrade path:** Dirt hut → wood house → stone house → full base.

```json
{
  "basic_shelter": {
    "size": [5, 4, 5],
    "materials": { "dirt": 80, "oak_door": 1 },
    "layers": ["floor", "walls", "walls+door", "roof"]
  }
}
```

### 6.5.2 — Bed & Sleep System

1. **Craft a bed** early game (3 wool + 3 planks).
2. **Sleep at night** → skips nighttime entirely, avoids all mob spawns.
3. **Set spawn point** → sleeping in bed = respawn near base on death.
4. **Phantom prevention** → sleeping prevents Phantoms after 3 nights.

### 6.5.3 — Chest & Storage Management

1. **Craft and place chests** at home base.
2. **Inventory overflow logic:** When inventory full → go home → dump items in chest.
3. **Chest index database:** Remember what's in which chest.
4. **Smart retrieval:** Need iron? → check chest index → go to correct chest.

```json
{
  "chests": [
    { "position": [12, 64, -20], "contents": ["64x cobblestone", "32x iron_ore", "16x coal"] },
    { "position": [14, 64, -20], "contents": ["48x oak_log", "12x diamond"] }
  ]
}
```

### 6.5.4 — Smelting & Furnace Automation

1. **Furnace interaction:** Place fuel + raw material → wait → collect output.
2. **Smelt queue:** "Smelt 32 iron ore" → bot feeds furnace in batches.
3. **Fuel priority:** Coal > planks > sticks (efficiency order).
4. **Auto-collect:** Check furnace periodically for finished items.

### 6.5.5 — Torch & Lighting System

1. **Craft torches** (coal + stick).
2. **Area lighting:** Place torches every 6 blocks around base (prevents mob spawns).
3. **Cave lighting:** Auto-place torches while mining underground.
4. **Light level awareness:** Detect if area is dark enough for mob spawns.

### Milestone

Bot builds a shelter from a blueprint, places a bed and sleeps at night, stores overflow items in labeled chests, smelts iron ore into ingots, and lights up its base with torches — all autonomously.

---

## 🌾 Phase 7: Sustainability & Advanced Survival

**Objective:** Make the bot self-sustaining with renewable food, death recovery, weather awareness, and advanced combat.

### 7.1 — Farming & Food Sustainability

1. **Auto-farming:** Plant wheat/carrots/potatoes, wait for growth, harvest.
2. **Animal breeding:** Breed cows/pigs/chickens for renewable food + leather.
3. **Fishing:** Autonomous fishing when food is low and no farm exists.
4. **Cooking:** Use furnace to cook raw meat (cooked gives more hunger restoration).

### 7.2 — Death Recovery System

1. **Death event listener:** Detect death → log coordinates + cause of death.
2. **Auto-respawn:** Respawn immediately (at bed spawn if set).
3. **Item recovery:** Navigate back to death location within 5 minutes.
4. **Death analysis:** Feed death cause to LLM: *"You died to a Creeper. What should you do differently?"*
5. **Learning from death:** Store dangerous locations/situations in spatial memory.

### 7.3 — Weather & Environment Awareness

1. **Weather detection:** Rain, thunderstorm, clear sky.
2. **Thunderstorm behavior:** Seek shelter immediately (lightning kills + starts fires).
3. **Rain benefits:** Fishing is more effective during rain.
4. **Biome-specific rules:** Powdered snow danger in mountains, no water in Nether.

### 7.4 — Advanced Combat (Shield, Bow, Mob Tactics)

1. **Shield usage:** Craft + use shield to block attacks (especially skeleton arrows).
2. **Ranged combat:** Use bow + arrows against distant enemies.
3. **Mob-specific tactics:**
   - Don't look at Endermen
   - Use water bucket against Endermen
   - Fire/smite weapons against undead
   - Sprint-hit for knockback against Creepers
4. **Retreat & heal:** Disengage when health drops, eat food, re-engage.
5. **Target priority:** Creeper > Skeleton > Zombie > Spider > passive mobs.

### Milestone

Bot maintains a wheat farm, breeds animals for food, recovers items after death, seeks shelter during thunderstorms, and uses shield + bow in combat with mob-specific tactics.

---

## 🧬 Phase 7.5: Personality & Analytics

**Objective:** Make the bot feel alive and track its performance metrics.

### 7.5.1 — Personality & Communication

1. **Personality prompt:** Give the bot a configurable personality (cautious, adventurous, funny).
2. **Natural chat:** In-game messages feel conversational, not robotic.
3. **Emotion state:** Scared (low health), happy (crafted something), frustrated (repeated failures).
4. **Commentary:** Bot narrates actions: *"Found iron! Time to upgrade my tools."*

### 7.5.2 — Performance Analytics

1. **LLM response time tracking:** Average, min, max per session.
2. **Action success rate:** "85% of mine actions succeeded, 60% of pathfinding succeeded."
3. **Resource efficiency:** "Gathered 120 wood in 10 minutes."
4. **Session stats:** Total blocks mined, items crafted, mobs killed, deaths.
5. **Dashboard graphs:** Visualize trends over time on the web dashboard.

### 7.5.3 — Multiplayer Interaction (Optional)

1. **Player detection:** Recognize human players vs mobs.
2. **Chat command system:** Respond to commands: "follow me", "guard this area", "give me cobblestone".
3. **Cooperative tasks:** Player says "let's build a house" → bot assists.
4. **Whitelist/blacklist:** Trust certain players, avoid/flee from others.

### Milestone

Bot has a personality, narrates its journey, tracks success rates on the dashboard, and can cooperate with human players via chat commands.

---

## 🔌 Essential Plugins to Install

| Plugin | Install Command | Purpose |
|--------|-----------------|---------|
| `mineflayer-pathfinder` | `npm install mineflayer-pathfinder` | Navigation |
| `mineflayer-collectblock` | `npm install mineflayer-collectblock` | Walk to + mine + collect |
| `mineflayer-pvp` | `npm install mineflayer-pvp` | Combat |
| `mineflayer-armor-manager` | `npm install mineflayer-armor-manager` | Auto-equip armor |
| `mineflayer-auto-eat` | `npm install mineflayer-auto-eat` | Auto-eat when hungry |
| `mineflayer-tool` | `npm install mineflayer-tool` | Auto-select best tool |
| `prismarine-viewer` | `npm install prismarine-viewer` | 3D browser view |

---

## 📝 Logging & Debugging System

Use `winston` for structured logging:

```bash
npm install winston
```

### Log Format

```
[2026-03-30 22:30:01] [PERCEPTION] Position: 10, 64, -22 | Health: 18 | Food: 14
[2026-03-30 22:30:01] [PROMPT]     "You are at X:10... What should you do next?"
[2026-03-30 22:30:04] [LLM]        { "action": "mineBlock", "target": "oak_log" }
[2026-03-30 22:30:04] [EXECUTE]    mineBlock("oak_log") → STARTED
[2026-03-30 22:30:07] [RESULT]     mineBlock("oak_log") → SUCCESS (collected 1)
[2026-03-30 22:30:07] [CRITIC]     Action succeeded. No correction needed.
```

Log to file (`logs/agent.log`) for post-session analysis.

---

## 🧠 AI Model Recommendation (Hardware-Specific)

### Your Hardware: ASUS TUF F15

| Component | Spec |
|---|---|
| **CPU** | Intel Core i7-13620H (10 cores / 16 threads) |
| **RAM** | 16 GB DDR5 |
| **GPU** | NVIDIA GeForce RTX 4060 Laptop |
| **VRAM** | 8 GB GDDR6 (CUDA Compute 8.9) |
| **Storage** | 477 GB NVMe SSD |

### What Fits in 8 GB VRAM

| Model Size | VRAM (Q4 Quantized) | Fits? | Speed |
|---|---|---|---|
| 1–3B | ~2–3 GB | ✅ Easily | ⚡ 50+ tok/s |
| 7–8B | ~4–5 GB | ✅ Yes | 🟢 20–35 tok/s |
| 14B | ~8–9 GB | ⚠️ Barely | 🟡 10–18 tok/s |
| 32B+ | 18+ GB | ❌ No | 🔴 Won't work |

### 🏆 Primary Model: `qwen2.5-coder:7b`

```bash
ollama pull qwen2.5-coder:7b
```

**Why this model:**
- **Code-tuned** = extremely reliable JSON/structured output
- **~4.5 GB VRAM** = leaves room for Minecraft + Node.js
- **~25–35 tok/s** on RTX 4060 = ~2–3s per response
- Perfect for action decisions (90% of the bot's work)

### Secondary Model: `qwen2.5:14b` (for strategic planning)

```bash
ollama pull qwen2.5:14b
```

Use ONLY for Phase 6 Goal Engine — deeper reasoning for long-term strategy. Slower (~12–15 tok/s) but smarter.

### Dual-Model Strategy

| Situation | Model | Why |
|---|---|---|
| Action decisions (90%) | `qwen2.5-coder:7b` | Fast, reliable JSON |
| Strategic planning (10%) | `qwen2.5:14b` | Better long-term reasoning |

### VRAM Budget (Everything Running)

| Process | VRAM |
|---|---|
| `qwen2.5-coder:7b` loaded | ~4.5 GB |
| Minecraft (T-Launcher) | ~1.5–2 GB |
| Windows + other | ~0.5 GB |
| **Total** | **~6.5–7 GB** |
| **Headroom** | **~1–1.5 GB** ✅ |

### Models to Avoid

| Model | Why |
|---|---|
| Any model > 14B | Won't fit in 8 GB VRAM |
| `mistral:7b` | Weaker function calling than Qwen |
| `phi3:3.8b` | Too small — bad reasoning |

### `.env` Configuration

```env
# Primary model (fast action decisions)
LLM_MODEL_FAST=qwen2.5-coder:7b

# Secondary model (strategic planning)
LLM_MODEL_THINK=qwen2.5:14b

# Ollama settings
OLLAMA_HOST=http://localhost:11434
LLM_TEMPERATURE=0.3
LLM_NUM_CTX=4096

# Minecraft server
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=AI_Agent

# Dashboard
DASHBOARD_PORT=3000
```

---

## 🏗️ Recommended Project Structure

```
minecraft-ai-agent/
├── src/
│   ├── index.js                 # Entry point — bot connection + main loop
│   ├── perception/
│   │   ├── scanner.js           # Block, entity, environment scanning
│   │   ├── inventory.js         # Inventory & self-state tracking
│   │   ├── weather.js           # Weather & environment detection
│   │   └── events.js            # Instinct triggers (damage, hunger, mobs)
│   ├── intellect/
│   │   ├── llm.js               # Ollama API wrapper + JSON enforcement
│   │   ├── promptBuilder.js     # Builds context-aware prompts
│   │   ├── contextManager.js    # Sliding window + summarization
│   │   └── personality.js       # Personality engine + emotion state
│   ├── actions/
│   │   ├── executor.js          # Parses LLM JSON → triggers Mineflayer
│   │   ├── actionQueue.js       # Queue system for sequential actions
│   │   ├── tools.js             # walkTo, mineBlock, craftItem, etc.
│   │   ├── combat.js            # PvE combat (melee + ranged + shield)
│   │   ├── building.js          # Blueprint-based block placement
│   │   └── farming.js           # Planting, harvesting, breeding
│   ├── survival/
│   │   ├── reflexes.js          # Hard-coded Priority 1 & 2 reactions
│   │   ├── crafting.js          # Recipe resolver + crafting state machine
│   │   ├── smelting.js          # Furnace automation + fuel management
│   │   ├── storage.js           # Chest management + inventory overflow
│   │   ├── lighting.js          # Torch crafting + area lighting
│   │   ├── sleep.js             # Bed crafting + sleep cycle
│   │   └── deathRecovery.js     # Respawn + navigate to death location
│   ├── memory/
│   │   ├── skillManager.js      # Save, load, match skills
│   │   └── spatialMemory.js     # World map + POI + death locations
│   ├── goals/
│   │   └── goalEngine.js        # High-level autonomous goal planning
│   ├── dashboard/
│   │   ├── server.js            # Express + WebSocket server
│   │   └── public/
│   │       ├── index.html       # Dashboard UI
│   │       ├── style.css
│   │       └── app.js           # WebSocket client + analytics graphs
│   └── utils/
│       ├── logger.js            # Winston logging setup
│       ├── config.js            # Environment variables + constants
│       └── analytics.js         # Performance tracking + session stats
├── prompts/
│   ├── system_prompt.md         # Core persona prompt
│   ├── personality.md           # Personality configuration
│   ├── action_schema.json       # JSON schema for LLM function calls
│   └── goal_templates.md        # Goal engine prompt templates
├── data/
│   ├── recipes.json             # Minecraft crafting recipes
│   ├── blueprints.json          # Building structure templates
│   ├── skills.json              # Learned skill sequences
│   ├── world_map.json           # Spatial memory + POI database
│   └── chest_index.json         # What's stored in which chest
├── logs/
│   └── agent.log                # Runtime logs
├── .env                         # API ports, model name, server IP
├── package.json
└── README.md
```

---

## ✅ Final Checklist: What Makes It 5 Stars (29 Items)

### Core Systems
- [ ] Inventory & self-awareness scanning (Phase 1.5)
- [ ] Strict JSON output enforcement (3-layer defense)
- [ ] Hard-coded survival reflexes (state machine)
- [ ] Action queue system (no conflicting actions)
- [ ] Smart context window management
- [ ] Structured logging with `winston`
- [ ] Live web dashboard (Express + WebSocket)
- [ ] Modular project structure
- [ ] `.env` based configuration
- [ ] Comprehensive error handling at every layer

### Plugins
- [ ] Combat system via `mineflayer-pvp`
- [ ] Auto-eat via `mineflayer-auto-eat`
- [ ] Auto-equip armor via `mineflayer-armor-manager`
- [ ] Best tool selection via `mineflayer-tool`
- [ ] Resource collection via `mineflayer-collectblock`

### Survival Infrastructure (Phase 6.5)
- [ ] Building blueprint system with material calculator
- [ ] Bed & sleep system (night skip + spawn point)
- [ ] Chest & storage management with chest index
- [ ] Smelting & furnace automation
- [ ] Torch & lighting system (mob-proof base)

### Advanced Features (Phase 7+)
- [ ] Spatial memory & world map (POI database)
- [ ] Farming & food sustainability (crops + animals)
- [ ] Death recovery system (respawn + item retrieval)
- [ ] Weather awareness (thunderstorm shelter)
- [ ] Advanced combat (shield + bow + mob-specific tactics)
- [ ] Crafting state machine with recipe resolver
- [ ] Personality & emotion system
- [ ] Performance analytics & session stats
- [ ] Dual-model LLM strategy (`qwen2.5-coder:7b` + `qwen2.5:14b`)

---

## 📊 Original vs Enhanced Rating

| Area | Original Rating | Enhanced Rating |
|------|-----------------|-----------------|
| Perception | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| LLM Output Handling | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Survival Reflexes | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Combat | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Resource Gathering | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Debugging & Logging | ⭐ | ⭐⭐⭐⭐⭐ |
| Observability | ⭐ | ⭐⭐⭐⭐⭐ |
| LLM Context Mgmt | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Model Choice | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Crafting Knowledge | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| Spatial Memory | ⭐ | ⭐⭐⭐⭐⭐ |
| Storage & Chests | ⭐ | ⭐⭐⭐⭐⭐ |
| Smelting | ⭐ | ⭐⭐⭐⭐⭐ |
| Sleep & Beds | ⭐ | ⭐⭐⭐⭐⭐ |
| Lighting | ⭐ | ⭐⭐⭐⭐⭐ |
| Death Recovery | ⭐ | ⭐⭐⭐⭐⭐ |
| Farming | ⭐ | ⭐⭐⭐⭐⭐ |
| Building System | ⭐ | ⭐⭐⭐⭐⭐ |
| Weather Awareness | ⭐ | ⭐⭐⭐⭐⭐ |
| Analytics | ⭐ | ⭐⭐⭐⭐⭐ |
| Personality | ⭐ | ⭐⭐⭐⭐⭐ |

---

## 📋 Phase Roadmap (Complete)

| Phase | Name | Status |
|-------|------|--------|
| 1 | The Senses (Perception) | ⬜ Not started |
| 1.5 | Inventory & Self-Awareness | ⬜ Not started |
| 2 | The Intellect (LLM Integration) | ⬜ Not started |
| 3 | The Muscles (Actions) | ⬜ Not started |
| 3.5 | Web Dashboard | ⬜ Not started |
| 4 | Agentic Loop & Critic | ⬜ Not started |
| 5 | Skill Library (Memory) | ⬜ Not started |
| 5.5 | Spatial Memory & World Map | ⬜ Not started |
| 6 | Goal Engine (Autonomy) | ⬜ Not started |
| 6.5 | Survival Infrastructure | ⬜ Not started |
| 7 | Advanced Survival | ⬜ Not started |
| 7.5 | Personality & Analytics | ⬜ Not started |

**Total: 12 phases → 29 checklist items → Full 5-star system** ⭐⭐⭐⭐⭐

---

> **This is now the complete, definitive plan. Every system needed for a truly autonomous,
> self-sustaining, intelligent Minecraft agent is documented here. Nothing is missing.** 🏆
