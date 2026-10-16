# Friction Log — Alexa+ Family Captain

> Template adapted from `chris-trag/friction-log-guide` (lite). Entries written while building, Oct 16–23, 2026.

## 1. MCP Python SDK vs Python 3.9

- **Task:** Scaffold an MCP 2025-11-25 Streamable HTTP server on the build machine (Python 3.9.6, no newer interpreter).
- **Steps:** Tried `pip install mcp` / `fastmcp`; both require Python ≥3.10 and refused to install.
- **Expected vs actual:** Expected a quick scaffold; got version-gated installs instead.
- **Severity:** Important.
- **Workaround:** Implemented the Streamable HTTP JSON-RPC surface (`initialize`, `tools/list`, `tools/call`) directly on FastAPI — wire-compatible, zero new deps.
- **Suggestion:** Document a minimal no-SDK server pattern for locked-down / older runtimes.

## 2. `httpx` broke the API contract test

- **Task:** Run FastAPI `TestClient` checks for `/mcp` and `/api/chat`.
- **Steps:** Installed latest `httpx`; `TestClient` raised `TypeError: __init__() got an unexpected keyword argument 'app'`.
- **Expected vs actual:** Expected the standard test client to work; the newest `httpx` is incompatible with the pinned `starlette` on 3.9.
- **Severity:** Nice-to-have (local only, judges unaffected).
- **Workaround:** Pinned `httpx==0.27.0` in `requirements.txt`.
- **Suggestion:** Nothing for Amazon — noting it here so the next agent doesn't "upgrade" the pin.

## 3. No Alexa hardware or device lab access

- **Task:** Build an Alexa+ track entry with no Echo hardware or device lab access.
- **Steps:** Read the track rules; found the simulated-experience path explicitly allows a web-app simulation with any agentic tool.
- **Expected vs actual:** Expected a hardware blocker; the rules provided a first-class no-hardware path.
- **Severity:** Nice-to-have (resolved by docs).
- **Workaround:** Simulated living-room TV + front-door camera as MCP tools with generic device names; real MCP server + real agent underneath.
- **Suggestion:** Keep the simulated path prominent in hackathon docs — it is the reason small teams can enter.

## 4. GitHub repo readability (nested folder)

- **Task:** Make the repo judge-readable at a glance.
- **Steps:** First push had everything inside one subfolder; GitHub showed a single directory requiring drill-down.
- **Expected vs actual:** Expected files visible on landing; got an extra click for every file.
- **Severity:** Nice-to-have.
- **Workaround:** Moved all project files to the repo root.
- **Suggestion:** N/A (our own repo hygiene).

## 5. Bedrock gated on a brand-new account

- **Task:** Get a real AI brain (Bedrock Nova/Claude) for the demo.
- **Steps:** Created IAM user + keys (worked), enabled the model path — every `InvokeModel` returns "Operation not allowed". Anthropic's in-console use-case form refuses to submit ("account not authorized"); Basic Support can't file technical cases, only service-limit ones, and Bedrock isn't listed there either.
- **Expected vs actual:** Expected model access after signup; got a multi-layer approval maze instead.
- **Severity:** Important (blocks the live brain, not the demo — mocks cover everything).
- **Workaround:** Filed a service-limit case under General; built the brain fallback-first (Nova + Anthropic formats, memory context) so it wakes up with zero code changes when AWS clears us. Polly voice needed no approval and is live.
- **Suggestion:** Let new accounts invoke at least the cheapest models (Nova Micro) immediately — gating everything pushes student builders away from Bedrock entirely.

## 6. Support-case maze for a simple ask

- **Task:** Ask AWS support to enable Bedrock on a new account.
- **Steps:** Error message pointed at Support Center → AI screener (no help) → case form → Technical type blocked on Basic plan → Service-limit path → Bedrock missing from service list → Category only offers messaging/SES/General.
- **Expected vs actual:** Expected one form; got four dead ends before reaching a human.
- **Severity:** Nice-to-have (worked around, see #5).
- **Workaround:** Filed under General with a precise description (service + region + account + ask) — humans read the text, the dropdowns are just routing hints.
- **Suggestion:** Add Bedrock/model-access to the service-limit service list, or say on the error page which plan unlocks technical cases.
