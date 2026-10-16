# Alexa+ Family Captain

> A simulated Alexa+ experience: one command runs the whole family evening — calendar, living-room TV, front-door camera, snack order, and a Grandma check-in.
> Amazon Developer Hackathon · Track: Alexa+ · Minis: AWS Builder + Open Source · MIT licensed.

## What it does

Family Captain is a web app that simulates Alexa+ orchestrating a household in a single agentic flow. It combines a real MCP server (5 tools, spec 2025-11-25, Streamable HTTP) with an agent that falls back gracefully when AWS keys are absent, so the demo works for every judge, every time.

- **One-command orchestration** — "movie night with kids" checks the calendar, starts the living-room TV in kids mode, checks the front door, and orders snacks.
- **Visual cards** — every answer renders media picks, TV status, front-door events, order confirmations, and Grandma check-ins.
- **Live tool-call panel** — every MCP tool invocation is shown on screen as it happens.
- **Memory** — conversation history persists across restarts; the UI shows the running chat count.
- **Voice input** — microphone via Web Speech API (Chrome), with typing as the universal fallback.
- **Bedrock upgrade path** — set `USE_BEDROCK=1` and replies are polished by Claude Sonnet; without keys the built-in brain answers identically-structured responses.

## Hero demo

1. Open the app and type or say **"movie night with kids"**.
2. Watch the tool panel fire: `get_calendar → tv_control → door_status → order_groceries`.
3. Four cards appear: tonight's picks (kid-safe) · living-room TV status · front-door event · order confirmation.
4. Follow up: *"who is at the front door?"* → *"check in on grandma"* → *"order popcorn"*.

## Architecture

```
Browser (chat + cards + tool log, voice via Web Speech API)
  │ POST /api/chat {message, history, profile}
  ▼
api/main.py  ──►  agent/agent.py:run_agent()
                        │  ├─ router (works with zero credentials)
                        │  └─ try_bedrock_reply() → Bedrock Claude (if USE_BEDROCK=1)
                        ▼
                   mcp-server/server.py (also runs standalone on :8001)
  ▼
Chat reply + visual cards + tool-call badges
```

## MCP tools

| Tool | Purpose |
|---|---|
| `get_calendar` | Family calendar events for today/tomorrow |
| `tv_control` | Living-room TV: launch apps, status, kids mode on/off, volume |
| `door_status` | Front-door camera: last package/motion event |
| `order_groceries` | Snack and grocery ordering with ETA |
| `remind_grandma` | Elderly check-in message + video-call scheduling |

Protocol: MCP `2025-11-25` over Streamable HTTP — `POST /mcp` (JSON-RPC 2.0: `initialize`, `tools/list`, `tools/call`, `ping`), `GET /mcp` stream placeholder, `GET /health`. Built on plain FastAPI so it runs on Python 3.9+ with no SDK required.

## API

| Endpoint | Purpose |
|---|---|
| `GET /` | Serves the web UI |
| `POST /api/chat` `{message, history, profile}` | Returns `{reply, cards, tools_used, mcp_imported, chat_count}` |
| `GET /api/health` | Health check |
| `GET /api/memory` | Persisted chat history and count |

## Quickstart (2 minutes, Python 3.9+)

```bash
pip3 install -r requirements.txt

# Terminal 1 — MCP server (:8001)
python3 mcp-server/server.py

# Terminal 2 — API + UI (:8000)
python3 -m uvicorn api.main:app --port 8000 --reload
```

Open http://127.0.0.1:8000 — or run everything at once with `bash run.sh`.

Optional live Bedrock (needs AWS credentials + model access):

```bash
export USE_BEDROCK=1 AWS_REGION=us-east-1 BEDROCK_MODEL_ID=anthropic.claude-3-sonnet-20240229-v1:0
pip3 install boto3
```

## Verify

```bash
pip3 install "httpx==0.27.0"
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

Independent check without cloning: `npx -y @modelcontextprotocol/inspector --cli http://127.0.0.1:8001/mcp --method tools/list` (server must be running).

## Example phrases

- "movie night with kids"
- "who is at the front door?"
- "what's on my calendar today?"
- "order popcorn and samosa"
- "check in on grandma"

## Project structure

```
├── README.md              # This file
├── AGENTS.md              # Build rules for AI coding agents
├── SUBMISSION.md          # Submission checklist, video script, feedback templates
├── FRICTION-LOG.md        # Friction log (judging bonus)
├── LICENSE                # MIT
├── requirements.txt
├── run.sh                 # One-command local runner
├── mcp-server/server.py   # MCP 2025-11-25 Streamable HTTP server, 5 tools
├── agent/agent.py         # run_agent() + Bedrock upgrade path + memory
├── agent/memory.json      # Persisted chat history (created at runtime, git-ignored)
├── api/main.py            # Thin bridge: chat, health, memory endpoints + static UI
├── app/index.html         # UI shell
├── app/app.js             # Chat, cards, tool badges, voice input
├── app/styles.css         # Dark TV-style theme, no build step
└── docs/aws.md            # AWS architecture, Bedrock integration, production blueprint
```

## License

MIT — see `LICENSE`.
