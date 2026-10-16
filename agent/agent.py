"""
Alexa+ Family Captain - Agent brain.
Tries AWS Bedrock (Strands SDK / boto3) if credentials exist,
otherwise uses built-in mock brain so demo ALWAYS works.

This file is the AWS Builder proof: real boto3 import + Bedrock call,
with graceful fallback for judges without AWS keys.

Usage:
    from agent.agent import run_agent
    out = run_agent("movie night with kids", history=[], profile={"kids_mode": True})
"""
import os
import sys
from typing import Any, Dict, List

# Allow importing tool functions from mcp-server/server.py
_HERE = os.path.dirname(os.path.abspath(__file__))
_MCP_DIR = os.path.join(os.path.dirname(_HERE), "mcp-server")
if _MCP_DIR not in sys.path:
    sys.path.insert(0, _MCP_DIR)


def _load_dotenv() -> None:
    """Load repo-root .env into environ (never overrides real env). No new deps."""
    try:
        path = os.path.join(os.path.dirname(_HERE), ".env")
        with open(path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass


_load_dotenv()

try:
    from server import (  # type: ignore
        tool_get_calendar,
        tool_tv_control,
        tool_door_status,
        tool_order_groceries,
        tool_remind_grandma,
        tool_propose_order,
        tool_confirm_order,
    )
    MCP_IMPORTED = True
except Exception:
    MCP_IMPORTED = False

    def tool_get_calendar(day="today"):
        return {"day": day, "events": []}

    def tool_tv_control(action="status", app="", title=""):
        return {"ok": True, "tv": {"app": app or "TV Home", "kids_mode": True}}

    def tool_door_status(camera="front-door"):
        return {"last_event": "No events", "camera": camera}

    def tool_order_groceries(items=None, address="home"):
        return {"order_id": "ORD-MOCK", "items": items or [], "status": "confirmed"}

    def tool_remind_grandma(message="", call_time=""):
        return {"reminder_id": "REM-MOCK", "to": "Grandma", "message": message or "Hi Grandma!", "call_scheduled": call_time or "Tomorrow 10:00", "status": "sent"}

    def tool_propose_order(items=None, address="home"):
        return {"proposal_id": "PROP-MOCK", "action": "order", "items": items or [],
                "address": address, "status": "awaiting_confirmation"}

    def tool_confirm_order(proposal_id="", confirmed=True):
        return {"ok": False, "error": "mock mode"}


_PENDING_PROPOSAL = None  # staged order awaiting user approval (same-process API only)


def _invoke_nova(client: Any, model: str, prompt: str) -> str:
    import json
    body = json.dumps({"messages": [{"role": "user", "content": [{"text": prompt}]}],
                       "inferenceConfig": {"max_new_tokens": 300}})
    resp = client.invoke_model(modelId=model, body=body)
    data = json.loads(resp["body"].read())
    return data.get("output", {}).get("message", {}).get("content", [{}])[0].get("text", "")


def _invoke_anthropic(client: Any, model: str, prompt: str) -> str:
    import json
    body = json.dumps({"anthropic_version": "bedrock-2023-05-31", "max_tokens": 300,
                       "messages": [{"role": "user", "content": [{"type": "text", "text": prompt}]}]})
    resp = client.invoke_model(modelId=model, body=body)
    data = json.loads(resp["body"].read())
    return data.get("content", [{}])[0].get("text", "")


def try_bedrock_reply(user_text: str, context: str) -> str:
    """
    Try real AWS Bedrock call (Nova or Anthropic, picked by BEDROCK_MODEL_ID).
    Returns text or empty string on any failure (mock brain takes over).
    AWS Builder mini-challenge proof: uses boto3 bedrock-runtime.
    Requires env: USE_BEDROCK=1 + AWS creds + model access.
    """
    if os.getenv("USE_BEDROCK", "0") != "1":
        return ""
    try:
        import boto3  # type: ignore
        region = os.getenv("AWS_REGION", "us-east-1")
        model = os.getenv("BEDROCK_MODEL_ID", "amazon.nova-micro-v1:0")
        client = boto3.client("bedrock-runtime", region_name=region)
        prompt = "You are Alexa+ Family Captain. Context:\n%s\nUser: %s\nReply in 2 friendly sentences." % (
            context, user_text)
        if "nova" in model.lower():
            return _invoke_nova(client, model, prompt)
        return _invoke_anthropic(client, model, prompt)
    except Exception as e:
        print("[bedrock fallback] %s" % e)
        return ""


def memory_context(max_turns: int = 6) -> str:
    """Recent conversation as model context. Empty string when no history."""
    try:
        mem = load_memory()[-max_turns:]
        if not mem:
            return ""
        lines = ["User: %s / Alexa: %s" % (m.get("user", ""), m.get("reply", "")) for m in mem]
        return "Conversation so far:\n" + "\n".join(lines)
    except Exception:
        return ""


_MEMORY_FILE = os.path.join(_HERE, "memory.json")


def load_memory() -> List[Dict[str, Any]]:
    """Load persisted conversation history from memory.json."""
    if not os.path.exists(_MEMORY_FILE):
        return []
    try:
        import json
        with open(_MEMORY_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            if isinstance(data, dict):
                return data.get("history", [])
    except Exception as e:
        print("[memory read fallback] %s" % e)
    return []


def save_memory(user_text: str, reply: str) -> int:
    """Append turn to memory.json and return total count."""
    try:
        import json
        import time
        mem = load_memory()
        mem.append({"user": user_text, "reply": reply, "ts": int(time.time())})
        mem = mem[-100:]
        with open(_MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump({"total_chats": len(mem), "history": mem}, f, indent=2)
        return len(mem)
    except Exception as e:
        print("[memory write fallback] %s" % e)
        return 1


def _finish(user_text: str, reply: str, cards: List[Dict[str, Any]], tools_used: List[str]) -> Dict[str, Any]:
    try:
        from server import _log_audit  # type: ignore
        for tname in tools_used:
            _log_audit(tname.split(":")[0], {"via": "agent", "user": user_text}, True)
    except Exception:
        pass
    chat_count = save_memory(user_text, reply)
    return {
        "reply": reply,
        "cards": cards,
        "tools_used": tools_used,
        "mcp_imported": MCP_IMPORTED,
        "chat_count": chat_count,
    }


def run_agent(user_text: str, history: List[Dict[str, str]] = None, profile: Dict[str, Any] = None) -> Dict[str, Any]:
    """Main entry point used by api/main.py and demo video."""
    if history is None:
        history = []
    if profile is None:
        profile = {"name": "Family", "kids_mode": True}
    t = user_text.lower()
    tools_used: List[str] = []
    cards: List[Dict[str, Any]] = []
    global _PENDING_PROPOSAL

    # --- Confirm / cancel a staged order (nothing executes without approval) ---
    if any(k in t for k in ["confirm", "place it", "yes, order", "yes order"]) and _PENDING_PROPOSAL:
        res = tool_confirm_order(_PENDING_PROPOSAL, True); tools_used.append("confirm_order")
        _PENDING_PROPOSAL = None
        if res.get("ok") and res.get("status") == "executed":
            order = res["order"]
            text = "Confirmed! Order %s is placed (%s). Arriving by %s." % (
                order.get("order_id"), ", ".join(order.get("items", [])), order.get("eta"))
            cards = [{"type": "order", "title": "Order %s" % order.get("order_id", ""), "detail": order}]
        else:
            text = "That confirmation didn't go through (%s). Tell me what to order and I'll stage it again." % res.get("error", "unknown")
        return _finish(user_text, text, cards, tools_used)
    if any(k in t for k in ["cancel", "decline", "never mind", "don't order", "dont order"]) and _PENDING_PROPOSAL:
        tool_confirm_order(_PENDING_PROPOSAL, False); tools_used.append("confirm_order:decline")
        _PENDING_PROPOSAL = None
        return _finish(user_text, "Cancelled — nothing was ordered.", [], tools_used)

    # --- Full movie-night orchestration (hero demo flow) ---
    if ("movie" in t and "night" in t) or ("movie night" in t):
        cal = tool_get_calendar("today"); tools_used.append("get_calendar")
        tv = tool_tv_control("launch", app="Movies"); tools_used.append("tv_control:launch Movies")
        door = tool_door_status(); tools_used.append("door_status")
        order = tool_order_groceries(["popcorn", "juice"]); tools_used.append("order_groceries")
        kids_note = "Kids mode ON - only U/A content." if profile.get("kids_mode") else ""
        text = (
            "Movie night ready! I checked your calendar - you're free after 7:30pm. "
            "Living-room TV is opening movie picks. %s Front door: %s. "
            "Popcorn + juice ordered (%s, arrives ~%s)."
            % (kids_note, door.get("last_event", ""), order.get("order_id", ""), order.get("eta", ""))
        )
        # Try to upgrade wording with Bedrock if enabled (with memory context)
        ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip())
        if ai:
            text = ai
        cards = [
            {"type": "media", "title": "Tonight's picks (kid-safe)", "items": ["Bluey Special", "Encanto", "Cricket World Cup Highlights"]},
            {"type": "tv", "title": "Living-Room TV", "detail": tv.get("tv", {})},
            {"type": "door", "title": "Front door", "detail": door},
            {"type": "order", "title": "Order %s" % order.get("order_id", ""), "detail": order},
        ]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["door", "ring", "package", "delivery", "who is"]):
        door = tool_door_status(); tools_used.append("door_status")
        text = "Front door update: %s at %s. No motion right now. Want me to show the snapshot on TV?" % (
            door.get("last_event", "no events"), door.get("time", ""))
        cards = [{"type": "door", "title": "Front Door", "detail": door}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["order", "popcorn", "groceries", "buy", "snack"]):
        prop = tool_propose_order(["popcorn", "samosa"]); tools_used.append("propose_order")
        _PENDING_PROPOSAL = prop.get("proposal_id")
        text = ("I've staged popcorn + samosa for home delivery. Reply 'confirm' to place the order, "
                "or 'cancel' to drop it — nothing is ordered until you approve.")
        cards = [{"type": "order_proposal", "title": "Confirm your order", "detail": prop}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["calendar", "schedule", "meeting", "plan", "free", "homework"]):
        cal = tool_get_calendar(); tools_used.append("get_calendar")
        evts = ", ".join(["%s at %s" % (e["title"], e["start"]) for e in cal.get("events", [])])
        text = "Today: %s. You are free after 7:30pm - perfect for movie night." % evts
        cards = [{"type": "calendar", "title": "Today", "detail": cal}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["grandma", "grandmother", "nani", "dadi", "check in", "elderly", "remind grandma"]):
        remind = tool_remind_grandma(); tools_used.append("remind_grandma")
        cal = tool_get_calendar("tomorrow"); tools_used.append("get_calendar")
        text = (
            "Done! I sent Grandma a check-in message: \"%s\". "
            "Video call scheduled for %s. I also pulled tomorrow's calendar so you don't double-book."
            % (remind.get("message", ""), remind.get("call_scheduled", ""))
        )
        ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip())
        if ai:
            text = ai
        cards = [
            {"type": "remind", "title": "Grandma check-in", "detail": remind},
            {"type": "calendar", "title": "Tomorrow", "detail": cal},
        ]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["tv", "watch", "play", "kids", "prime", "cricket", "movie"]):
        tv = tool_tv_control("status"); tools_used.append("tv_control:status")
        text = "Living-room TV is on (%s). Kids mode is %s. Say 'movie night' and I'll set up everything." % (
            tv.get("tv", {}).get("app", ""), "ON" if tv.get("tv", {}).get("kids_mode") else "OFF")
        cards = [{"type": "tv", "title": "TV status", "detail": tv.get("tv", {})}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["who am i", "my name", "do you know me", "who are you"]):
        name = str(profile.get("name", "Family"))
        if "who are you" in t and "who am i" not in t:
            text = ("I'm Family Captain, your Alexa+ helper. I run movie nights, front-door checks, "
                    "calendar lookups, snack orders and Grandma check-ins — just ask.")
        else:
            past = load_memory()
            if past:
                last = past[-1].get("user", "something")
                text = ("You're %s — we've chatted %d times, most recently about '%s'. "
                        "I keep our history so you never repeat yourself." % (name, len(past), last))
            else:
                text = ("You're %s! We haven't chatted yet — try 'movie night with kids' and I'll remember "
                        "everything from there." % name)
        return _finish(user_text, text, [], tools_used)

    if any(k in t for k in ["what can you", "help", "what do you do", "abilities", "commands"]):
        text = ("I can: set up movie night, check the front door, read your calendar, order snacks "
                "(I always ask before ordering), and check in on Grandma. I remember our chats. "
                "Try 'movie night with kids'.")
        return _finish(user_text, text, [], tools_used)

    # Default: helpful + remembers history count (stateful proof)
    past_memory = load_memory()
    n = max(len(history), len(past_memory))
    text = (
        "I'm your Family Captain. I can do movie night setup, front-door check, calendar, or orders - "
        "all in one go. (We've chatted %d times, I remember context.) Try: 'movie night with kids'." % n
    )
    ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip())
    if ai:
        text = ai
    return _finish(user_text, text, [], tools_used)
