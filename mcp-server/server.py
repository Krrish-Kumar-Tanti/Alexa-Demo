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
import json
import os
import time

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse, Response, StreamingResponse
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
    "tv": {"power": "on", "app": "TV Home", "kids_mode": True, "volume": 22},
    "door": {
        "last_event": "Package delivered - front door",
        "time": "17:42",
        "motion": False,
        "snapshot_url": "mock://doorbell/front-door/latest.jpg",
    },
    "orders": [],
    "reminders": [],
    "proposals": {},
    "lights": {"state": "on", "brightness_pct": 80},
    "weather": {
        "city": "home",
        "now": "Clear",
        "temp_c": 27,
        "evening": "Light rain after 8 PM",
        "outdoor_play": False,
    },
    "homework": {"subject": "Maths chapter 4", "done": False, "minutes_left": 25},
    "shopping_list": [],
}


# ---- Tool implementations (importable by agent/) ----
def tool_get_calendar(day: str = "today") -> Dict[str, Any]:
    """Return family calendar events."""
    return {"day": day, "events": copy.deepcopy(STATE["calendar"])}


def tool_tv_control(action: str = "status", app: str = "", title: str = "") -> Dict[str, Any]:
    """Control living-room TV. actions: status, launch, kids_on, kids_off, volume."""
    tv = STATE["tv"]
    if action == "launch":
        tv["app"] = app or title or "Movies"
        return {"ok": True, "tv": copy.deepcopy(tv), "message": "Launched %s on living-room TV" % tv["app"]}
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
    """Return front-door camera status."""
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


def tool_propose_order(items: List[str] = None, address: str = "home") -> Dict[str, Any]:
    """Stage a grocery order as a proposal. Nothing is ordered until confirm_order approves it."""
    if not items:
        items = ["popcorn"]
    pid = "PROP-%s" % datetime.now().strftime("%H%M%S")
    proposal = {
        "proposal_id": pid,
        "action": "order",
        "items": items,
        "address": address,
        "status": "awaiting_confirmation",
    }
    STATE["proposals"][pid] = proposal
    return copy.deepcopy(proposal)


def tool_confirm_order(proposal_id: str = "", confirmed: bool = True) -> Dict[str, Any]:
    """Approve or decline a staged order. One-time: each proposal can be answered exactly once."""
    prop = STATE["proposals"].get(proposal_id)
    if prop is None:
        return {"ok": False, "error": "unknown proposal: %s" % proposal_id}
    if prop.get("status") != "awaiting_confirmation":
        return {"ok": False, "error": "proposal already answered",
                "proposal_id": proposal_id, "status": prop.get("status")}
    if not confirmed:
        prop["status"] = "cancelled"
        return {"ok": True, "proposal_id": proposal_id, "status": "cancelled"}
    order = tool_order_groceries(items=prop["items"], address=prop["address"])
    prop["status"] = "executed"
    prop["order"] = order
    return {"ok": True, "proposal_id": proposal_id, "status": "executed", "order": order}


def tool_remind_grandma(message: str = "", call_time: str = "") -> Dict[str, Any]:
    """Send a check-in reminder or schedule a call with Grandma."""
    if not message:
        message = "Hi Grandma! Just checking in — how are you feeling today?"
    if not call_time:
        # Default to the Grandma video call already on calendar, or 30 min from now
        call_time = "Tomorrow 10:00"
    reminder = {
        "reminder_id": "REM-%s" % datetime.now().strftime("%H%M%S"),
        "to": "Grandma",
        "message": message,
        "call_scheduled": call_time,
        "status": "sent",
    }
    STATE["reminders"].append(reminder)
    return copy.deepcopy(reminder)


TOOL_SCENES = ("movie-night",)


def tool_scene_control(scene: str = "movie-night", dim_to: int = 20) -> Dict[str, Any]:
    """Apply a room scene: dim the lights, set front door do-not-disturb."""
    dim_to = max(0, min(100, dim_to))
    if scene == "movie-night":
        STATE["lights"]["state"] = "dimmed"
        STATE["lights"]["brightness_pct"] = dim_to
        return {
            "ok": True,
            "scene": scene,
            "lights": copy.deepcopy(STATE["lights"]),
            "door_do_not_disturb": True,
            "message": "Lights dimmed to %s%%, front door on do-not-disturb" % dim_to,
        }
    return {"ok": True, "scene": scene, "lights": copy.deepcopy(STATE["lights"]), "door_do_not_disturb": False}


def tool_get_weather(city: str = "home") -> Dict[str, Any]:
    """Return the home-area forecast (mock, demo-friendly)."""
    w = copy.deepcopy(STATE["weather"])
    w["city"] = city
    return w


def tool_check_homework(kid: str = "kids") -> Dict[str, Any]:
    """Check the kids' homework status before screen time."""
    hw = copy.deepcopy(STATE["homework"])
    hw["kid"] = kid
    return hw


