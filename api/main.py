"""
Family Captain API bridge - serves simulated Alexa+ web UI + /api/chat.
Run: uvicorn main:app --port 8000  (from api/ folder)
"""
import base64
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

from agent import run_agent, load_memory  # type: ignore
from server import read_audit  # type: ignore

app = FastAPI(title="Family Captain API")
APP_DIR = os.path.join(_ROOT, "app")


class ChatIn(BaseModel):
    message: str
    history: Any = []
    profile: Dict[str, Any] = {"name": "Family", "kids_mode": True}


@app.get("/api/health")
def health():
    return {"ok": True, "service": "family-captain-api"}


@app.get("/api/memory")
def memory():
    mem = load_memory()
    return {"total_chats": len(mem), "history": mem}


@app.get("/api/audit")
def audit(limit: int = 20):
    return {"entries": read_audit(limit)}


class SpeakIn(BaseModel):
    text: str = ""
    voice: str = ""


@app.post("/api/speak")
def speak(body: SpeakIn):
    """Polly Neural TTS. Returns {audio_b64} or {fallback:true} — UI degrades to browser voice."""
    if os.getenv("USE_POLLY", "0") != "1" or not body.text.strip():
        return {"fallback": True}
    try:
        import boto3  # type: ignore
        client = boto3.client("polly", region_name=os.getenv("AWS_REGION", "us-east-1"))
        resp = client.synthesize_speech(
            Text=body.text.strip()[:3000],
            OutputFormat="mp3",
            VoiceId=body.voice or os.getenv("POLLY_VOICE", "Joanna"),
            Engine="neural",
        )
        return {"audio_b64": base64.b64encode(resp["AudioStream"].read()).decode("ascii")}
    except Exception as e:
        print("[polly fallback] %s" % e)
        return {"fallback": True}


@app.post("/api/chat")
def chat(body: ChatIn):
    h = body.history if isinstance(body.history, list) else []
    p = body.profile if isinstance(body.profile, dict) else {"name": "Family", "kids_mode": True}
    out = run_agent(body.message, history=h, profile=p)
    return out


@app.get("/")
def index():
    return FileResponse(os.path.join(APP_DIR, "index.html"))


# serve app.js / styles.css
app.mount("/app", StaticFiles(directory=APP_DIR), name="app")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
