"""
Family Captain API bridge - serves simulated Alexa+ web UI + /api/chat.
Run: uvicorn main:app --port 8000  (from api/ folder)
"""
import os
import sys
from typing import Any, Dict, List
from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

_HERE = os.path.dirname(os.path.abspath(__file__))
_ROOT = os.path.dirname(_HERE)
if os.path.join(_ROOT, "agent") not in sys.path:
    sys.path.insert(0, os.path.join(_ROOT, "agent"))
if os.path.join(_ROOT, "mcp-server") not in sys.path:
    sys.path.insert(0, os.path.join(_ROOT, "mcp-server"))

from agent import run_agent  # type: ignore

app = FastAPI(title="Family Captain API")
APP_DIR = os.path.join(_ROOT, "app")


class ChatIn(BaseModel):
    message: str
    history: List[Dict[str, str]] = []
    profile: Dict[str, Any] = {"name": "Family", "kids_mode": True}


@app.get("/api/health")
def health():
    return {"ok": True, "service": "family-captain-api"}


@app.post("/api/chat")
def chat(body: ChatIn):
    out = run_agent(body.message, history=body.history, profile=body.profile)
    return out


@app.get("/")
def index():
    return FileResponse(os.path.join(APP_DIR, "index.html"))


# serve app.js / styles.css
app.mount("/app", StaticFiles(directory=APP_DIR), name="app")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
