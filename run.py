"""
Single Unified Launcher for AI Vehicle Selection System
Runs both Frontend & Backend together on http://localhost:8000
"""
import os
import sys
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
VENV_PYTHON = os.path.join(BACKEND_DIR, "venv", "Scripts", "python.exe")

if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable


import socket

def free_port(port: int = 8000):
    """Automatically release port if an old server process is holding it."""
    try:
        if sys.platform == "win32":
            output = subprocess.check_output(f"netstat -ano | findstr :{port}", shell=True).decode()
            pids = set()
            for line in output.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in parts:
                    pids.add(parts[-1])
            for pid in pids:
                if pid != "0" and pid != str(os.getpid()):
                    subprocess.run(f"taskkill /F /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass


def get_free_port(preferred_port: int = 8000) -> int:
    """Find an available port starting from preferred_port."""
    free_port(preferred_port)
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.bind(("127.0.0.1", preferred_port))
        sock.close()
        return preferred_port
    except OSError:
        pass

    for p in range(8001, 8100):
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        try:
            s.bind(("127.0.0.1", p))
            s.close()
            return p
        except OSError:
            continue
    return preferred_port


def main():
    print("=" * 65)
    print(" AI-Based Intelligent Vehicle Selection System")
    print(" Single Unified Application Launcher")
    print("=" * 65)

    port = get_free_port(8000)

    # Step 1: Build frontend if dist doesn't exist or build is requested
    dist_dir = os.path.join(FRONTEND_DIR, "dist")
    print("\n[1/2] Checking Frontend Build...")
    if not os.path.exists(dist_dir):
        print(" -> Building React frontend for single-server deployment...")
        subprocess.run(["npm", "run", "build"], cwd=FRONTEND_DIR, shell=True, check=True)
    else:
        print(" -> Frontend build found at frontend/dist.")

    # Step 2: Start uvicorn server serving backend APIs + static frontend
    print(f"\n[2/2] Starting Unified Server on http://localhost:{port} ...")
    print(f" -> App UI & AI Engine available at: http://localhost:{port}")
    print(" -> Press CTRL+C to stop the server.\n")

    sys.path.insert(0, BACKEND_DIR)
    subprocess.run(
        [VENV_PYTHON, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", str(port)],
        cwd=BACKEND_DIR,
    )


if __name__ == "__main__":
    main()