def tool_add_shopping_list(items: List[str] = None) -> Dict[str, Any]:
    """Append items to the family shopping list; returns added + full list."""
    if not items:
        items = ["milk", "bread"]
    merged = STATE["shopping_list"] + [i for i in items if i]
    STATE["shopping_list"] = list(dict.fromkeys(merged))
    return {"ok": True, "added": list(items), "list": copy.deepcopy(STATE["shopping_list"])}


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
        "description": "Control living-room TV: launch apps, toggle kids mode, check status.",
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
        "description": "Get front-door camera status, last motion/package event.",
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
    {
        "name": "remind_grandma",
        "description": "Send a check-in message or schedule a video call with Grandma (elderly caretaking).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string", "description": "Custom message to send to Grandma."},
                "call_time": {"type": "string", "description": "When to schedule the call (e.g. 'Tomorrow 10:00')."},
            },
        },
    },
    {
        "name": "propose_order",
        "description": "Stage a grocery order as a proposal. Nothing is ordered until confirm_order approves it.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "items": {"type": "array", "items": {"type": "string"}},
                "address": {"type": "string", "default": "home"},
            },
        },
    },
    {
        "name": "confirm_order",
        "description": "Approve or decline a staged order proposal. Each proposal can be answered exactly once.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "proposal_id": {"type": "string"},
                "confirmed": {"type": "boolean", "default": True},
            },
        },
    },
    {
        "name": "scene_control",
        "description": "Apply a room scene: dim the lights and set the front door to do-not-disturb.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "scene": {"type": "string", "default": "movie-night"},
                "dim_to": {"type": "integer", "default": 20},
            },
        },
    },
    {
        "name": "get_weather",
        "description": "Get the home-area weather forecast (now + evening).",
        "inputSchema": {
            "type": "object",
            "properties": {"city": {"type": "string", "default": "home"}},
        },
    },
    {
        "name": "check_homework",
        "description": "Check the kids' homework status before screen time.",
        "inputSchema": {
            "type": "object",
            "properties": {"kid": {"type": "string", "default": "kids"}},
        },
    },
    {
        "name": "add_shopping_list",
        "description": "Add items to the family shopping list.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "items": {"type": "array", "items": {"type": "string"}},
            },
        },
    },
]


_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")
_AUDIT_FILE = os.path.join(_DATA_DIR, "audit.jsonl")
os.makedirs(_DATA_DIR, exist_ok=True)


def _log_audit(tool: str, args: Dict[str, Any], ok: bool) -> None:
    """Append one tool call to the audit ledger. Never raises."""
    try:
        os.makedirs(_DATA_DIR, exist_ok=True)
        entry = {"ts": int(time.time()), "tool": tool, "args": args, "ok": ok}
        with open(_AUDIT_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        print("[audit fallback] %s" % e)


def read_audit(limit: int = 20) -> List[Dict[str, Any]]:
    """Return newest-first audit entries. Importable by api/ for the UI panel."""
    try:
        with open(_AUDIT_FILE, "r", encoding="utf-8") as f:
            lines = f.readlines()[-limit:]
        return list(reversed([json.loads(l) for l in lines if l.strip()]))
    except Exception:
        return []


def dispatch_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    if args is None:
        args = {}
    try:
        if name == "get_calendar":
            out = tool_get_calendar(day=args.get("day", "today"))
        elif name == "tv_control":
            out = tool_tv_control(
                action=args.get("action", "status"),
                app=args.get("app", ""),
                title=args.get("title", ""),
            )
        elif name == "door_status":
            out = tool_door_status(camera=args.get("camera", "front-door"))
        elif name == "order_groceries":
            out = tool_order_groceries(items=args.get("items", ["popcorn"]), address=args.get("address", "home"))
        elif name == "remind_grandma":
            out = tool_remind_grandma(message=args.get("message", ""), call_time=args.get("call_time", ""))
        elif name == "propose_order":
            out = tool_propose_order(items=args.get("items"), address=args.get("address", "home"))
        elif name == "confirm_order":
            out = tool_confirm_order(proposal_id=args.get("proposal_id", ""), confirmed=args.get("confirmed", True))
        elif name == "scene_control":
            out = tool_scene_control(scene=args.get("scene", "movie-night"), dim_to=int(args.get("dim_to", 20) or 20))
        elif name == "get_weather":
            out = tool_get_weather(city=args.get("city", "home"))
        elif name == "check_homework":
            out = tool_check_homework(kid=args.get("kid", "kids"))
        elif name == "add_shopping_list":
            out = tool_add_shopping_list(items=args.get("items"))
        else:
            raise ValueError("unknown tool: %s" % name)
    except Exception:
        _log_audit(name, args, False)
        raise
    _log_audit(name, args, True)
    return out


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
        # Stateless server: no Mcp-Session-Id tracking needed; every POST stands alone.
        r = handle_rpc(msg)
        if r is not None:
            replies.append(r)
    if not replies:
        return Response(status_code=202)
    if is_batch:
        return JSONResponse(replies)
    return JSONResponse(replies[0])


def handle_rpc(msg: Dict[str, Any]) -> Dict[str, Any]:
    method = msg.get("method", "")
    msg_id = msg.get("id")
    params = msg.get("params", {}) or {}

    # Notifications (e.g. notifications/initialized) carry no id and get no reply.
    if msg_id is None:
        return None

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
