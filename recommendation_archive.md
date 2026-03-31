# 🌟 Recommendations: Elevating the Autonomous Minecraft Agent to ⭐⭐⭐⭐⭐

> These recommendations address every gap in the original `plan.md` to make the final
> system production-grade, resilient, and truly autonomous.

---

## 📌 Summary of Gaps in the Original Plan

| Area                  | Original Rating | Issue                                              |
|-----------------------|-----------------|----------------------------------------------------|
| Perception            | ⭐⭐⭐⭐          | Missing inventory, health, armor, food awareness   |
| LLM Output Handling   | ⭐⭐⭐           | No safeguards for malformed JSON / hallucinations   |
| Survival Reflexes     | ⭐⭐             | Everything routed through LLM — too slow for danger |
| Combat                | ⭐⭐             | No combat system at all                             |
| Resource Gathering    | ⭐⭐⭐           | Manual mining logic — no collection plugin          |
| Debugging & Logging   | ⭐               | No logging strategy                                 |
| Observability         | ⭐               | No dashboard or live monitoring                     |
| LLM Context Mgmt      | ⭐⭐             | Will overflow context window quickly                |
| Model Choice          | ⭐⭐⭐           | Qwen 2.5 is decent but not best for function calls  |
| Crafting Knowledge    | ⭐⭐             | No recipe awareness or crafting state machine        |

---

## 🧩 New Sub-Phases to Insert

### Phase 1.5: Inventory & Self-Awareness

> Insert between Phase 1 (Senses) and Phase 2 (Intellect).

The bot must know **what it has**, not just what it sees.

**Tasks:**

- Read and format the bot's full inventory (item name, count, durability)
- Track health, food level, oxygen, and armor status
- Detect nearby interactive blocks (crafting table, furnace, chest, anvil)
- Track the currently equipped item (mainhand + offhand)
- Format all of this into a structured `selfState` JSON object:

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

**Milestone:** Bot can report: *"I have 12 oak logs, 18 health, and I'm holding a wooden sword. There's a zombie 8 blocks away."*

---

### Phase 3.5: Web Dashboard (Observability)

> Insert between Phase 3 (Muscles) and Phase 4 (Agentic Loop).

**Why:** Staring at terminal logs is painful. A live dashboard saves hours of debugging.

**Tasks:**

- Set up a minimal Express.js + WebSocket server
- Stream live data from the bot:
  - Current position (render on a 2D minimap)
  - Current goal / active action
  - Inventory contents
  - Full LLM conversation history (prompt → response)
  - Success/failure log
- Build a simple HTML/CSS/JS frontend (no framework needed)

**Tech:**

```bash
npm install express ws
```

**Milestone:** Open `localhost:3000` in a browser → see the bot's position, inventory, current thought process, and action log updating in real time.

---

## 🛡️ Architectural Recommendations

### 1. Hard-Coded Survival Reflexes (State Machine Layer)

**Problem:** Routing *everything* through the LLM takes 2–10 seconds. If a Creeper is about to explode, the bot dies while "thinking."

**Solution:** Add a priority-based reflex system that bypasses the LLM entirely:

```
Priority 1 (CRITICAL — no LLM):
  - Health < 4        → Sprint away from nearest hostile
  - On fire            → Jump into water or place water bucket
  - Falling            → Stop all movement
  - Creeper nearby     → Sprint away immediately

Priority 2 (URGENT — fast LLM call):
  - Health < 10        → Eat food if available
  - Night + no shelter → Dig 1x1x3 hole and block the top
  - Hostile mob nearby → Fight or flee (LLM decides which)

Priority 3 (NORMAL — full LLM reasoning):
  - Gather resources
  - Craft items
  - Build structures
  - Explore
```

**Implementation:** A simple `if/else` priority check that runs **before** the LLM is called each tick.

---

### 2. Strict JSON Output Enforcement

**Problem:** Local LLMs often output malformed JSON, markdown wrappers, or extra commentary.

**Solution — 3 layers of defense:**

```
Layer 1: Use Ollama's `format: "json"` parameter.
Layer 2: Strip markdown fences (```json ... ```) and trailing text via regex.
Layer 3: Wrap JSON.parse() in try/catch → on failure, retry with a "Fix your JSON" prompt (max 2 retries).
```

**Code pattern:**

