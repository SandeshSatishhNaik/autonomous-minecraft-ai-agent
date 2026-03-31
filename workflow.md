# 🔄 Project Workflow: Autonomous Minecraft AI Agent

> This document shows the complete workflow of the project — how all phases connect,
> how data flows through the system, and the build order.

---

## 📋 Build Order Workflow

```mermaid
flowchart TD
    START([🚀 Project Start]) --> SETUP[⚙️ Environment Setup]
    
    SETUP --> S1[Install Node.js v18+]
    SETUP --> S2[Install JDK v17+]
    SETUP --> S3[Install Ollama]
    SETUP --> S4[Pull qwen2.5-coder:7b]
    
    S1 & S2 & S3 & S4 --> MC[🎮 Start Minecraft Server]
    MC --> P1

    subgraph PHASE1 [Phase 1: The Senses]
        P1[Connect bot via Mineflayer] --> P1a[scanner.js — Blocks, entities, time]
        P1a --> P1b[events.js — Damage, hunger, mobs]
    end

    subgraph PHASE15 [Phase 1.5: Self-Awareness]
        P15a[inventory.js — Items, durability] --> P15b[Self-state JSON object]
        P15b --> P15c[Health, food, armor, equipped]
    end

    PHASE1 --> PHASE15

    subgraph PHASE2 [Phase 2: The Intellect]
        P2a[llm.js — Ollama API wrapper] --> P2b[promptBuilder.js — Context-aware prompts]
        P2b --> P2c[JSON enforcement — 3-layer defense]
        P2c --> P2d[Bot replies in Minecraft chat]
    end

    PHASE15 --> PHASE2

    subgraph PHASE3 [Phase 3: The Muscles]
        P3a[tools.js — walkTo, mineBlock, craft] --> P3b[executor.js — Parse JSON → action]
        P3b --> P3c[actionQueue.js — Sequential execution]
    end

    PHASE2 --> PHASE3

    subgraph PHASE35 [Phase 3.5: Web Dashboard]
        P35a[Express + WebSocket server] --> P35b[Live minimap, inventory, LLM log]
    end

    PHASE3 --> PHASE35

    subgraph PHASE4 [Phase 4: Agentic Loop]
        P4a[setInterval thought cycle] --> P4b[reflexes.js — Priority 1 & 2]
        P4b --> P4c[Critic node — try/catch + feedback]
        P4c --> P4d[Error → LLM re-planning]
    end

    PHASE35 --> PHASE4

    subgraph PHASE5 [Phase 5: Skill Library]
        P5a[skillManager.js — Save successful sequences] --> P5b[contextManager.js — Sliding window]
        P5b --> P5c[Selective skill injection into prompts]
    end

    PHASE4 --> PHASE5

    subgraph PHASE55 [Phase 5.5: Spatial Memory]
        P55a[spatialMemory.js — POI database] --> P55b[world_map.json — Named locations]
        P55b --> P55c[Death location tracking + recovery path]
    end

    PHASE5 --> PHASE55

    subgraph PHASE6 [Phase 6: Goal Engine]
        P6a[goalEngine.js — High-level planning] --> P6b[crafting.js — Recipe resolver]
        P6b --> P6c[combat.js — mineflayer-pvp]
        P6c --> P6d[Auto-eat, auto-armor, auto-tool]
    end

    PHASE55 --> PHASE6

    subgraph PHASE65 [Phase 6.5: Survival Infrastructure]
        P65a[building.js — Blueprint placement] --> P65b[sleep.js — Bed + night skip]
        P65b --> P65c[storage.js — Chest management]
        P65c --> P65d[smelting.js — Furnace automation]
        P65d --> P65e[lighting.js — Torch system]
    end

    PHASE6 --> PHASE65

    subgraph PHASE7 [Phase 7: Advanced Survival]
        P7a[farming.js — Crops + animals] --> P7b[deathRecovery.js — Respawn + retrieve]
        P7b --> P7c[weather.js — Storm shelter]
        P7c --> P7d[Advanced combat — Shield + bow]
    end

    PHASE65 --> PHASE7

    subgraph PHASE75 [Phase 7.5: Personality & Analytics]
        P75a[personality.js — Emotion + character] --> P75b[analytics.js — Performance stats]
        P75b --> P75c[Multiplayer interaction — Optional]
    end

    PHASE7 --> PHASE75
    PHASE75 --> COMPLETE([🏆 Fully Autonomous Agent])
```

---

## 🧠 Runtime Architecture (Data Flow)

