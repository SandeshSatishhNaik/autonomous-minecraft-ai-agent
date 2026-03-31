# 🤖 Autonomous Minecraft AI Agent

<div align="center">

![Minecraft AI Agent](https://img.shields.io/badge/Minecraft-1.20.4-brightgreen?style=for-the-badge&logo=minecraft)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=node.js)
![Ollama](https://img.shields.io/badge/Ollama-LLM-red?style=for-the-badge&logo=brain)
![Mineflayer](https://img.shields.io/badge/Mineflayer-4.x-orange?style=for-the-badge)

*A self-aware, autonomous Minecraft bot powered by a local LLM that plays without human input*

</div>

---

## 🌟 Features

| Feature | Description |
|---------|-------------|
| **🧠 LLM Brain** | Powered by Ollama (phi3:mini) for decision making |
| **👀 Computer Vision** | Scans environment, detects entities, monitors health |
| **🏃 Autonomous Movement** | Pathfinding with mineflayer-pathfinder |
| **🛡️ Survival Instincts** | Auto-flee from enemies, auto-eat when hungry |
| **💬 Natural Chat** | Responds to players in real-time |
| **♻️ Auto-Reconnect** | Stays connected with aggressive keepalive |
- **☠️ Death Recovery** | Automatic respawn and recovery |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **Ollama** with `phi3:latest` model
- **Minecraft Server** (PaperMC 1.20.4 recommended)
- **8GB+ RAM**

### Installation

```bash
# Clone or download the project
cd minecraft-ai-agent

# Install dependencies
npm install

# Configure environment
# Edit .env file with your server settings

# Start the bot
node src/index.js
```

### Configuration (.env)

```env
MC_HOST=localhost
MC_PORT=25565
MC_USERNAME=AI_Agent
OLLAMA_HOST=http://localhost:11434
LLM_MODEL_FAST=phi3:latest
```

---

## 🏗️ Architecture

```
minecraft-ai-agent/
├── src/
│   ├── index.js              # Main entry point
│   ├── perception/           # 👀 Senses
│   │   ├── scanner.js        # Environment scanning
│   │   ├── events.js         # Event handling & reflexes
│   │   └── inventory.js      # Self-awareness
│   ├── intellect/            # 🧠 Brain
│   │   ├── ollama.js         # LLM API wrapper
│   │   ├── brain.js          # Decision making
│   │   ├── systemPrompt.js   # AI persona
│   │   └── promptFormatter.js
│   └── muscles/              # 💪 Actions
│       ├── tools.js          # Basic actions
│       ├── executor.js       # Action execution
│       ├── queue.js          # Action queue
│       └── survival.js       # Survival behaviors
├── .env                      # Configuration
└── package.json
```

---

## 🎮 Bot Behavior

### Decision Loop
```
1. Perceive environment (position, health, enemies)
2. Think with LLM (analyze situation)
3. Decide action (attack, flee, explore, mine, eat)
4. Execute via muscles
5. Repeat every 10 seconds
```

### Survival Priorities
1. **Critical** (Priority 1-2): Attack enemies, eat food
2. **Normal** (Priority 3-4): Mine resources, explore
3. **Idle** (Priority 5): Wait, observe

---

## 📊 System Status

| Component | Status |
|-----------|--------|
| Connection | ✅ Auto-reconnect enabled |
| Keepalive | ✅ Sends chat every 1s |
| Pathfinding | ✅ mineflayer-pathfinder |
| LLM Integration | ✅ Ollama API |
| Death Recovery | ✅ Auto-respawn |

---

## 🎛️ Commands

| Command | Description |
|---------|-------------|
| `node src/index.js` | Start the bot |
| `Ctrl+C` | Stop gracefully |
| `!brain` | Force brain thinking |

---

## 🛠️ Technologies

- **Mineflayer** - Minecraft bot framework
- **Mineflayer Pathfinder** - Navigation
- **Ollama** - Local LLM (phi3:mini)
- **Axios** - HTTP client for Ollama
- **Dotenv** - Configuration management

---

## 📝 License

MIT License - Feel free to use and modify!

---

## 🤝 Credits

Built with ❤️ using Mineflayer and Ollama

<div align="center">

*The bot that never gives up - it reconnects, respawns, and keeps exploring*

</div>
