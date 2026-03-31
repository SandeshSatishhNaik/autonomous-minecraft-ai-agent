# ⚙️ Setup Guide: Autonomous Minecraft AI Agent

> **Last Updated:** March 2026
> **Target Machine:** ASUS TUF F15 (i7-13620H, RTX 4060, 16 GB RAM)
> **OS:** Windows 11

---

## 📋 Prerequisites

### Software to Install

| Software | Version | Purpose | Download |
|---|---|---|---|
| **Node.js** | v18.x+ | Runtime for the agent | [nodejs.org](https://nodejs.org) |
| **JDK** | v17+ | Minecraft Server | [adoptium.net](https://adoptium.net) |
| **Ollama** | Latest | Local LLM runner | [ollama.com](https://ollama.com) |
| **T-Launcher** | Latest | Minecraft client | [tlauncher.org](https://tlauncher.org) |
| **Git** | Latest | Version control (optional) | [git-scm.com](https://git-scm.com) |

### Verify Installations

```powershell
node --version        # Should show v18.x or higher
java --version        # Should show v17 or higher
ollama --version      # Should show version info
nvidia-smi            # Should show RTX 4060 with 8 GB VRAM
```

---

## 🧠 Step 1: Pull the AI Model

```bash
# Primary model (fast action decisions — ~4.5 GB download)
ollama pull qwen2.5-coder:7b

# Secondary model (strategic planning — ~8 GB download, optional for now)
ollama pull qwen2.5:14b
```

Verify it's running:

```bash
ollama list              # Should show qwen2.5-coder:7b
ollama run qwen2.5-coder:7b "Say hello in JSON format"
```

---

## 🎮 Step 2: Set Up Local Minecraft Server

1. Create a directory:
   ```powershell
   mkdir D:\minecraft_local_server
   cd D:\minecraft_local_server
   ```

2. Download **PaperMC** server jar:
   - Go to [papermc.io/downloads](https://papermc.io/downloads) → Download `paper-1.20.4.jar`

3. First run (generates config files):
   ```bash
   java -jar paper-1.20.4.jar
   ```

4. Edit `eula.txt`:
   ```
   eula=true
   ```

5. Edit `server.properties`:
   ```properties
   online-mode=false
   spawn-protection=0
   difficulty=normal
   gamemode=survival
   max-players=5
   ```

6. Start the server:
   ```bash
   java -Xmx2G -Xms1G -jar paper-1.20.4.jar nogui
   ```

7. **Test:** Open T-Launcher → Multiplayer → Add Server → `localhost` → Join

---

## 📦 Step 3: Create the Node.js Project

```powershell
mkdir D:\minecraft-ai-agent
cd D:\minecraft-ai-agent
npm init -y
```

### Install All Dependencies

```bash
# Core
npm install mineflayer dotenv ollama

# Plugins
npm install mineflayer-pathfinder mineflayer-collectblock mineflayer-pvp
npm install mineflayer-armor-manager mineflayer-auto-eat mineflayer-tool

# Dashboard & Logging
npm install express ws winston

# Viewer (optional — 3D browser view)
npm install prismarine-viewer
```

### Create Project Structure

```powershell
# Create all directories
mkdir src\perception
mkdir src\intellect
mkdir src\actions
mkdir src\survival
mkdir src\memory
mkdir src\goals
mkdir src\dashboard\public
mkdir src\utils
mkdir prompts
mkdir data
mkdir logs
```

### Create `.env` File

Create `D:\minecraft-ai-agent\.env`:

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

## ✅ Verification Checklist

### System

- [ ] `node --version` → v18+
- [ ] `java --version` → v17+
- [ ] `nvidia-smi` → RTX 4060, 8 GB VRAM
- [ ] Ollama installed and running

### AI Model

- [ ] `ollama list` shows `qwen2.5-coder:7b`
- [ ] Model responds to test prompt with valid JSON
- [ ] VRAM usage ~4.5 GB when model loaded (check with `nvidia-smi`)

### Minecraft Server

- [ ] `minecraft_local_server` running on port 25565
- [ ] `server.properties` has `online-mode=false`
- [ ] `eula.txt` has `eula=true`
- [ ] T-Launcher can join via `localhost`

### Node.js Project

- [ ] `package.json` exists in `minecraft-ai-agent/`
- [ ] All npm packages installed (check `node_modules/`)
- [ ] `.env` file created with correct values
- [ ] Full directory structure created

---

## ➡️ Next Step

Once all checks pass, proceed to **Phase 1: The Senses** — write `src/index.js` to connect the bot to the server.
