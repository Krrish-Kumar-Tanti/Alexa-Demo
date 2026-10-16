# AGENTS.md — Instructions for AI Coding Agents (Antigravity, etc.)

> Read this file FIRST before touching any code. It keeps parallel agents (human + Antigravity + Opencode) from breaking each other.

## 1. What we are building

**Alexa+ Family Captain**: a simulated Alexa+ web experience (Amazon hackathon: Alexa+ track + AWS Builder + Open Source minis).
One-page UI simulates Alexa+ orchestrating living-room TV + front-door camera + calendar + grocery orders + Grandma check-ins via a real MCP server + agent.
Hero command: `"movie night with kids"` → 4 tool calls → 4 visual cards. Demo-friendly, no hardware.

Repo: https://github.com/Krrish-Kumar-Tanti/Alexa-Demo · Local root: repo root (all files visible on GitHub, no subfolder).

## 2. Hard constraints (DO NOT BREAK)

1. **Python 3.9 only** (host has 3.9.6, no 3.10+/brew python). Therefore:
   - NO `match` statements, NO `list[dict]`/`dict[str, Any]` annotations (use `typing.List/Dict`), NO `mcp`/`fastmcp`/`strands` SDK imports.
   - `requirements.txt` stays: `fastapi==0.109.2`, `uvicorn==0.27.1`, `pydantic==2.6.1`, `httpx==0.27.0` (test only). `boto3` is OPTIONAL, lazily imported inside `try_bedrock_reply()` only.
2. **Contracts judges verify — keep stable:**
   - MCP: `POST /mcp` JSON-RPC 2.0 with methods `initialize` → `protocolVersion "2025-11-25"`, `tools/list` → these 7 names, `tools/call` → `{content, structuredContent}`. Tool names: `get_calendar`, `tv_control`, `door_status`, `order_groceries`, `remind_grandma`, `propose_order`, `confirm_order` (append new tools, never rename).
   - API: `POST /api/chat` in `{message, history, profile}` → out `{reply, cards, tools_used, mcp_imported}`. `GET /api/health` → `{ok:true}`. `POST /api/speak` in `{text}` → `{audio_b64}` or `{fallback:true}`. `GET /` serves `app/index.html`; `/app/*` static.
   - Agent entry: `agent/agent.py:run_agent(user_text, history, profile)` must always return without raising (mock fallback).
3. **No build step for UI.** `app/` is vanilla HTML/CSS/JS served by FastAPI. No npm/vite/webpack. Keep it that way until after submission.
4. **Ports:** MCP `:8001`, API+UI `:8000`. Never change without updating README + run.sh + app.js together.
5. **Alexa+ only.** No other hackathon tracks in this repo. Device words stay generic: "living-room TV", "front-door camera". Never introduce other-track branding or trademarks (no Prime Video etc.).

## 3. File ownership (who does what)

| File | Purpose | Rules |
|---|---|---|
| `mcp-server/server.py` | MCP tools + JSON-RPC handler | Pure functions `tool_*` importable by agent. State in `STATE` dict. Add tools by appending to `TOOLS` + `dispatch_tool`. |
| `agent/agent.py` | Brain: router + Bedrock | `run_agent` never raises; `try_bedrock_reply` returns `""` on any failure. `boto3` import ONLY inside that function. |
| `api/main.py` | Bridge + static server | Thin only: validate `ChatIn`, call `run_agent`, return it. No business logic here. |
| `app/index.html/.js/.css` | Simulated Alexa+ UI | Dark TV theme. Chips call `send(q)`. Cards render `media/tv/door/order/calendar/remind`. Tool badges from `tools_used`. |
| `requirements.txt` | Deps | Pin versions. Don't add unpinned deps. |
| `README/SUBMISSION.md` | Docs | Update when contracts/ports/tools change. |

## 4. How to run + verify (exact, from repo root)

```bash
pip3 install -r requirements.txt
python3 -m uvicorn api.main:app --port 8000 &   # UI
python3 mcp-server/server.py &                  # MCP :8001 (optional for UI, required for MCP proof)
curl -s localhost:8000/api/health
curl -s -X POST localhost:8000/api/chat -H 'Content-Type: application/json' -d '{"message":"movie night with kids"}'
```

Full contract test: see README "Test" block. It must print `ALL TESTS PASSED`. Run it after every change to `mcp-server/` or `api/` or `agent/`.

## 5. Conventions

- Style: small diffs, no refactors without asking. Keep functions < 40 lines. Comments only where logic is non-obvious.
- Mock data stays family-friendly (Bluey, Encanto, cricket, popcorn, samosa). Kid-safe defaults ON.
- Secrets: never commit AWS keys or `.env`. AWS via env only (`USE_BEDROCK`, `USE_POLLY`, `AWS_REGION`, `BEDROCK_MODEL_ID`, `POLLY_VOICE`); `boto3` imports stay lazy inside functions.
- Commits: `feat(mcp|agent|api|ui|docs): short message`. Don't push to `main` without green contract test.
- If Antigravity and human edit the same file: Antigravity owns `app/*` styling + new cards; human/Opencode owns `mcp-server/` + `agent/` logic. `api/main.py` is shared — coordinate.

## 6. Active roadmap (pick topmost unchecked)

- [x] `remind_grandma` tool: `mcp-server` (TOOLS + dispatch + `tool_remind_grandma`) → `agent` router branch → `remind`-style card in `app.js`
- [x] Memory: persist `history` to `agent/memory.json` (load/save in `run_agent`), show "chat N" count in UI
- [x] Bedrock diagram + `docs/aws.md` (for AWS Builder feedback answer)
- [ ] Video script rehearsal (see SUBMISSION.md)

## 7. Common pitfalls

- `httpx` latest breaks `starlette.testclient` on Py3.9 → keep `httpx==0.27.0`.
- `uvicorn` binary lands in `~/Library/Python/3.9/bin` (not on PATH) → run via `python3 -m uvicorn`.
- Port already in use → `lsof -ti:8000 | xargs kill` then restart.
- Web Speech API only works in Chrome → UI must degrade to typing (already does).
