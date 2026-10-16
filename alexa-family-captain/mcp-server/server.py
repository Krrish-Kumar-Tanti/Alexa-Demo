"""
Alexa+ Family Captain - MCP Server
MCP spec 2025-11-25, Streamable HTTP transport.

Run standalone:
    uvicorn server:app --port 8001
    (run from mcp-server/ folder)

Endpoints:
    POST /mcp  - JSON-RPC 2.0 handler (initialize, tools/list, tools/call)
    GET  /mcp  - SSE stream placeholder (spec compliance)
    GET  /health - health check

NOTE: Built with plain FastAPI (no mcp SDK) so it runs on Python 3.9.
Wire-compatible with MCP 2025-11-25 Streamable HTTP clients.
Upgrade path: swap to FastMCP SDK when you have Python 3.10+ - tool names stay same.
"""
from datetime import datetime, timedelta
from typing import Any, Dict, List
import copy

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel

MCP_PROTOCOL_VERSION = "2025-11-25"

app = FastAPI(title="Family Captain MCP Server", version="1.0.0")

# ---- In-memory demo state (resets on restart, fine for hackathon) ----
STATE = {
    "calendar": [
        {"id": "evt1", "title": "Kids homework + dinner", "start": "18:00", "end": "19:30"},
        {"id": "evt2", "title": "Family movie night", "start": "20:00", "end": "22:00"},
        {"id": "evt3", "title": "Grandma video call", "start": "Tomorrow 10:00", "end": "10:30"},
    ],
    "tv": {"power": "on", "app": "Fire TV Home", "kids_mode": True, "volume": 22},
    "door": {
        "last_event": "Package delivered - front door",
        "time": "17:42",
        "motion": False,
        "snapshot_url": "mock://ring/front-door/latest.jpg",
    },
    "orders": [],
}


# ---- Tool implementations (importable by agent/) ----
def tool_get_calendar(day: str = "today") -> Dict[str, Any]:
    """Return family calendar events."""
    return {"day": day, "events": copy.deepcopy(STATE["calendar"])}


def tool_tv_control(action: str = "status", app: str = "", title: str = "") -> Dict[str, Any]:
    """Control simulated Fire TV. actions: status, launch, kids_on, kids_off, volume."""
    tv = STATE["tv"]
    if action == "launch":
        tv["app"] = app or title or "Prime Video"
        return {"ok": True, "tv": copy.deepcopy(tv), "message": "Launched %s on Fire TV" % tv["app"]}
    if action == "kids_on":
        tv["kids_mode"] = True
        return {"ok": True, "tv": copy.deepcopy(tv)}
    if action == "kids_off":
        tv["kids_mode"] = False
        return {"ok": True, "tv": copy.deepcopy(tv)}
    if action == "volume":
        return {"ok": True, "tv": copy.deepcopy(tv)}
    return {"ok": True, "tv": copy.deepcopy(tv)}


def tool_door_status(camera: str = "front-door") -> Dict[str, Any]:
    """Return simulated Ring door status."""
    d = copy.deepcopy(STATE["door"])
    d["camera"] = camera
    return d


def tool_order_groceries(items: List[str] = None, address: str = "home") -> Dict[str, Any]:
    """Simulate grocery/popcorn order."""
    if items is None:
        items = ["popcorn"]
    order = {
        "order_id": "ORD-%s" % datetime.now().strftime("%H%M%S"),
        "items": items,
        "address": address,
        "eta": (datetime.now() + timedelta(minutes=35)).strftime("%H:%M"),
        "status": "confirmed",
    }
    STATE["orders"].append(order)
    return copy.deepcopy(order)


TOOLS = [
    {
        "name": "get_calendar",
        "description": "Get family calendar events for today/tomorrow.",
        "inputSchema": {
            "type": "object",
            "properties": {"day": {"type": "string", "default": "today"}},
        },
    },
    {
        "name": "tv_control",
        "description": "Control Fire TV: launch apps, toggle kids mode, check status.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "action": {"type": "string", "enum": ["status", "launch", "kids_on", "kids_off", "volume"]},
                "app": {"type": "string"},
                "title": {"type": "string"},
            },
        },
    },
    {
        "name": "door_status",
        "description": "Get Ring front-door status, last motion/package event.",
        "inputSchema": {
            "type": "object",
            "properties": {"camera": {"type": "string", "default": "front-door"}},
        },
    },
    {
        "name": "order_groceries",
        "description": "Place a grocery order (popcorn, snacks).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "items": {"type": "array", "items": {"type": "string"}},
                "address": {"type": "string", "default": "home"},
            },
        },
    },
]


def dispatch_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    if args is None:
        args = {}
    if name == "get_calendar":
        return tool_get_calendar(day=args.get("day", "today"))
    if name == "tv_control":
        return tool_tv_control(
            action=args.get("action", "status"),
            app=args.get("app", ""),
            title=args.get("title", ""),
        )
    if name == "door_status":
        return tool_door_status(camera=args.get("camera", "front-door"))
    if name == "order_groceries":
        return tool_order_groceries(items=args.get("items", ["popcorn"]), address=args.get("address", "home"))
    raise ValueError("unknown tool: %s" % name)


@app.get("/health")
def health():
    return {"ok": True, "protocol": MCP_PROTOCOL_VERSION, "tools": [t["name"] for t in TOOLS]}


@app.get("/mcp")
def mcp_stream():
    # Minimal SSE placeholder for MCP Streamable HTTP GET.
    def gen():
        yield ": ping\n\n"
    return StreamingResponse(gen(), media_type="text/event-stream")


@app.post("/mcp")
async def mcp_handler(request: Request):
    body = await request.json()
    # Support single or batch JSON-RPC
    is_batch = isinstance(body, list)
    msgs = body if is_batch else [body]
    replies = []
    for msg in msgs:
        replies.append(handle_rpc(msg))
    if is_batch:
        return JSONResponse(replies)
    return JSONResponse(replies[0])


def handle_rpc(msg: Dict[str, Any]) -> Dict[str, Any]:
    method = msg.get("method", "")
    msg_id = msg.get("id")
    params = msg.get("params", {}) or {}

    # Notifications have no id -> no reply
    if msg_id is None:
        return {"jsonrpc": "2.0", "result": None}

    try:
        if method == "initialize":
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {
                    "protocolVersion": MCP_PROTOCOL_VERSION,
                    "capabilities": {"tools": {"listChanged": False}},
                    "serverInfo": {"name": "family-captain-mcp", "version": "1.0.0"},
                },
            }
        if method == "tools/list":
            return {"jsonrpc": "2.0", "id": msg_id, "result": {"tools": TOOLS}}
        if method == "tools/call":
            name = params.get("name", "")
            args = params.get("arguments", {}) or {}
            output = dispatch_tool(name, args)
            return {
                "jsonrpc": "2.0",
                "id": msg_id,
                "result": {"content": [{"type": "text", "text": str(output)}], "structuredContent": output},
            }
        if method == "ping":
            return {"jsonrpc": "2.0", "id": msg_id, "result": {}}
        return {
            "jsonrpc": "2.0",
            "id": msg_id,
            "error": {"code": -32601, "message": "Method not found: %s" % method},
        }
    except Exception as e:
        return {"jsonrpc": "2.0", "id": msg_id, "error": {"code": -32603, "message": str(e)}}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8001)
