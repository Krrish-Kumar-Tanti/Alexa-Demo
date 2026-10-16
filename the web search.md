# the web search — Alexa+ track research haul

> Goal: everything useful found on GitHub + the web for OUR project (Alexa+ simulated experience, Python 3.9, 1–3 day build).
> Rule used to filter: if it needs hardware, a non-Python stack, or >1 day to integrate, it is listed under "don't copy" with the reason.
> Our repo files referenced below are at the repo root.

## 1. Judge / dev profiles searched (all 6)

| Profile | Relevant find | Use it? |
|---|---|---|
| `giolaq` (Giovanni Laquidara) | [`devices-agent-skills`](https://github.com/giolaq/devices-agent-skills) — community Agent Skills in `SKILL.md` format (spec: agentskills.io), installable via `npx skills add`. Proprietary Amazon skills live at `AmazonAppDev/amazon-devices-buildertools`. | YES — steal the `SKILL.md` packaging format if we ever ship our agent workflow as a skill. The repo's own skills are TV-migration focused, ignore the content, copy the format. |
| `anishamalde` | [`maps-MCP-extapp-demo`](https://github.com/anishamalde/maps-MCP-extapp-demo) — MCP "extapp" demo (TypeScript). | YES as inspiration only — this is the **MCP Apps** pattern (rich interactive UI inside the assistant). Our `app/` cards are our version of this. No code to copy (wrong stack), but name-drop "MCP Apps-style cards" in Devpost feedback. |
| `chris-trag` (Chris Traganos) | [`friction-log-guide`](https://github.com/chris-trag/friction-log-guide) — friction-log templates + example + AI prompts. Also `commonroom-mcp` (Python MCP server) and `pkg-peep` (MCP server) as MCP shape references. | YES — copy `templates/friction-log-template-lite.md` into our repo as `FRICTION-LOG.md` and fill 3–4 entries. This is the +10% judging bonus, gift-wrapped by a judge. |
| `knmeiss` (Kourtney Meiss) | 7 repos, none Alexa/MCP related. | No. |
| `emersonsklar` | 3 repos, only `common-voice` (Mozilla). | No. |
| `mosesroth` | ~100 repos, all Fire TV / React Native compat tests (icons, charts, navigation, IAP). | No — wrong track, wrong stack. Skip entirely. |

## 2. Official Alexa+ docs (the only docs that matter)

- [Alexa+ MCP Toolkit Overview](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html) — Alexa+ acts as MCP **client**, spec **2025-11-25**, add-on registry + reasoning + orchestrator. Our `mcp-server/server.py` already mirrors this shape.
- [Alexa+ MCP QuickStart](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html) — hard requirements: **Streamable HTTP** (legacy SSE deprecated, must migrate), **remote URL** (use `cloudflared` tunnel for local dev), onboard via `alexa-ai` CLI (`alexa-ai new mcp`, `alexa-ai deploy`), `addon.json` needs `shortDescription ≤123 chars`, `fullDescription`, 3–4 `examplePhrases`, privacy URLs, icon set. MCP Apps via `@modelcontextprotocol` extensions.
- Takeaway for us: we use the **simulated path** (no onboarding needed), but mirror the official shape — Streamable HTTP ✓ (we do), `2025-11-25` ✓ (we do), examplePhrases ✓ (our chips). Mention all three in Devpost feedback.

## 3. Competitor entries (same hackathon, Alexa+ track) — the steal list

### 3a. `guptachetan1995/alexa-plus` — closest to us, study first
- https://github.com/guptachetan1995/alexa-plus · Devpost: `devpost.com/software/smart-home-agent` · 8 tools, Streamable HTTP `2025-11-25`, seeded device registry, **simulated web client** (same architecture as ours).
- Killer idea: **propose → confirm gate**. The agent can only *propose* changes; executing needs a one-time `confirmation_id` minted through an owner-only REST route the agent can't reach. Every execution lands in an append-only audit log. Their UI shows a "Confirmation needed" panel with Confirm/Decline.
- Also steals: live EC2 URL + `npx -y @modelcontextprotocol/inspector --cli <url>/mcp --method tools/list` so judges verify **without cloning anything**.

### 3b. `dl88jing/northbridge-alexa-mcp` — best AWS Builder story
- https://github.com/dl88jing/northbridge-alexa-mcp · 7 tools, Streamable HTTP, web simulator, `./demo.sh` one-command offline demo (no AWS keys), **Strands `@tool` + `DemoModel` offline + documented Bedrock path**, **hash-chained audit ledger** (`data/runtime/audit_ledger.jsonl`), `docs/architecture.md`.
- Steals: (1) our `run.sh` should match their `demo.sh` one-command bar; (2) offline-by-default + Bedrock path is exactly our `try_bedrock_reply` pattern — keep and document; (3) audit ledger: log every tool call to JSONL and show it in the UI.

### 3c. `ucsandman/leg-alexa-mcp` — best security + submission hygiene
- Self-hosted MCP, spec 2025-11-25+, stateless POST, `MCP_AUTH_TOKEN` (refuses non-loopback bind without token), dangerous tool runs in **two enforced steps** (preview + single-use 5-min token), repo contains **`FRICTION-LOG.md`**, Open Source mini via MIT.
- Steals: token-gate idea for `order_groceries`; keep a `FRICTION-LOG.md` in the repo (same file the judges bonus rewards).

### 3d. `serversmx/alexa-mcp`, `m0nkmaster/alexa-mcp`, `snordquist/alexa-mcp` — DO NOT COPY
- Real Echo-device control via `alexa-remote2` (unofficial internal API): announcements, routines CRUD, volume, lists.
- Reason: needs a real Amazon account + registered Echo + interactive browser login (2FA), Node 18, per-machine tokens. Days of auth pain, zero demo reliability, unofficial API judges didn't ask for. Mention in feedback as "evaluated, rejected" at most.

## 4. Old ASK SDK world — DO NOT COPY
- `alexa-samples/*` (zero-to-hero course), `amzn/alexa-skills-kit-js` (deprecated, moved to `alexa/` org), Lambda + interaction-model tutorials.
- Reason: that's the **old custom-skills model**, not the Alexa+ MCP path this hackathon judges. Any hour spent there is an hour not spent on the demo video.

## 5. Build in 1–3 days — ranked steal list mapped to our files

| # | Steal (from) | Change in our repo | Est. |
|---|---|---|---|
| 1 | Confirm gate (alexa-plus §3a) | `order_groceries` (and later any real-world action) requires a UI Confirm click before executing; agent first returns a "proposal" card. Files: `agent/agent.py`, `app/app.js`, `app/index.html`. Biggest trust story for judges. | 2–3 h |
| 2 | Audit ledger (northbridge §3b) | Append every `dispatch_tool` call to `data/audit.jsonl` in `mcp-server/server.py`; render last N entries in the tool panel (`app/app.js`). Tamper-evident, judge-readable proof. | 1–2 h |
| 3 | Inspector verify line (alexa-plus §3a) | Add to `README.md`: `npx -y @modelcontextprotocol/inspector --cli http://127.0.0.1:8001/mcp --method tools/list`. Judges verify without cloning. | 15 min |
| 4 | `FRICTION-LOG.md` (chris-trag §1) | Copy the lite template from `chris-trag/friction-log-guide/templates/friction-log-template-lite.md`, fill 3–4 entries (Py3.9 vs MCP SDK, httpx pin, no-hardware simulation). | 30 min |
| 5 | `addon.json`-style phrases (official §2) | Add `examplePhrases` block to `README.md` (our 5 chips, ≤200 chars each) to mirror official onboarding shape. | 30 min |
| 6 | One-command demo parity (northbridge §3b) | Verify `bash run.sh` works cold on a fresh machine (it should: pip install → MCP :8001 → API :8000). | 20 min |

Do in order 3 → 4 → 5 → 6 (all <2 h total, zero risk), then 2, then 1.

## 6. All links in one place

- Judges/devs: https://github.com/giolaq · https://github.com/anishamalde · https://github.com/chris-trag · https://github.com/knmeiss · https://github.com/emersonsklar · https://github.com/mosesroth
- Skills format: https://github.com/giolaq/devices-agent-skills · spec https://agentskills.io · installer https://skills.sh
- MCP extapp demo: https://github.com/anishamalde/maps-MCP-extapp-demo
- Friction log kit: https://github.com/chris-trag/friction-log-guide
- Python MCP refs: https://github.com/chris-trag/commonroom-mcp · https://github.com/chris-trag/pkg-peep
- Amazon builder tools org: https://github.com/AmazonAppDev
- Official docs: https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html · https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html · action add-ons via agent: https://developer.amazon.com/docs/alexaplus/add-ons/category-sdk-create-addon-with-ai-agent.html
- Competitors: https://github.com/guptachetan1995/alexa-plus · https://github.com/dl88jing/northbridge-alexa-mcp
- Real-device MCP (rejected): https://github.com/serversmx/alexa-mcp · https://github.com/m0nkmaster/alexa-mcp · https://github.com/snordquist/alexa-mcp
- Old SDK (rejected): https://github.com/alexa-samples · https://github.com/alexa (new ASK home)
