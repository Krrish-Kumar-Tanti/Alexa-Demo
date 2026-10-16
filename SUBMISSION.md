# SUBMISSION.md — Devpost Checklist + Video Script + Feedback Templates

> Hackathon: **Build, Ship, Shape: Amazon Developer Hackathon** · https://amazonappdev2026.devpost.com/
> Deadline: **Oct 23, 2026 @ 12:00pm PDT** · Track: **Alexa+** (+ AWS Builder + Open Source minis)
> Our repo: https://github.com/Krrish-Kumar-Tanti/Alexa-Demo

## 1. What we are entering

- **Track: Alexa+** — simulated-experience path (web app, any agentic tool allowed; MCP/SDK not mandatory, but we include a real MCP server anyway).
- **Mini: AWS Builder** — Bedrock (`boto3` `bedrock-runtime.invoke_model`, Claude Sonnet) + Strands-style tool loop in `agent/agent.py`. Document services + how used in feedback answer.
- **Mini: Open Source** — public repo + MIT `LICENSE`. Include: contribution URL (= repo URL), GitHub username, what/why description.

One project, one track (Alexa+), up to one mini prize — no other tracks in this repo.

## 2. Submission checklist (do in this order, Day 6–7)

- [ ] Repo public, all files at root, contains ALL code + `README.md` run instructions + `LICENSE`. Code actually imports/calls tech (`from server import tool_*`, `boto3 bedrock-runtime`, `POST /mcp`) — not README-only.
- [ ] Collaborators added LAST (invites expire in 7 days): `chris-trag, knmeiss, giolaq, anishamalde, mosesroth, emersonsklar` via Settings → Collaborators. If added earlier and lapsed, re-send.
- [ ] Demo video: YouTube or Vimeo, **public, English, < 3 min**. Lead with hero demo. No third-party trademarks/music without permission.
- [ ] Devpost fields: text description (what + how) · repo URL · video URL · track = Alexa+ (+ minis) · pre-existing work statement ("Built fresh Oct 16–23, 2026") · product feedback (required) · friction log (optional, +10% bonus).
- [ ] Git remote verified: `git remote -v` → `origin https://github.com/Krrish-Kumar-Tanti/Alexa-Demo.git`.

## 3. Video script (2:45, don't exceed 3:00)

| Time | Show | Say |
|---|---|---|
| 0:00–0:25 | Title + problem: chaotic family evenings | "Family Captain: one Alexa+ command runs movie night — calendar, TV, front door, snacks, Grandma check-in." |
| 0:25–1:50 | LIVE at `http://127.0.0.1:8000`: speak/type "movie night with kids" → point to tool badges firing → scroll cards → follow-ups "front door?" and "check in on grandma" | Call out kids-mode ON, state across turns, purchasing + caretaking cards. |
| 1:50–2:25 | Code walk (30s): `mcp-server/server.py` tools/list → `agent/agent.py` Bedrock call → `POST /mcp` in terminal | "Real MCP 2025-11-25 server with 7 tools, Bedrock-ready integration (live the moment AWS clears the account, mock brain covers meanwhile)." |
| 2:25–2:45 | Impact close: elderly check-in + kid safety + what's next | End on repo URL. |

## 4. Product feedback template (paste into Devpost, fill honestly)

**Alexa+ MCP (simulated path, MCP spec 2025-11-25 Streamable HTTP):** Used for ___. Worked well: ___. Needs work: ___. Onboarding: ___. Build again? ___.
**AWS Bedrock (+ Strands-style loop):** Services: Bedrock Claude Sonnet via boto3 in `agent/agent.py:try_bedrock_reply`; tool orchestration in `run_agent`. Used for ___. ...
**Onboarding overall:** ___.

## 5. Friction log template (each entry = bonus points)

1. Task: ___ · Steps: ___ · Expected: ___ vs Actual: ___ · Severity: critical/important/nice-to-have · Workaround: ___ · Suggestion: ___.
Aim for 3–4 entries (e.g., "Py3.9 vs MCP SDK", "httpx broke TestClient", "flattened repo for GitHub readability").

## 6. Git quick reference (repo root)

```bash
git remote -v                                  # must show origin → Alexa-Demo.git
git add -A && git commit -m "feat: ..." && git push
# make repo PUBLIC before submitting; keep collaborators step for submission day
```
