# Alexa+ Family Captain — Simulated Alexa+ Experience

> **Amazon Developer Hackathon (Build, Ship, Shape) submission**
> Track: **Alexa+** (simulated-experience path) · Mini challenges: **AWS Builder + Open Source**
> Deadline: **Oct 23, 2026 @ 12:00pm PDT** · Demo video: < 3 min · Repo: https://github.com/Krrish-Kumar-Tanti/Alexa-Demo

One web page that **simulates Alexa+ running the whole family evening in a single agentic flow**.
Say **"movie night with kids"** and it checks the calendar, starts the living-room TV, checks the front door, orders snacks — and can check in on Grandma — showing visual cards + a live MCP tool-call log judges can verify in code and on screen.

## Hero demo (60 seconds)

1. Type or speak: **"movie night with kids"**
2. Watch the tool panel light up: `get_calendar → tv_control → door_status → order_groceries`
3. Cards appear: tonight's picks (kid-safe) · living-room TV status · front-door event · order confirmation
4. Follow-ups: *"who is at the front door?"* → *"check in on grandma"* → *"order popcorn"*

## File structure (repo root — everything visible on GitHub)

```
├── README.md              # You are here (human + judge docs)
├── AGENTS.md              # Instructions for AI coding agents (Antigravity, etc.)
├── SUBMISSION.md          # Devpost checklist: video script, feedback, friction log
├── LICENSE                # MIT (Open Source mini-challenge)
├── requirements.txt       # fastapi, uvicorn, pydantic (+ boto3 optional)
├── run.sh                 # One-command local runner
├── mcp-server/
│   └── server.py          # MCP spec 2025-11-25, Streamable HTTP (POST /mcp JSON-RPC)
│                          # 5 tools: get_calendar, tv_control, door_status,
│                          #          order_groceries, remind_grandma
├── agent/
│   ├── __init__.py
│   └── agent.py           # run_agent() + try_bedrock_reply() (boto3 bedrock-runtime)
├── api/
│   └── main.py            # Thin bridge: POST /api/chat, GET /api/health, serves app/
└── app/
    ├── index.html         # Simulated Alexa+ UI (chat + cards + tool log)
    ├── app.js             # fetch /api/chat, renders cards, Web Speech voice input
    └── styles.css         # Dark TV-style theme, no build step
```

## How it works

```
Browser (simulated Alexa+ UI, voice via Web Speech API)
  │ POST /api/chat {message, history, profile}
  ▼
api/main.py  ──►  agent/agent.py:run_agent()
                        │  ├─ keyword router (mock brain, always works)
                        │  └─ try_bedrock_reply() → boto3 bedrock-runtime (if USE_BEDROCK=1)
                        ▼
                   mcp-server/server.py  (imported directly; also servable standalone)
                     ├─ get_calendar     family events
                     ├─ tv_control       living-room TV (launch/status/kids mode)
                     ├─ door_status      front-door camera (package/motion event)
                     ├─ order_groceries  snack order
                     └─ remind_grandma   elderly check-in message + call scheduling
  ▼
UI renders: chat bubble + visual cards + 🔧 tool-call badges (judge proof)
```

MCP compliance (`mcp-server/server.py`):
- Protocol version `2025-11-25`, Streamable HTTP via `POST /mcp` (JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call`, `ping`) + `GET /mcp` SSE placeholder + `GET /health`.
- Plain FastAPI on purpose — runs on **Python 3.9** (MCP/FastMCP SDKs need 3.10+). Upgrade path: swap to FastMCP SDK later, tool names stay identical.

AWS Builder proof (`agent/agent.py:try_bedrock_reply`):
- Real `boto3.client("bedrock-runtime").invoke_model()` (Claude Sonnet, env-configured region/model).
- Graceful fallback to mock brain so the demo never breaks without AWS keys.
- Write this in Devpost feedback: *"Bedrock Claude polishes replies; Strands-style tool loop in run_agent; deploy path Lambda + API Gateway."*

## Run locally (2 minutes, Python 3.9+)

```bash
pip3 install -r requirements.txt

# Terminal 1 — MCP server (:8001)
python3 mcp-server/server.py
# check: curl http://127.0.0.1:8001/health

# Terminal 2 — API + UI (:8000)
python3 -m uvicorn api.main:app --port 8000 --reload
open http://127.0.0.1:8000
```

Or one command: `bash run.sh`

Optional — real Bedrock (needs AWS creds + model access):
```bash
export USE_BEDROCK=1 AWS_REGION=us-east-1 BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
pip3 install boto3
```

## Test

```bash
pip3 install "httpx==0.27.0"   # pinned: newer httpx breaks starlette TestClient on Py3.9
python3 -c "
from fastapi.testclient import TestClient
import sys; sys.path.insert(0,'mcp-server'); sys.path.insert(0,'api')
from server import app as m; from main import app as a
c, c2 = TestClient(m), TestClient(a)
assert c.get('/health').json()['protocol'] == '2025-11-25'
assert len(c.post('/mcp', json={'jsonrpc':'2.0','id':1,'method':'tools/list','params':{}}).json()['result']['tools']) == 5
assert 'Front door' in c2.post('/api/chat', json={'message':'who is at the front door?'}).json()['reply']
assert len(c2.post('/api/chat', json={'message':'movie night with kids'}).json()['tools_used']) == 4
assert 'Grandma' in c2.post('/api/chat', json={'message':'check in on grandma'}).json()['reply']
print('ALL TESTS PASSED')"
```

## Roadmap

- [x] 5th tool `remind_grandma` + Grandma check-in card (caretaking angle)
- [ ] Memory: persist chat history to `agent/memory.json` (state-across-sessions proof)
- [ ] Bedrock diagram for AWS Builder feedback answer
- [ ] Record <3 min video (script in `SUBMISSION.md`), submit to Devpost

See `AGENTS.md` for agent build rules and `SUBMISSION.md` for the submission checklist.

## License

MIT — see `LICENSE`.
