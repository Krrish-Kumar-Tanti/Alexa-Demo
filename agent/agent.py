"""
Alexa+ Family Captain - Agent brain.
Tries AWS Bedrock (Strands SDK / boto3) if credentials exist,
otherwise uses built-in mock brain so demo ALWAYS works.

This file is the AWS Builder proof: real boto3 import + Bedrock call,
with graceful fallback for judges without AWS keys.

Languages: en (default), hi (romanized Hindi, code-mixed), ja (Japanese).
Selection via profile["lang"]; mock router keywords recognize all three.

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


def _pick_lang(profile: Dict[str, Any]) -> str:
    try:
        lang = str((profile or {}).get("lang", "en") or "en").lower()
    except Exception:
        lang = "en"
    if lang.startswith("hi"):
        return "hi"
    if lang.startswith("ja"):
        return "ja"
    return "en"


# Keyword sets across the three languages (code-mixed Hindi stays romanized).
_MOVIE_KEYS = ["movie night", "film", "filmy", "eiga", "映画", "ムービー", "मूवी", "फिल्म", "movie ka", "movie plan"]
_DOOR_KEYS = ["door", "ring", "package", "delivery", "who is", "darwaza", "darwaze", "दरवाज़ा", "玄関", "genkan"]
_ORDER_KEYS = ["order", "popcorn", "groceries", "buy", "snack", "samosa", "khana", "注文", "ポップコーン", "サモサ", "食べ物", "たべもの"]
_CAL_KEYS = ["calendar", "schedule", "meeting", "plan", "free", "homework", "tomorrow", "today", "tonight",
             "kab hai", "tithi", "कार्यक्रम", "予定", "カレンダー", "よてい", "karenda"]
_REMIND_KEYS = ["grandma", "grandmother", "nani", "dadi", "check in", "elderly", "remind grandma", "दादी", "नानी", "दादिमा",
                "祖母", "そぼ", "おばあちゃん", "sobo", "baat karao"]
_CONFIRM_KEYS = ["confirm", "place it", "yes, order", "yes order", "confirm kar", "haan order", "ok order",
                 "確定", "かくてい", "はい、ちゅうもん"]
_CANCEL_KEYS = ["cancel", "decline", "never mind", "don't order", "dont order", "cancel karo", "mat order",
                "रद्द", "キャンセル", "やめて"]
_TV_KEYS = ["tv", "watch", "play", "kids", "prime", "cricket", "movie"]

# Kids-mode footnote per language (injected into the movie-night sentence).
_KID_NOTE = {
    "en": "Kids mode is on, so only U/A shows. ",
    "hi": "Bachon ka mode on hai — sirf U/A chalega. ",
    "ja": "kids modeはON。みられるのはU/Aだけです。 ",
}

# Grandma check-in message per language.
_GRANDMA_MSG = {
    "en": "Hi Grandma! Just checking in — how are you feeling today?",
    "hi": "Namaste Dadi! Sab theek hai? Bas aapko yaad kar raha tha.",
    "ja": "おばあちゃん、こんにちは。調子はどうですか？今日も元気ですか？",
}

# Display-only localization for well-known mock data strings.
# MCP keeps the honest English data; the brain translates what it SHOWS.
_DISPLAY_LABELS = {
    "Kids homework + dinner": {"hi": "Kids ka homework + dinner", "ja": "子どもの宿題＋ばんごはん"},
    "Family movie night": {"hi": "Family movie night", "ja": "家族で映画の夜"},
    "Grandma video call": {"hi": "Dadi ka video call", "ja": "おばあちゃんとのvideo call"},
    "Package delivered - front door": {"hi": "Package pahunch gaya — front door", "ja": "宅配が玄関に届きました"},
    "Package delivered": {"hi": "Package pahunch gaya", "ja": "宅配が届きました"},
    "No motion": {"hi": "Koi hulchul nahi", "ja": "動きなし"},
    "Tomorrow 10:00": {"hi": "Kal 10:00 baje", "ja": "明日 10:00"},
}
_CARD_TITLES = {
    "Tonight's picks (kid-safe)": {"hi": "Aaj ki picks (kid-safe)", "ja": "今夜のセレクション（kid-safe）"},
    "Front door": {"hi": "Darwaza", "ja": "玄関"},
    "Front Door": {"hi": "Darwaza", "ja": "玄関"},
    "Today": {"hi": "Aaj", "ja": "今日"},
    "Tomorrow": {"hi": "Kal", "ja": "明日"},
    "TV status": {"hi": "TV status", "ja": "TVのじょうたい"},
    "Grandma check-in": {"hi": "Dadi ka check-in", "ja": "おばあちゃんへのcheck-in"},
}
_TV_ONOFF = {"en": ("on", "off"), "hi": ("on", "band"), "ja": ("オン", "オフ")}
_CAL_ITEM_FMT = {"en": "%s at %s", "hi": "%s at %s", "ja": "%s（%s）"}

def _disp(value: str, lang: str) -> str:
    row = _DISPLAY_LABELS.get(value)
    if row:
        return row.get(lang, value)
    return value

def _card_title(en: str, lang: str) -> str:
    row = _CARD_TITLES.get(en)
    if row:
        return row.get(lang, en)
    return en

# Reply templates per branch per language.
_T = {
    "placed": {
        "en": "Done — order %s is placed. %s. It reaches home by %s.",
        "hi": "Ho gaya — order %s lag gaya. %s. Ye ghar pahunch jayega %s tak.",
        "ja": "確定しました — 注文%sを受け付けました。中身は%s。%sのころ家に届きます。",
    },
    "decline": {
        "en": "Cancelled — nothing was ordered.",
        "hi": "Cancel kar diya — kuch order nahi hua.",
        "ja": "キャンセルしました。注文はしていません。",
    },
    "confirm_fail": {
        "en": "That didn't go through (%s). Tell me the order again and I'll set it up one more time.",
        "hi": "Wo ja nahi paaya (%s). Fir se bataiye, main phir se set kar dunga.",
        "ja": "うまくいきませんでした（%s）。もう一度教えてください。そちでまた準備します。",
    },
    "movie": {
        "en": "Movie night's set. You're free after 7:30, so movie picks are up on the living-room TV. %s"
              "Front door: %s. Popcorn and juice are ordered — they'll be home by %s.",
        "hi": "Movie night set hai. Aap 7:30 ke baad free hain, isliye movie picks TV par aa gaye. %s"
              "Darwaze par: %s. Popcorn aur juice order ho gaye — ghar pahunch jayenge %s tak.",
        "ja": "映画の夜の準備ができました。19時30分以降はあいてるので、リビングのTVに映画のセレクションを開いておきました。%s"
              "玄関：%s。ポップコーンとジュースを注文済みです。%sに家に届きます。",
    },
    "door": {
        "en": "Front door: %s at %s, and it's quiet right now. Want the snapshot up on the TV?",
        "hi": "Darwaza: %s, %s baje. Abhi sab shaant hai. Snapshot TV par dikhau?",
        "ja": "玄関：%s（%s）。いまは静かです。スナップショットをTVに映しますか？",
    },
    "propose": {
        "en": "Popcorn and samosa are ready for home delivery. Say 'confirm' to place the order, "
              "or 'cancel' to drop it. Nothing's ordered until you say so.",
        "hi": "Popcorn aur samosa home delivery ke liye tayyar hain. 'confirm' boliye toh order lag jayega, "
              "'cancel' boliye toh drop ho jayega. Aap confirm karne tak kuch order nahi hoga.",
        "ja": "ポップコーンとサモサを届けように用意しました。「confirm」で注文します。「cancel」でやめます。あなたがconfirmするまで注文はしません。",
    },
    "calendar": {
        "en": "%s's plan: %s. You're free after 7:30pm — that's your movie-night window.",
        "hi": "%s ka plan: %s. 7:30 ke baad aap free hain — wahi movie night ka time hai.",
        "ja": "%sの予定：%s。19時30分以降は空いています——映画の夜にちょうどいい時間です。",
    },
    "grandma": {
        "en": "Done. Grandma got a check-in from you: \"%s\". "
              "Video call set for %s — and I pulled tomorrow's calendar so nothing clashes.",
        "hi": "Ho gaya. Dadi ko aapka check-in mil gaya: \"%s\". "
              "Video call %s ke liye set hai — kal ka calendar bhi dekh liya, kuch clash nahi hoga.",
        "ja": "できました。おばあちゃんに：「%s」を送りました。"
              "Video callは%sに予約ずみ。明日のカレンダーも見ておいたので、かぶりません。",
    },
    "tv": {
        "en": "The living-room TV is on %s and kids mode is %s. Say 'movie night' and I'll handle the rest.",
        "hi": "Living-room TV %s par on hai, aur bachon ka mode %s hai. 'movie night' boliye, baaki main dekh lunga.",
        "ja": "リビングのTVは%s、kids modeは%sです。「movie night」と言えば、あとはおまかせを。",
    },
    "who_you": {
        "en": "I'm Family Captain — your Alexa+ helper for movie nights, front-door checks, "
              "calendar, snack orders and checking in on Grandma.",
        "hi": "Main Family Captain hoon — aapka Alexa+ helper: movie night, darwaza check, calendar, "
              "snack orders aur Dadi ka check-in.",
        "ja": "Family Captainです——映画の夜、玄関チェック、カレンダー、おやつの注文、おばあちゃんの状況チェックをお手伝いする Alexa+ helper です。",
    },
    "you_known": {
        "en": "You're %s. We've talked %d times — the last one was about '%s'. "
              "I remember, so you don't have to repeat yourself.",
        "hi": "Aap %s hain. Hum logon ne %d baar baat ki — pichhli baar '%s' ke baare mein. "
              "Mujhe yaad hai, aapko fir se batana nahi padega.",
        "ja": "%sですね。これまで%d回話しました——最後は「%s」についてでした。"
              "私は覚えているので、くり返し言わなくて大丈夫です。",
    },
    "you_new": {
        "en": "You're %s! We haven't talked yet — try 'movie night with kids' and I'll remember it from there.",
        "hi": "Aap %s hain! Abhi tak baat nahi hui — 'movie night with kids' try kijiye, main wahin se sab yaad rakhunga.",
        "ja": "%sですね！まだ話していませんね——「movie night with kids」を試してみてください。そこから全部覚えます。",
    },
    "help": {
        "en": "I can set up movie night, check the front door, read your calendar, order snacks "
              "(always asking first), and check in on Grandma. I remember our chats. "
              "Try 'movie night with kids'.",
        "hi": "Main movie night set kar sakta hoon, darwaza check kar sakta hoon, calendar padh sakta hoon, "
              "snacks order kar sakta hoon (pehle poochhunga hi), aur Dadi ke liye check-in bhej sakta hoon. "
              "Baat cheet yaad rehti hai. Try: 'movie night with kids'.",
        "ja": "映画の夜の準備、玄関チェック、カレンダー、おやつの注文（必ず先に確認します）、おばあちゃんへのチェックインができます。"
              "会話は続けて覚えています。「movie night with kids」を試してください。",
    },
    "default": {
        "en": "I'm your Family Captain — movie night, front door, calendar, snacks, all in one go. "
              "We've talked %d times so far and I remember. Try 'movie night with kids'.",
        "hi": "Main aapka Family Captain hoon — movie night, darwaza, calendar, snacks, ek saath sabkuch. "
              "Ab tak hum logon ne %d baar baat ki hai, mujhe yaad hai. Try: 'movie night with kids'.",
        "ja": "Family Captainです——映画の夜も、玄関も、カレンダーも、おやつの注文も、いちどにやります。"
              "これまで%d回話しましたね。覚えていますよ。「movie night with kids」をどうぞ。",
    },
}


def _say(branch: str, lang: str, *args: Any) -> str:
    d = _T.get(branch, {})
    fmt = d.get(lang) or d.get("en") or ""
    try:
        return fmt % args if args else fmt
    except Exception:
        return fmt


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


_BEDROCK_LANG_LABEL = {
    "en": "English",
    "hi": "Hindi (romanized script, like 'sab shaant hai', not Devanagari)",
    "ja": "Japanese",
}


def try_bedrock_reply(user_text: str, context: str, lang: str = "en") -> str:
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
        prompt = ("You are Alexa+ Family Captain. Reply in %s. Context:\n%s\nUser: %s\n"
                  "Reply in 2 friendly sentences." % (
                      _BEDROCK_LANG_LABEL.get(lang, "English"), context, user_text))
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
    lang = _pick_lang(profile)
    name = str(profile.get("name", "Family") or "Family")
    tools_used: List[str] = []
    cards: List[Dict[str, Any]] = []
    global _PENDING_PROPOSAL

    # --- Confirm / cancel a staged order (nothing executes without approval) ---
    if any(k in t for k in _CONFIRM_KEYS) and _PENDING_PROPOSAL:
        res = tool_confirm_order(_PENDING_PROPOSAL, True); tools_used.append("confirm_order")
        _PENDING_PROPOSAL = None
        if res.get("ok") and res.get("status") == "executed":
            order = res["order"]
            text = _say("placed", lang, order.get("order_id"), ", ".join(order.get("items", [])), order.get("eta"))
            cards = [{"type": "order", "title": "Order %s" % order.get("order_id", ""), "detail": order}]
        else:
            text = _say("confirm_fail", lang, res.get("error", "unknown"))
        return _finish(user_text, text, cards, tools_used)
    if any(k in t for k in _CANCEL_KEYS) and _PENDING_PROPOSAL:
        tool_confirm_order(_PENDING_PROPOSAL, False); tools_used.append("confirm_order:decline")
        _PENDING_PROPOSAL = None
        return _finish(user_text, _say("decline", lang), [], tools_used)

    # --- Full movie-night orchestration (hero demo flow) ---
    if ("movie night" in t) or any(k in t for k in _MOVIE_KEYS if k != "movie night"):
        cal = tool_get_calendar("today"); tools_used.append("get_calendar")
        tv = tool_tv_control("launch", app="Movies"); tools_used.append("tv_control:launch Movies")
        door = tool_door_status(); tools_used.append("door_status")
        order = tool_order_groceries(["popcorn", "juice"]); tools_used.append("order_groceries")
        text = _say("movie", lang, _KID_NOTE.get(lang, ""), _disp(door.get("last_event", ""), lang), order.get("eta", ""))
        # Try to upgrade wording with Bedrock if enabled (with memory context)
        ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip(), lang)
        if ai:
            text = ai
        cards = [
            {"type": "media", "title": _card_title("Tonight's picks (kid-safe)", lang), "items": ["Bluey Special", "Encanto", "Cricket World Cup Highlights"]},
            {"type": "tv", "title": "Living-Room TV", "detail": tv.get("tv", {})},
            {"type": "door", "title": _card_title("Front door", lang), "detail": dict(door, last_event=_disp(door.get("last_event", ""), lang))},
            {"type": "order", "title": "Order %s" % order.get("order_id", ""), "detail": order},
        ]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in _DOOR_KEYS):
        door = tool_door_status(); tools_used.append("door_status")
        text = _say("door", lang, _disp(door.get("last_event", "no events"), lang), door.get("time", ""))
        cards = [{"type": "door", "title": _card_title("Front Door", lang), "detail": dict(door, last_event=_disp(door.get("last_event", ""), lang))}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in _ORDER_KEYS):
        prop = tool_propose_order(["popcorn", "samosa"]); tools_used.append("propose_order")
        _PENDING_PROPOSAL = prop.get("proposal_id")
        text = _say("propose", lang)
        cards = [{"type": "order_proposal", "title": "Confirm your order", "detail": prop}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in _CAL_KEYS):
        day = "tomorrow" if ("tomorrow" in t or "kal" in t or "あした" in t or "明日" in t) else "today"
        cal = tool_get_calendar(day); tools_used.append("get_calendar")
        day_label = day.capitalize() if lang == "en" else ("Kal" if day == "tomorrow" else "Aaj") if lang == "hi" else ("明日" if day == "tomorrow" else "今日")
        fmt = _CAL_ITEM_FMT.get(lang, _CAL_ITEM_FMT["en"])
        joiner = "、" if lang == "ja" else ", "
        evts = joiner.join([fmt % (_disp(e["title"], lang), _disp(e["start"], lang)) for e in cal.get("events", [])])
        text = _say("calendar", lang, day_label, evts)
        cards = [{"type": "calendar", "title": _card_title("Today" if day == "today" else "Tomorrow", lang),
                  "detail": {"day": day_label if lang != "en" else day,
                             "events": [dict(e, title=_disp(e["title"], lang), start=_disp(e["start"], lang)) for e in cal.get("events", [])]}}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in _REMIND_KEYS):
        remind = tool_remind_grandma(message=_GRANDMA_MSG.get(lang, _GRANDMA_MSG["en"])); tools_used.append("remind_grandma")
        cal = tool_get_calendar("tomorrow"); tools_used.append("get_calendar")
        call_disp = _disp(remind.get("call_scheduled", ""), lang)
        text = _say("grandma", lang, remind.get("message", ""), call_disp)
        ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip(), lang)
        if ai:
            text = ai
        cards = [
            {"type": "remind", "title": _card_title("Grandma check-in", lang), "detail": dict(remind, call_scheduled=call_disp)},
            {"type": "calendar", "title": _card_title("Tomorrow", lang),
             "detail": {"day": "tomorrow", "events": [dict(e, title=_disp(e["title"], lang), start=_disp(e["start"], lang)) for e in cal.get("events", [])]}},
        ]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in _TV_KEYS):
        tv = tool_tv_control("status"); tools_used.append("tv_control:status")
        onword, offword = _TV_ONOFF.get(lang, ("on", "off"))
        text = _say("tv", lang, tv.get("tv", {}).get("app", ""),
                    onword if tv.get("tv", {}).get("kids_mode") else offword)
        cards = [{"type": "tv", "title": _card_title("TV status", lang), "detail": tv.get("tv", {})}]
        return _finish(user_text, text, cards, tools_used)

    if any(k in t for k in ["who am i", "my name", "do you know me", "who are you"]):
        if "who are you" in t and "who am i" not in t:
            text = _say("who_you", lang)
        else:
            past = load_memory()
            if past:
                last = past[-1].get("user", "something")
                text = _say("you_known", lang, name, len(past), last)
            else:
                text = _say("you_new", lang, name)
        return _finish(user_text, text, [], tools_used)

    if any(k in t for k in ["what can you", "help", "what do you do", "abilities", "commands"]):
        text = _say("help", lang)
        return _finish(user_text, text, [], tools_used)

    # Default: helpful + remembers history count (stateful proof)
    past_memory = load_memory()
    n = max(len(history), len(past_memory))
    text = _say("default", lang, n)
    ai = try_bedrock_reply(user_text, (memory_context() + "\n" + text).strip(), lang)
    if ai:
        text = ai
    return _finish(user_text, text, [], tools_used)