```js
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

---

### 3. Action Queue System

**Problem:** If the agentic loop fires a new thought while the bot is mid-action (walking, mining), actions will conflict and the bot glitches.

**Solution:** Implement an action queue:

```
Queue: [ walkTo(10, 64), mineBlock("oak_log"), craftItem("planks") ]
                ↑
          Currently executing (locked)
```

- New LLM decisions get **enqueued**, not immediately executed
- Actions run one at a time with success/failure callbacks
- The agentic loop can **interrupt** only for Priority 1 survival reflexes
- On failure, the failed action + error go back to the LLM for re-planning

---

### 4. Smart Context Window Management

**Problem:** Perception data + skill library + conversation history + system prompt will quickly exceed the model's context window (especially with 7B–14B models).

**Solution:**

| Strategy                   | Details                                              |
|----------------------------|------------------------------------------------------|
| **Sliding Window**         | Keep only the last 5–8 LLM exchanges in history      |
| **Summarization**          | Every 10 turns, ask the LLM to summarize the conversation so far and replace history with summary |
| **Selective Skill Injection** | Don't dump all skills — use keyword matching to inject only 2–3 relevant skills per prompt |
| **Tiered Perception**      | Send full scan data every 5th tick; send only "changes since last scan" on other ticks |

---

### 5. Crafting State Machine

**Problem:** Crafting in Minecraft is a multi-step dependency chain. Asking the LLM to figure out each step from scratch every time is slow and error-prone.

**Solution:** Build a crafting dependency resolver:

```
Goal: craft "wooden_pickaxe"
  └─ Needs: 3x planks + 2x stick
       └─ Needs: 1x oak_log → 4x planks
       └─ Needs: 2x planks → 4x sticks
  └─ Needs: crafting_table nearby
       └─ If none: craft crafting_table (4x planks) → place it
