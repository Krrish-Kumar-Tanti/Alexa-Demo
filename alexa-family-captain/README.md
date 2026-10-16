# Alexa+ Family Captain — Simulated Living-Room Hub

> **Amazon Developer Hackathon (Build, Ship, Shape) submission**
> Primary track: **Alexa+** (simulated-experience path) · Mini challenges: **AWS Builder + Open Source**
> Deadline: **Oct 23, 2026 @ 12:00pm PDT** · Demo video: < 3 min · Repo: https://github.com/Krrish-Kumar-Tanti/Alexa-Demo

One web page that **simulates Alexa+ orchestrating the living room + front door + cloud in a single agentic flow**.
Say **"movie night with kids"** and it checks the calendar, launches Fire TV, checks the Ring door, and orders snacks — showing visual cards + a live MCP tool-call log judges can verify in code and on screen.

## Why this track (read before building)

| Track | Verdict for us | Reason |
|---|---|---|
| **Alexa+ (simulated)** ✅ PRIMARY | Build this | No hardware, no simulator. Rules explicitly allow: *"simulated Alexa+ experience in a web app using your preferred agentic tool — no specific framework/SDK required."* Perfect for web dev + 1–2 hrs/day. |
| AWS Builder ✅ MINI | Layer on same repo | Use Bedrock (+ Strands-style loop) with documented integration. Zero extra app needed. |
| Open Source ✅ MINI | Layer on same repo | Public repo + MIT `LICENSE`. One build, three win chances. |
| Fire TV | Mock inside sim | Real Fire TV needs device/simulator + D-pad packaging. We *simulate* Fire TV via `tv_control` tool + TV-frame UI instead. |
| Ring | Mock inside sim | Real Ring needs API onboarding. We *simulate* Ring via `door_status` tool + door card instead. |
| Bee | ❌ Skip | Requires live Bee device or Apple Watch running Bee software. We have neither — disqualified. |

Rule compliance:
- Simulated path is **exempt** from the strict runtime-hook rule, but we include a **real MCP server + real agent imports/calls anyway** (double-safe for judges).
- Repo contains all source + run instructions. Public + MIT licensed.
- Demo video (YouTube/Vimeo, public, English, <3 min) shows the working simulation.

## Hero demo (60 seconds)

1. Type or speak: **"movie night with kids"**
2. Watch the tool panel light up: `get_calendar → tv_control:launch → door_status → order_groceries`
3. Cards appear: tonight's picks (kid-safe) · Fire TV status · front-door event · order confirmation
4. Follow-ups: *"who is at the front door?"* → *"what's on my calendar?"* → *"order popcorn"*

## File structure

```
alexa-family-captain/
├── README.md              # You are here (human + judge docs)
├── AGENTS.md              # Instructions for AI coding agents (Antigravity, etc.)
├── SUBMISSION.md          # Devpost checklist: video script, feedback, friction log
├── LICENSE                # MIT (Open Source mini-challenge)
├── requirements.txt       # fastapi, uvicorn, pydantic (+ boto3 optional)
├── run.sh                 # One-command local runner
├── mcp-server/
│   └── server.py          # MCP spec 2025-11-25, Streamable HTTP (POST /mcp JSON-RPC)
│                          # Tools: get_calendar, tv_control, door_status, order_groceries
├── agent/
│   ├── __init__.py
│   └── agent.py           # run_agent() + try_bedrock_reply() (boto3 bedrock-runtime)
├── api/
│   └── main.py            # FastAPI: POST /api/chat, GET /api/health, serves app/
└── app/
    ├── index.html         # Simulated Alexa+ UI (TV frame + chat + cards + tool log)
    ├── app.js             # fetch /api/chat, renders cards, Web Speech voice input
    └── styles.css         # Dark Fire-TV-style theme, no build step
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
                     ├─ get_calendar    family events
                     ├─ tv_control      Fire TV sim (launch/status/kids mode)
                     ├─ door_status     Ring sim (package/motion event)
                     └─ order_groceries snack order sim
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
cd alexa-family-captain
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
assert len(c.post('/mcp', json={'jsonrpc':'2.0','id':1,'method':'tools/list','params':{}}).json()['result']['tools']) == 4
assert 'Front door' in c2.post('/api/chat', json={'message':'who is at the front door?'}).json()['reply']
assert len(c2.post('/api/chat', json={'message':'movie night with kids'}).json()['tools_used']) == 4
print('ALL TESTS PASSED')"
```

## Roadmap (Day 2–3, ~1–2 hrs/day)

- [ ] 5th tool `remind_grandma` + elderly check-in card (caretaking angle judges love)
- [ ] Persist chat history to `agent/memory.json` (state-across-sessions proof)
- [ ] Bedrock on-by-default wiring + architecture diagram for AWS Builder
- [ ] Record <3 min video (script in `SUBMISSION.md`), submit to Devpost

See `AGENTS.md` for agent build rules and `SUBMISSION.md` for the submission checklist.

## License

MIT — see `LICENSE`.
