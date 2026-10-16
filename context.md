# context.md — handoff to future OpenCode (read this first, before anything else)

> Written late Oct 16/17 IST by past-you. Krrish is asleep, machine off. Everything below is what you need to resume without asking him to repeat himself.

## 1. Who, what, where

- Human: **Krrish Kumar Tanti** — 2nd-year CSE, beginner, learns by doing. Teach in plain words, zero jargon. He hates AI-sounding text and robotic commit messages. He sends phone screenshots and wants "tell me one by one" guidance.
- Project: **Alexa+ Family Captain** — simulated Alexa+ web demo for the Amazon hackathon (Alexa+ track + AWS Builder + Open Source minis). Deadline **Oct 23, 12pm PDT**.
- Repo: https://github.com/Krrish-Kumar-Tanti/Alexa-Demo · branch `master` (only branch) · local root `/Users/harshtanti/Krrish/amazon developer hackathon` (flat — all files at root, that was a deliberate fix).
- Team order (boss-posted, non-negotiable): **Krrish → you (OpenCode, backend + all commits) → Antigravity (`app/*` UI only) + Kiro (submission copy/video timing)**. Coordination file: `agents_talking.md` (append-only, NEVER edit another agent's messages, never let them push).

## 2. Architecture (30-second version)

- `mcp-server/server.py` — MCP 2025-11-25 Streamable HTTP, **7 tools**: get_calendar, tv_control, door_status, order_groceries, propose_order, confirm_order, remind_grandma. Plain FastAPI (no SDK — Python here is 3.9.6, SDKs need 3.10+). `dispatch_tool` logs every call to `data/audit.jsonl`.
- `agent/agent.py` — `run_agent()` keyword router (never raises; every branch ends in `_finish`). Bedrock via lazy `boto3` (`try_bedrock_reply`, Nova format auto-detected, Anthropic fallback supported), last-6-turns memory context, open-question answers (who-am-i/capabilities). `.env` auto-loader built in.
- `api/main.py` — thin bridge: `POST /api/chat`, `GET /api/health|memory|audit`, `POST /api/speak` (Polly Neural → base64 MP3, `{fallback:true}` on any error). Serves `app/`.
- `app/` — vanilla HTML/CSS/JS, no build step. Cards for all 7 types + proposal + TTS toggle + audit panel + memory badge.
- Ports: MCP `:8001`, API+UI `:8000`. Contracts: `/mcp` JSON-RPC (initialize→2025-11-25, tools/list, tools/call→{content,structuredContent}, notifications→202 empty); `/api/chat` in/out shape in AGENTS.md §2.

## 3. AWS state (do NOT re-do any of this)

- Local `.env` EXISTS in repo root (gitignored, never commit, never paste into chat): USE_BEDROCK=1, USE_POLLY=1, region us-east-1, IAM user `family-captain-demo`, BEDROCK_MODEL_ID=amazon.nova-micro-v1:0, POLLY_VOICE=Joanna. Keys work (STS verified).
- **Polly is LIVE** (verified real MP3 bytes). **Bedrock is BLOCKED**: `InvokeModel` → "Operation not allowed" (free-plan gate). Anthropic use-case form also blocked ("account not authorized"). A service-limit support case was filed under General (Krrish did it). If it clears: NOTHING to change in code — brain wakes automatically. Re-test with the one-liner in §5.
- If Krrish says "brain still dead": check support case reply first, then consider paid-plan upgrade (his call — demo is complete without Bedrock).

## 4. What's DONE (all pushed; last commit rewrote README to teaching voice)

Day-1 scaffold, flatten-to-root, Alexa+-only debrand, remind_grandma, memory, docs/aws.md, confirm gate, audit ledger, MCP notification polish, Polly voice + UI playback, open-question answers, day-aware calendar, README teaching rewrite, FRICTION-LOG (6 entries), research file (`the web search.md`), talking-file work orders. Tests green at every commit.

## 5. Exact commands (from repo root)

```bash
lsof -ti:8000,8001 | xargs kill; python3 mcp-server/server.py & sleep 2; python3 -m uvicorn api.main:app --port 8000 &
curl -s localhost:8000/api/health
# contract test: TestClient, protocol 2025-11-25, 7 tools, hero == 4 tools → ALL TESTS PASSED (block in README)
pip3 install "httpx==0.27.0"   # pinned: latest breaks TestClient on 3.9
# Bedrock live check: invoke Nova Micro via .env creds, expect "Nova online" or "Operation not allowed"
```

## 6. What's NEXT (in order)

1. **Commerce loop** (planned, assigned, NOT built): catalog + search/cart/history/track tools + PIN approval. Exact card JSON contracts are in `agents_talking.md` commerce section. You do O5–O7, Antigravity C1–C4, Kiro K4. Start on Krrish's `build commerce`.
2. **Video** (Krrish only records): script in SUBMISSION.md §3 (~2:40). Remind him: Chrome 1080p, kids-mode ON, both servers running.
3. **Devpost submission** (deadline day): paste Kiro's copy WITH the posted corrections (7 tools, Nova Micro — Kiro's text still says 5/Claude in places). Repo PUBLIC, video PUBLIC, collaborators LAST (chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar — invites expire in 7 days).
4. If Bedrock clears: re-run live check, optionally re-record one video line with the live brain. Nothing else changes.

## 7. Tripwires (learned the hard way)

- Commit messages: ONE plain human sentence about file changes. Never `feat:`/`refactor:`/labels/backstory/Day-numbers/track-talk. He will call you out publicly.
- Alexa+ ONLY in code/docs/UI. Banned strings: Fire TV, Prime Video, Amazon Fresh, Ring Doorbell, Fire/Vega OS, Bee. False positives to ignore: `.ring` CSS (Alexa light ring), "ring"/"prime" voice keywords in agent.py, "string" substrings, the AGENTS.md guard rule itself.
- Python 3.9-compatible code only (no match, no `list[dict]`, no mcp SDK). Dual-runs on 3.12 fine.
- `agent/memory.json` + `data/` + `.env` + `*.log` are gitignored — if one ever shows in `git status`, stop and fix ignore before committing.
- TestClient needs `httpx==0.27.0`; uvicorn via `python3 -m`; servers started with `&` die when the shell does — always restart fresh before verifying.
- Verify my claims by running, not by reading. Trust `ALL TESTS PASSED` + live curl, not talking-file reports.
