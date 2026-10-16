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

- **Task:** Build an Alexa+ track entry with no Echo, no Fire TV, no Bee device.
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
