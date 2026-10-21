"""
Contract test for Family Captain MCP server and API.
Extract of the README contract test assertions.
"""
import os
import sys

_ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(_ROOT, "mcp-server"))
sys.path.insert(0, os.path.join(_ROOT, "api"))

try:
    from fastapi.testclient import TestClient
    from server import app as m
    from main import app as a

    c, c2 = TestClient(m), TestClient(a)
    assert c.get("/health").json()["protocol"] == "2025-11-25", "protocol != 2025-11-25"
    tools = c.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}).json()["result"]["tools"]
    assert len(tools) == 11, "expected 11 tools, got %d" % len(tools)
    hero = c2.post("/api/chat", json={"message": "movie night with kids"}).json()
    card_types = [x["type"] for x in hero["cards"]]
    assert card_types == ["media", "tv", "door", "order", "scene"], "expected cards ['media','tv','door','order','scene'], got %s" % card_types
    assert len(hero["tools_used"]) == 6, "expected 6 tools_used, got %d" % len(hero["tools_used"])
    print("ALL TESTS PASSED")
    sys.exit(0)
except AssertionError as e:
    print("Contract test assertion failed: %s" % e)
    sys.exit(1)
except Exception as e:
    print("Contract test error: %s" % e)
    sys.exit(1)