```mermaid
flowchart LR
    subgraph WORLD [Minecraft World]
        MC[🎮 Minecraft Server]
    end

    subgraph PERCEPTION [Perception Layer]
        SCAN[scanner.js]
        INV[inventory.js]
        EVT[events.js]
        WTH[weather.js]
    end

    subgraph REFLEXES [Reflex Layer]
        R1{Health < 4?}
        R2{On fire?}
        R3{Creeper?}
        SAFE[Safe — proceed to LLM]
    end

    subgraph BRAIN [LLM Brain]
        PB[promptBuilder.js]
        CTX[contextManager.js]
        LLM[🧠 qwen2.5-coder:7b]
        JSON[JSON Parser + Validator]
    end

    subgraph ACTIONS [Action Layer]
        Q[actionQueue.js]
        EX[executor.js]
        TOOLS[tools.js]
        COMBAT[combat.js]
        BUILD[building.js]
        FARM[farming.js]
    end

    subgraph SURVIVAL [Survival Systems]
        CRAFT[crafting.js]
        SMELT[smelting.js]
        STORE[storage.js]
        LIGHT[lighting.js]
        SLEEP[sleep.js]
        DEATH[deathRecovery.js]
    end

    subgraph MEMORY [Memory Layer]
        SKILLS[skillManager.js]
        SPATIAL[spatialMemory.js]
        GOALS[goalEngine.js]
    end

    subgraph MONITOR [Monitoring]
        DASH[Web Dashboard]
        LOG[Winston Logger]
        STATS[analytics.js]
    end

    MC <-->|Mineflayer| SCAN
    MC <-->|Mineflayer| INV
    MC -->|Events| EVT
    MC -->|Weather| WTH

    SCAN --> R1
    INV --> R1
    EVT --> R1
    R1 -->|YES| TOOLS
    R1 -->|NO| R2
    R2 -->|YES| TOOLS
    R2 -->|NO| R3
    R3 -->|YES| TOOLS
    R3 -->|NO| SAFE

    SAFE --> PB
    SKILLS -->|Inject relevant skills| PB
    SPATIAL -->|Inject locations| PB
    GOALS -->|Inject current goal| PB
    CTX -->|Manage history| PB
    PB --> LLM
    LLM --> JSON
    JSON --> Q

    Q --> EX
    EX --> TOOLS
    EX --> COMBAT
    EX --> BUILD
    EX --> FARM
    EX --> CRAFT
    EX --> SMELT
    EX --> STORE
    EX --> LIGHT
    EX --> SLEEP

    TOOLS -->|Result| MC
    COMBAT -->|Result| MC
    BUILD -->|Result| MC

    EX -->|Success/Fail| SKILLS
    EX -->|Locations| SPATIAL
    EX -->|Logs| LOG
    EX -->|Stats| STATS

    LOG --> DASH
    STATS --> DASH
    SCAN --> DASH
    INV --> DASH
    LLM --> DASH

    DEATH -->|On death| SPATIAL
    DEATH -->|Respawn| MC
```

---

## 🔄 Agentic Loop (Single Tick)

```mermaid
flowchart TD
    TICK([⏰ Tick Triggered]) --> SENSE[1. Perceive Environment]
    SENSE --> SELF[2. Read Self-State]
    SELF --> REFLEX{3. Survival Reflex Check}
    
    REFLEX -->|P1: CRITICAL| REACT[Execute Reflex — NO LLM]
    REACT --> RESULT
    
    REFLEX -->|P3: NORMAL| PROMPT[4. Build LLM Prompt]
    PROMPT --> INJECT[5. Inject Skills + Goals + Context]
    INJECT --> CALL[6. Call LLM]
    CALL --> PARSE{7. Parse JSON Response}
    
    PARSE -->|Valid| QUEUE[8. Enqueue Action]
    PARSE -->|Invalid| RETRY[Retry — Fix JSON Prompt]
    RETRY --> CALL
    
    QUEUE --> EXEC[9. Execute Action]
    EXEC --> RESULT{10. Success or Failure?}
    
    RESULT -->|Success| SAVE[11. Save to Skill Library]
    RESULT -->|Failure| CRITIC[12. Feed Error to LLM]
    CRITIC --> PROMPT
    
    SAVE --> LOG[13. Log Everything]
    LOG --> DASH[14. Update Dashboard]
    DASH --> WAIT([Wait for Next Tick])
```

---

## 🏗️ Module Dependency Map

