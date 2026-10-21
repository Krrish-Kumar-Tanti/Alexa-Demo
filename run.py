#!/usr/bin/env python3
"""
Cross-Platform Runner for Alexa+ Family Captain
Runs on Windows, macOS, and Linux without needing bash or nohup.

Usage:
    python run.py
    (or: python3 run.py)
"""
import os
import sys
import subprocess
import time
import webbrowser

ROOT = os.path.dirname(os.path.abspath(__file__))
MCP_DIR = os.path.join(ROOT, "mcp-server")

def check_and_install():
    print("Checking dependencies...")
    try:
        import fastapi
        import uvicorn
        import pydantic
        print(" Dependencies already installed.")
    except ImportError:
        print("Installing required dependencies (fastapi, uvicorn, pydantic)...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", os.path.join(ROOT, "requirements.txt")])

def main():
    check_and_install()
    print("\nStarting servers...")

    # 1. Start MCP Server (:8001)
    mcp_script = os.path.join(MCP_DIR, "server.py")
    print("-> Starting MCP server on http://127.0.0.1:8001 ...")
    mcp_proc = subprocess.Popen([sys.executable, mcp_script], cwd=MCP_DIR)

    time.sleep(1.5)

    # 2. Start API + UI (:8000)
    print("-> Starting Alexa+ Web UI on http://127.0.0.1:8000 ...")
    api_cmd = [sys.executable, "-m", "uvicorn", "api.main:app", "--port", "8000", "--host", "0.0.0.0"]
    api_proc = subprocess.Popen(api_cmd, cwd=ROOT)

    time.sleep(2)
    print("\n" + "=" * 50)
    print(" ALEXA+ FAMILY CAPTAIN IS LIVE!")
    print(" OPEN IN BROWSER: http://127.0.0.1:8000")
    print(" MCP PROTOCOL:   http://127.0.0.1:8001/mcp")
    print(" Press Ctrl+C anytime to stop both servers.")
    print("=" * 50 + "\n")

    try:
        webbrowser.open("http://127.0.0.1:8000")
    except Exception:
        pass

    try:
        api_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        mcp_proc.terminate()
        api_proc.terminate()
        mcp_proc.wait()
        api_proc.wait()
        print("Servers stopped cleanly.")

if __name__ == "__main__":
    main()
