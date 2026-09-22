"""
Delegating run.py script inside frontend directory
"""
import os
import sys
import subprocess

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT_RUN_PY = os.path.join(PROJECT_ROOT, "run.py")
VENV_PYTHON = os.path.join(PROJECT_ROOT, "backend", "venv", "Scripts", "python.exe")

if not os.path.exists(VENV_PYTHON):
    VENV_PYTHON = sys.executable

subprocess.run([VENV_PYTHON, ROOT_RUN_PY], cwd=PROJECT_ROOT)