```

**Implementation:**

- Store Minecraft recipes in a local `recipes.json`
- Build a recursive dependency resolver
- The LLM decides **what** to craft; the state machine handles **how**

---

## 🔌 Essential Plugins to Add

| Plugin                      | Install Command                          | Purpose                                      |
|-----------------------------|------------------------------------------|----------------------------------------------|
| `mineflayer-pathfinder`     | `npm install mineflayer-pathfinder`      | Navigation (already in plan)                 |
| `mineflayer-collectblock`   | `npm install mineflayer-collectblock`    | Walk to + mine + collect in one function     |
| `mineflayer-pvp`            | `npm install mineflayer-pvp`             | Combat against mobs and players              |
| `mineflayer-armor-manager`  | `npm install mineflayer-armor-manager`   | Auto-equip best armor                        |
| `mineflayer-auto-eat`       | `npm install mineflayer-auto-eat`        | Auto-eat when hungry (survival reflex)       |
| `mineflayer-tool`           | `npm install mineflayer-tool`            | Auto-select best tool for the block          |
| `prismarine-viewer`         | `npm install prismarine-viewer`          | 3D browser-based view of bot's perspective   |

---

## 📝 Logging & Debugging System

### Use `winston` for Structured Logging

```bash
npm install winston
```

**Log every cycle of the agentic loop:**

```
[2026-03-30 22:30:01] [PERCEPTION] Position: 10, 64, -22 | Health: 18 | Food: 14
[2026-03-30 22:30:01] [PROMPT]     "You are at X:10... What should you do next?"
[2026-03-30 22:30:04] [LLM]        { "action": "mineBlock", "target": "oak_log" }
[2026-03-30 22:30:04] [EXECUTE]    mineBlock("oak_log") → STARTED
[2026-03-30 22:30:07] [RESULT]     mineBlock("oak_log") → SUCCESS (collected 1)
[2026-03-30 22:30:07] [CRITIC]     Action succeeded. No correction needed.
```

**Also log to a file** (`logs/agent.log`) for post-session analysis.

---

## 🧠 LLM Model Recommendations

| Model              | Size  | Function Calling | Speed    | Recommendation     |
|---------------------|-------|-------------------|----------|--------------------|
| Qwen 2.5 (7B)      | 7B    | ⭐⭐⭐             | Fast     | Good starting point |
| Qwen 2.5 (14B)     | 14B   | ⭐⭐⭐⭐            | Medium   | Better reasoning    |
| Qwen 3 (8B)        | 8B    | ⭐⭐⭐⭐⭐           | Fast     | Best for this use case if available |
| DeepSeek-V2 (16B)  | 16B   | ⭐⭐⭐⭐            | Slower   | Excellent reasoning |
| Llama 3.1 (8B)     | 8B    | ⭐⭐⭐⭐            | Fast     | Strong alternative  |

**Recommendation:** Start with **Qwen 2.5 7B** for development speed, then upgrade to **Qwen 3 8B** or **14B** for production runs.

---

## 🏗️ Recommended Final Project Structure

```
minecraft-ai-agent/
├── src/
│   ├── index.js                 # Entry point — bot connection + main loop
│   ├── perception/
│   │   ├── scanner.js           # Block, entity, environment scanning
│   │   ├── inventory.js         # Inventory & self-state tracking
│   │   └── events.js            # Instinct triggers (damage, hunger, mobs)
│   ├── intellect/
│   │   ├── llm.js               # Ollama API wrapper + JSON enforcement
│   │   ├── promptBuilder.js     # Builds context-aware prompts
│   │   └── contextManager.js    # Sliding window + summarization
│   ├── actions/
│   │   ├── executor.js          # Parses LLM JSON → triggers Mineflayer
│   │   ├── actionQueue.js       # Queue system for sequential actions
│   │   ├── tools.js             # walkTo, mineBlock, craftItem, etc.
│   │   └── combat.js            # PvE combat behaviors
│   ├── survival/
│   │   ├── reflexes.js          # Hard-coded Priority 1 & 2 reactions
│   │   └── crafting.js          # Recipe resolver + crafting state machine
│   ├── memory/
│   │   ├── skills.json          # Skill library (learned sequences)
│   │   └── skillManager.js      # Save, load, match skills
│   ├── goals/
│   │   └── goalEngine.js        # High-level autonomous goal planning
│   ├── dashboard/
│   │   ├── server.js            # Express + WebSocket server
│   │   └── public/
│   │       ├── index.html       # Dashboard UI
│   │       ├── style.css
│   │       └── app.js           # WebSocket client + rendering
│   └── utils/
│       ├── logger.js            # Winston logging setup
│       └── config.js            # Environment variables + constants
├── prompts/
│   ├── system_prompt.md         # Core persona prompt
│   ├── action_schema.json       # JSON schema for LLM function calls
│   └── goal_templates.md        # Goal engine prompt templates
├── data/
│   ├── recipes.json             # Minecraft crafting recipes
│   └── skills.json              # Learned skill sequences
├── logs/
│   └── agent.log                # Runtime logs
├── .env                         # API ports, model name, server IP
├── package.json
└── README.md
```

---

## 🎯 Revised Milestone Targets (5-Star System)

| Phase | Milestone | 5-Star Enhancement |
|-------|-----------|-------------------|
| 1     | Bot logs in, perceives surroundings | + Full inventory/health/food awareness |
| 1.5   | *(NEW)* Bot reports complete self-state | Structured JSON self-state object |
| 2     | Bot answers "What do you see?" | + Handles malformed LLM output gracefully |
| 3     | Bot walks to player on command | + Uses action queue, auto-selects tools |
| 3.5   | *(NEW)* Live web dashboard running | Real-time position, inventory, LLM log |
| 4     | Bot self-corrects failed actions | + Hard-coded survival reflexes bypass LLM |
| 5     | Bot remembers learned skills | + Smart context injection, not full dump |
| 6     | Bot plays autonomously | + Crafting state machine, combat, auto-eat |

---

## ✅ Final Checklist: What Makes It 5 Stars

- [ ] Inventory & self-awareness scanning (Phase 1.5)
- [ ] Strict JSON output enforcement (3-layer defense)
- [ ] Hard-coded survival reflexes (state machine)
- [ ] Action queue system (no conflicting actions)
- [ ] Combat system via `mineflayer-pvp`
- [ ] Auto-eat via `mineflayer-auto-eat`
- [ ] Auto-equip armor via `mineflayer-armor-manager`
- [ ] Best tool selection via `mineflayer-tool`
- [ ] Resource collection via `mineflayer-collectblock`
- [ ] Crafting state machine with recipe resolver
- [ ] Smart context window management
- [ ] Structured logging with `winston`
- [ ] Live web dashboard (Express + WebSocket)
- [ ] Modular project structure (perception/intellect/actions/memory/goals)
- [ ] Upgraded LLM model (Qwen 3 or 14B variant)
- [ ] `.env` based configuration
- [ ] Comprehensive error handling at every layer

---

> **With all of these implemented, this system goes from a cool demo to a genuinely
> impressive autonomous agent that can survive, learn, and play Minecraft indefinitely.** 🏆
