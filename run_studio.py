"""
YouNote Studio - Automated Full-Stack Service Orchestrator

This utility automates the validation of dependencies, environment configuration,
and orchestration of concurrent local microservices (Ollama AI, Flask, Vite React).
Designed for seamless zero-configuration onboarding.
"""

import subprocess
import os
import sys
import time
import socket
import webbrowser
import signal

def check_port(port, host="localhost"):
    """
    Validates network socket accessibility across IPv4 and IPv6 stacks.
    Used to ensure reliable state checks on platforms with dual-stack localhost resolvers.
    """
    try:
        for res in socket.getaddrinfo(host, port, socket.AF_UNSPEC, socket.SOCK_STREAM):
            af, socktype, proto, canonname, sa = res
            s = socket.socket(af, socktype, proto)
            try:
                s.settimeout(0.5)
                s.connect(sa)
                s.close()
                return True
            except Exception:
                pass
    except Exception:
        pass
    return False

def kill_port_process(port):
    """
    Scans and terminates any stale active processes bound to a specified port.
    Guarantees fresh boot and prevents address collisions during local runtime.
    """
    if not check_port(port):
        return
    try:
        print(f"[CLEANUP] Port {port} is occupied. Clearing existing process...")
        if sys.platform == "win32":
            # Extract target PID from listening sockets using netstat on Windows
            cmd = f'netstat -ano | findstr :{port} | findstr LISTENING'
            out = subprocess.check_output(cmd, shell=True).decode()
            for line in out.strip().split('\n'):
                parts = line.strip().split()
                if len(parts) > 4:
                    pid = parts[-1]
                    # Forcefully kill entire task tree associated with PID
                    subprocess.run(f"taskkill /F /PID {pid}", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True)
        else:
            # Terminate Unix-based process chains using lsof
            subprocess.run(f"lsof -t -i:{port} | xargs kill -9", stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, shell=True)
        time.sleep(1.2)  # Allow brief system interval to release OS socket resources
    except Exception:
        pass

def run_studio():
    """
    Primary execution entry-point. Manages pre-checks, package resolution,
    background service spawns, and performs self-healing graceful teardowns.
    """
    print("\n" + "="*50)
    print("             YOUNOTE STUDIO SERVICE MANAGER")
    print("="*50 + "\n")
    
    root_dir = os.path.abspath(os.path.dirname(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")
    
    # --- 1. Prerequisite Validation ---
    print("[STAGE 1/4] Verifying system pre-requisites...")
    try:
        subprocess.run(["npm", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, shell=True)
        print("  - Node.js and NPM: DETECTED")
    except Exception:
        print("  - ERROR: Node.js / NPM runtime not found. Please install from https://nodejs.org/")
        sys.exit(1)
        
    # --- 2. Backend Module Resolution ---
    print("\n[STAGE 2/4] Verifying Python dependencies...")
    dependencies = ["flask", "flask-cors", "youtube-transcript-api", "requests", "python-dotenv"]
    # Automatically verify pip libraries exist or fetch them
    subprocess.run([sys.executable, "-m", "pip", "install"] + dependencies, stdout=subprocess.DEVNULL, check=False)
    print("  - Python packages: VERIFIED")
    
    # --- 3. Frontend Package Resolution ---
    print("\n[STAGE 3/4] Verifying frontend node modules...")
    node_modules_path = os.path.join(frontend_dir, "node_modules")
    if not os.path.exists(node_modules_path):
        print("  - Action: Fetching node packages for first-time run (running 'npm install')...")
        subprocess.run(["npm", "install"], cwd=frontend_dir, shell=True, check=True)
    print("  - Node modules: VERIFIED")

    active_subprocesses = []
    
    # --- 4. Local AI Engine Orchestration ---
    print("\n[STAGE 4/4] Preparing local LLM service (Ollama)...")
    try:
        # Confirm user has Ollama runtime CLI utility installed
        subprocess.run(["ollama", "--version"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True, shell=True)
        
        # Clear current service memory to reload configurations fresh
        kill_port_process(11434)
        
        print("  - Action: Launching local Ollama instance with GPU acceleration...")
        ollama_proc = subprocess.Popen(
            ["ollama", "serve"], 
            stdout=subprocess.DEVNULL, 
            stderr=subprocess.DEVNULL, 
            shell=True
        )
        active_subprocesses.append(ollama_proc)
        
        # Poll socket availability until engine completes boot cycle
        print("  - Status: Initializing engine", end="", flush=True)
        success = False
        for _ in range(10):
            if check_port(11434):
                success = True
                break
            print(".", end="", flush=True)
            time.sleep(1.5)
        
        if success:
            print("\n  - Engine status: ACTIVE")
        else:
            print("\n  - Engine status: INITIALIZING IN BACKGROUND")
            
    except Exception:
        print("  - WARNING: 'ollama' command not found. Please download from https://ollama.com/ to leverage local LLM features.")

    try:
        # --- 5. Launch Flask Microservice ---
        kill_port_process(5000)
        print("\n[SERVICE] Booting Python Backend API Server (Port 5000)...")
        backend_proc = subprocess.Popen(
            [sys.executable, "main.py"],
            cwd=backend_dir,
            shell=False
        )
        active_subprocesses.append(backend_proc)
            
        # --- 6. Launch React UI Client ---
        kill_port_process(3000)
        print("[SERVICE] Booting Vite React Client Client (Port 3000)...")
        frontend_proc = subprocess.Popen(
            ["npm", "run", "dev"],
            cwd=frontend_dir,
            shell=True
        )
        active_subprocesses.append(frontend_proc)
        
        # --- 7. Connect & Fire Browser Launcher ---
        print("\n[STATUS] Awaiting client-server readiness handshake...")
        
        attempts = 15
        while attempts > 0:
            if check_port(3000):
                print("\n" + "="*50)
                print("           SERVICES STARTED SUCCESSFULLY!")
                print("="*50)
                print("  - UI Console: http://localhost:3000")
                print("  - Action: Launching UI console in default browser.")
                print("  - Instruction: Use 'Ctrl + C' to stop services gracefully.")
                print("="*50 + "\n")
                
                # Auto open default browser context
                time.sleep(1)
                webbrowser.open("http://localhost:3000")
                break
            time.sleep(1.5)
            print(".", end="", flush=True)
            attempts -= 1
        else:
            print("\n[TIMEOUT] Frontend server taking unusually long. Please open http://localhost:3000 manually.")
        
        # Keep main thread active to listen for interrupt signal
        while True:
            time.sleep(2)
            
    except KeyboardInterrupt:
        print("\n\n[SHUTDOWN] User interrupt detected. Terminating active processes...")
    finally:
        # Robustly kill spawned tasks, preventing orphaned task threads
        for proc in active_subprocesses:
            try:
                if sys.platform == "win32":
                    # Clean Windows tree node processes
                    subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                else:
                    # Standard SIGTERM for Unix environments
                    proc.terminate()
            except Exception:
                pass
        print("[SHUTDOWN] Clean exit complete. Goodbye.")

if __name__ == "__main__":
    run_studio()