```mermaid
graph BT
    subgraph LAYER1 [Layer 1: Foundation]
        CONFIG[config.js]
        LOGGER[logger.js]
        ENV[.env]
    end

    subgraph LAYER2 [Layer 2: Perception]
        SCANNER[scanner.js]
        INVENTORY[inventory.js]
        EVENTS[events.js]
        WEATHER[weather.js]
    end

    subgraph LAYER3 [Layer 3: Intelligence]
        LLM[llm.js]
        PROMPT[promptBuilder.js]
        CONTEXT[contextManager.js]
        PERSON[personality.js]
    end

    subgraph LAYER4 [Layer 4: Actions]
        EXEC[executor.js]
        QUEUE[actionQueue.js]
        TOOLS[tools.js]
        COMBAT[combat.js]
        BUILD[building.js]
        FARM[farming.js]
    end

    subgraph LAYER5 [Layer 5: Survival]
        REFLEX[reflexes.js]
        CRAFT[crafting.js]
        SMELT[smelting.js]
        STORE[storage.js]
        LIGHT[lighting.js]
        SLEEP[sleep.js]
        DEATH[deathRecovery.js]
    end

    subgraph LAYER6 [Layer 6: Memory]
        SKILLS[skillManager.js]
        SPATIAL[spatialMemory.js]
    end

    subgraph LAYER7 [Layer 7: Autonomy]
        GOALS[goalEngine.js]
    end

    subgraph LAYER8 [Layer 8: Monitoring]
        DASH[dashboard/server.js]
        ANALYTICS[analytics.js]
    end

    ENV --> CONFIG
    CONFIG --> LOGGER

    LOGGER --> SCANNER
    LOGGER --> INVENTORY
    LOGGER --> EVENTS
    LOGGER --> WEATHER

    SCANNER --> LLM
    INVENTORY --> LLM
    SCANNER --> PROMPT
    INVENTORY --> PROMPT
    LLM --> CONTEXT

    PROMPT --> EXEC
    EXEC --> QUEUE
    QUEUE --> TOOLS
    QUEUE --> COMBAT
    QUEUE --> BUILD
    QUEUE --> FARM

    EVENTS --> REFLEX
    REFLEX --> TOOLS
    TOOLS --> CRAFT
    TOOLS --> SMELT
    TOOLS --> STORE
    TOOLS --> LIGHT
    TOOLS --> SLEEP
    DEATH --> SPATIAL

    CRAFT --> SKILLS
    SKILLS --> PROMPT
    SPATIAL --> PROMPT
    GOALS --> PROMPT

    LOGGER --> DASH
    ANALYTICS --> DASH
    EXEC --> ANALYTICS
```

---

## 📊 Phase Timeline (Estimated)

```mermaid
gantt
    title Project Build Timeline
    dateFormat YYYY-MM-DD
    axisFormat %b %d

    section Setup
    Environment Setup           :setup, 2026-03-31, 1d

    section Core (Phases 1-3)
    Phase 1 — Senses            :p1, after setup, 2d
    Phase 1.5 — Self-Awareness  :p15, after p1, 1d
    Phase 2 — LLM Integration   :p2, after p15, 3d
    Phase 3 — Actions           :p3, after p2, 3d

    section Intelligence (Phases 3.5-5.5)
    Phase 3.5 — Dashboard       :p35, after p3, 2d
    Phase 4 — Agentic Loop      :p4, after p35, 3d
    Phase 5 — Skill Library     :p5, after p4, 2d
    Phase 5.5 — Spatial Memory  :p55, after p5, 2d

    section Autonomy (Phases 6-7.5)
    Phase 6 — Goal Engine       :p6, after p55, 3d
    Phase 6.5 — Infrastructure  :p65, after p6, 4d
    Phase 7 — Advanced Survival :p7, after p65, 4d
    Phase 7.5 — Personality     :p75, after p7, 2d

    section Milestone
    🏆 Fully Autonomous Agent   :milestone, after p75, 0d
```

**Estimated Total: ~32 days of focused development**

---

## 🎯 Key Decision Points

```mermaid
flowchart TD
    D1{Bot connected to server?}
    D1 -->|No| FIX1[Check server.properties, port, online-mode]
    D1 -->|Yes| D2{Bot perceives environment?}

    D2 -->|No| FIX2[Debug scanner.js — check Mineflayer events]
    D2 -->|Yes| D3{LLM returns valid JSON?}

    D3 -->|No| FIX3[Check format:json, regex strip, retry logic]
    D3 -->|Yes| D4{Bot executes actions?}

    D4 -->|No| FIX4[Debug executor.js — check action names match]
    D4 -->|Yes| D5{Bot self-corrects?}

    D5 -->|No| FIX5[Debug Critic — check try/catch and error prompts]
    D5 -->|Yes| D6{Bot acts autonomously?}

    D6 -->|No| FIX6[Check setInterval loop + goal engine prompts]
    D6 -->|Yes| SUCCESS([🏆 Success!])

    FIX1 --> D1
    FIX2 --> D2
    FIX3 --> D3
    FIX4 --> D4
    FIX5 --> D5
    FIX6 --> D6
```
