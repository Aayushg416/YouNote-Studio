# YouNote Studio - High-Performance Interactive Video Explainer

An interactive, high-performance web application built to transform video consumption into a structured learning experience. Dynamically extract transcripts, synchronize video playheads, and generate contextual conceptual study material using low-latency local LLM reasoning directly on your hardware.

---

## 🚀 Core Features

- **Cinematic Glassmorphism Interface**: Engineered a responsive, dark-theme console using custom Backdrop Filter properties, semantic styling tokens, and variable typography scales.
- **Bi-Directional Playhead Synchronization**: Integrated YouTube IFrame API callbacks to bind live video timestamps with active transcript components, supporting click-to-seek navigation and scroll-auto-centering.
- **Dual Local AI Pipeline**: Contextually toggles between a structured Markdown Document generator (Concept Mapping) and an interactive conversational agent (Dynamic Video Q&A) backed by localized LLM nodes.


---

## 🛠️ Dependencies & Prerequisites

To run YouNote Studio locally, you must install the following software:

1. **Python 3.8+**: Required for the backend API and deployment orchestrator.
2. **Node.js (LTS recommended) & npm**: Required for the React frontend.
3. **Ollama**: Required for local LLM inference.
   - Install Ollama from [ollama.com](https://ollama.com/).
   - Ensure the Ollama background service is running.
   - Pre-pull the high-speed target model by running this in your terminal:
     ```bash
     ollama run qwen2.5-coder:1.5b
     ```

### Backend Dependencies (Python)
The backend utilizes Flask and FastAPI components for API routing, along with the YouTube Transcript API. These are defined in `backend/requirements.txt`:
- `fastapi`, `uvicorn`, `flask`, `flask-cors`
- `youtube-transcript-api`
- `requests`, `python-dotenv`, `pydantic`, `pydantic-settings`

### Frontend Dependencies (Node.js)
The frontend is built with React, Vite, and TailwindCSS. Core dependencies include:
- `react`, `react-dom`, `lucide-react`
- `react-markdown`, `remark-math`, `rehype-katex` (for Markdown and LaTeX rendering)

---

## ⚙️ Installation & Deployment

You can deploy YouNote Studio either by using the automated orchestrator (Recommended) or by manually assembling the components.

### Method 1: Automated Orchestrator (Highly Recommended)

The repository includes a dedicated full-stack orchestrator to automatically install dependencies, clear ports, and start both the frontend and backend servers concurrently.

1. Open your terminal in the root workspace (`YouNote Studio`).
2. Run the deployment controller:
   ```bash
   python run_studio.py
   ```
*This utility will automatically validate node modules, install Python requirements if needed, instantiate the Python API and Vite HTTP servers, and open the active workspace in your default browser.*

### Method 2: Manual Assembly

If you prefer to start the backend and frontend separately, follow these steps:

#### Part A: Instantiate API Server (Backend)
1. Enter the `backend` directory:
   ```bash
   cd backend
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the backend server:
   ```bash
   python main.py
   ```
*The API will listen on `http://127.0.0.1:5000`.*

#### Part B: Instantiate Client Interface (Frontend)
1. Enter the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Launch the Vite development server:
   ```bash
   npm run dev
   ```
*The frontend will run on `http://localhost:3000`.*

---

## 🧩 How to Use

1. **Start the Application**: Ensure both the backend and frontend are running (using the automated orchestrator or manual assembly).
2. **Access the Interface**: Open your browser and navigate to the provided local URL (default is `http://localhost:3000`).
3. **Load a Video**: Paste the URL of a YouTube video you want to study into the designated input field.
4. **Learn & Interact**: The application will extract the transcript, synchronize with the video, and you can begin generating study materials or chatting with the AI!

---

## 📂 Architecture Mapping

```text
Root/
├── run_studio.py       # Core Multi-process Deployment Controller
├── README.md           # Systems Operations Documentation
├── logs/               # Application Run Logs
│
├── backend/
│   ├── main.py         # Flask Web Gateway & Adaptive LLM Proxy router
│   ├── requirements.txt# Python Backend Dependencies
│   └── .env            # Environment Configurations
│
└── frontend/
    ├── package.json    # Node.js Dependencies
    ├── tailwind.config.js # UI Framework Configuration
    ├── vite.config.js  # Proxied Client Runtime
    ├── index.html      # Web App Entry Point
    └── src/            # Primary Interactive React Application
```

Enjoy low-latency AI-assisted learning!
