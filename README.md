# Alexa+ Family Captain

One command — *"movie night with kids"* — and the whole evening sets itself up: calendar checked, living-room TV on in kids mode, front door glanced at, snacks ordered, Grandma checked in. This repo is that demo, built for the Amazon Developer Hackathon (Alexa+ track).

If you're new here (hi, Krrish), read this file top to bottom. It teaches the project, not just describes it.

## The 3 big ideas

Everything in this repo is one of three things. Learn these and you understand 90% of it:

**1. The hands — `mcp-server/server.py`.** A small server that exposes 12 "tools" (calendar, TV, door camera, grocerynung cart, orders, reminders…). It speaks an open Amazon-backed standard called MCP, which is just a fixed way of saying *"here are my tools, call them like this."* When anyone — our app, or one day real Alexa+ — wants something done, they call a tool here.

**2. The receptionist — `agent/agent.py`.** Takes your sentence, figures out which tools to call, and writes the reply. Today it matches keywords ("door" → door tool). When AWS approves our account, a real AI model (Nova/Claude via Bedrock) takes over the thinking. Same tools, smarter receptionist.

**3. The face — `app/` (a normal web page, no build tools).** Chat box, visual cards, tool-call badges, voice button. It just calls our own API and draws what comes back.

Three helpers worth knowing by name: **memory** (`agent/memory.json` — a notebook that never forgets your chats), the **audit ledger** (`data/audit.jsonl` — a receipt book of every tool call), the **confirm gate** (money never moves without your explicit "confirm" — proposals first, orders second), and the **voice box** (Polly Neural reads replies aloud, browser voice as backup).

## Follow one command through the system

Type **"movie night with kids"** and watch it travel:

1. `app/app.js` → `send()` posts your text to `POST /api/chat`.
2. `api/main.py` → hands it to `run_agent()` in `agent/agent.py`. Thin bridge, no thinking here.
3. `run_agent()` sees "movie" + "night" and calls 4 tools from the MCP server: `get_calendar`, `tv_control`, `door_status`, `order_groceries`.
4. Each tool call is written into the audit ledger, and the turn is saved to memory.
5. The reply + 4 visual cards + the tool badges come back to the page. If AWS keys are live, Bedrock polishes the wording; if not, the built-in reply is used. The demo never breaks either way.

Try it with the browser's developer console open — you'll see each step land in real time.

## The tools (the 7 hands — more coming)

| Tool | What it does, in plain words |
|---|---|
| `get_calendar` | Reads the family calendar (today or tomorrow) |
| `tv_control` | Living-room TV: launch, status, kids mode, volume |
| `door_status` | Front-door camera: last package or motion event |
| `order_groceries` | Places a snack order (used by the movie-night setup) |
| `propose_order` | Stages an order WITHOUT placing it (the proposal) |
| `confirm_order` | Places or cancels a staged order — one-time only |
| `remind_grandma` | Sends Grandma a check-in + schedules the video call |

Next up: a store catalog with search, a cart, order history and delivery tracking — same pattern, more hands.

Money rule, enforced in code: `propose` never spends. Only `confirm` (your explicit yes) executes.

## Run it yourself (5 minutes, your turn)

```bash
pip3 install -r requirements.txt
python3 mcp-server/server.py        # terminal 1 — the hands (:8001)
python3 -m uvicorn api.main:app --port 8000   # terminal 2 — face + receptionist (:8000)
```

Open http://127.0.0.1:8000 and try these in order — say each out loud if you like, then watch the tool badges:

1. `movie night with kids` → 4 tools, 4 cards. The whole product in one sentence.
2. `who is at the front door?` → 1 tool, camera card.
3. `order popcorn` → a PROPOSAL, not an order. Nothing spent.
4. `confirm` → order placed with ID + tracking. (Try `cancel` next time instead.)
5. `check in on grandma` → message + scheduled call, 2 tools.
6. `who am i?` → answered from memory, not from code.

Then open `agent/memory.json` and `data/audit.jsonl` — that's your evening, remembered and receipted.

## Read the code (20-minute guided tour)

In this order. Each stop is short on purpose:

1. **`app/app.js` → `renderCards()`** — how a reply becomes pictures. Find the `order_proposal` branch: that's the Confirm/Cancel buttons.
2. **`api/main.py`** — 60 lines. Notice how thin it is: validate, call `run_agent`, return. Also `GET /api/audit` and `POST /api/speak` (voice).
3. **`agent/agent.py` → `run_agent()`** — the receptionist's desk. Each `if` is one understood sentence. Find the confirm/cancel block at the top: that's the money rule in code.
4. **`mcp-server/server.py` → `TOOLS` + `dispatch_tool()`** — the hands themselves. `TOOLS` is the menu, `dispatch_tool` is the kitchen.
5. **`try_bedrock_reply()`** — the sleeping brain. Reads keys from local `.env`, picks Nova or Claude format automatically, returns "" on any failure so the mock brain covers.

## What's real vs what's pretend (honest list)

Real: the MCP protocol shaping, the confirm gate, the audit ledger, the memory file, the Polly human voice, the router logic.
Pretend (for now): the TV, door camera, store and orders are simulated data, not real devices — the hackathon's simulated path explicitly allows this, and the code is shaped so real backends can replace the mocks later.
Waiting on AWS: the AI brain (account approval pending) — everything is built for it, fallbacks hold the fort meanwhile.

## Questions you've actually asked

**Why can't it place a real Amazon order?** Amazon exposes no third-party "buy this for real" API — real checkout needs merchant onboarding and certification (weeks, a real business). So we simulate the complete loop (search → cart → PIN → wallet → tracking → history) with total fidelity. Judges accept this; it's what the track asks for.

**Why Python 3.9?** The build machine has 3.9.6 and nothing newer was available at the start, so everything is written to run there (and therefore everywhere newer too).

**Why does the voice work but not the brain?** Different gates: Polly voice needed only keys (done, live). Bedrock models need account approval (pending). Code handles both states.

**What do the agents do?** OpenCode: backend + commits. Antigravity: everything inside `app/` (looks, cards, voice button). Kiro: video timing + Devpost copy. You: decisions, video, submit. Details in `agents_talking.md`.

## Reference (compact, mostly for submission day)

| Endpoint | Purpose |
|---|---|
| `GET /` | The web UI |
| `POST /api/chat` `{message, history, profile}` | `{reply, cards, tools_used, mcp_imported, chat_count}` |
| `GET /api/health` · `GET /api/memory` · `GET /api/audit` | Health, chat history, tool-call ledger |
| `POST /api/speak` `{text}` | Human voice MP3 (`{audio_b64}`) or `{fallback:true}` |
| `POST /mcp` | MCP 2025-11-25: `initialize`, `tools/list`, `tools/call` |

Verify (contract test — run after any backend change):
```bash
pip3 install "httpx==0.27.0"   # pinned: newer httpx breaks the test client on Python 3.9
python3 -c "
from fastapi.testclient import TestClient
import sys; sys.path.insert(0,'mcp-server'); sys.path.insert(0,'api')
from server import app as m; from main import app as a
c, c2 = TestClient(m), TestClient(a)
assert c.get('/health').json()['protocol'] == '2025-11-25'
assert len(c.post('/mcp', json={'jsonrpc':'2.0','id':1,'method':'tools/list','params':{}}).json()['result']['tools']) == 7
assert len(c2.post('/api/chat', json={'message':'movie night with kids'}).json()['tools_used']) == 4
print('ALL TESTS PASSED')"
```

Local AWS keys live ONLY in repo-root `.env` (git-ignored, never committed). Without it, mocks cover everything.

## License

MIT — see `LICENSE`.
