# YouNote Studio - High-Performance Interactive Video Explainer

An interactive, high-performance web application built to transform video consumption into a structured learning experience. Dynamically extract transcripts, synchronize video playheads, and generate contextual conceptual study material using low-latency local LLM reasoning directly on your hardware.

---

## Core Features

- **Cinematic Glassmorphism Interface**: Engineered a responsive, dark-theme console using custom Backdrop Filter properties, semantic styling tokens, and variable typography scales.
- **Bi-Directional Playhead Synchronization**: Integrated YouTube IFrame API callbacks to bind live video timestamps with active transcript components, supporting click-to-seek navigation and scroll-auto-centering.
- **Dual Local AI Pipeline**: Contextually toggles between a structured Markdown Document generator (Concept Mapping) and an interactive conversational agent (Dynamic Video Q&A) backed by localized LLM nodes.
- **Context-Aware Chrome Extension**: Implements secure parameter-passing techniques to capture active browser URLs and deep-link into the local workbench context with automatic runtime trigger mechanisms.

---

## Getting Started

### Prerequisites
1. **Python 3.8+**
2. **Node.js (LTS recommended) & npm**
3. **Ollama** (Ensure local service is active). Pre-pull the high-speed target model:
   ```bash
   ollama run qwen2.5-coder:1.5b
   ```

---

## Primary Deployment: Automated Orchestrator (Highly Recommended)

The repository includes a dedicated full-stack orchestrator to manage dependency verification, state cleanup, and service spawning.

1. Open your terminal in the root workspace.
2. Execute the deployment controller:
   ```bash
   python run_studio.py
   ```
*This utility automatically validates node modules, clears existing port listeners, instantiates Python API and Vite HTTP servers concurrently, and opens the active workspace in your default browser.*

---

## Alternative Deployment: Manual Assembly

### Part A: Instantiate API Server (Python Flask)

The API broker handles raw transcript parsing pipelines and routes prompting workloads to local engine ports.

1. Enter backend subdirectory:
   ```bash
   cd backend
   ```
2. Install modular libraries:
   ```bash
   python -m pip install flask flask-cors youtube-transcript-api requests python-dotenv
   ```
3. Boot server:
   ```bash
   python main.py
   ```
*Listening interface active on: `http://127.0.0.1:5000`*

### Part B: Instantiate Client Interface (React Vite)

1. Enter frontend subdirectory:
   ```bash
   cd frontend
   ```
2. Perform package hydration:
   ```bash
   npm install
   ```
3. Launch Client:
   ```bash
   npm run dev
   ```
*Local web interface bound to: `http://localhost:3000`*

### Part C: Side-load Browser Toolbar Extension

1. Open Chrome Browser and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (top-right toggle control).
3. Select the **"Load unpacked"** option.
4. Choose the target folder: `frontend/extension` from your local disk.
5. The application launcher component is now available in your toolbar.

---

## Architecture Mapping

```text
Root/
├── run_studio.py       # Core Multi-process Deployment Controller
├── README.md           # Systems Operations Documentation
│
├── backend/
│   └── main.py         # Flask Web Gateway & Adaptive LLM Proxy router
│
└── frontend/
    ├── vite.config.js  # Proxied Client Runtime (Port 3000)
    ├── src/App.jsx     # Primary Interactive React State Machine
    └── extension/      # Parametric Deep-linking Chrome Manifest
```

Enjoy low-latency AI-assisted learning!
