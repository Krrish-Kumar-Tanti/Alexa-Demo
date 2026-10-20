#!/bin/bash
# Stop all Family Captain servers on ports 8000 and 8001
echo "Stopping servers on ports 8000 (API/UI) and 8001 (MCP)..."
lsof -ti:8000,8001 | xargs kill -9 2>/dev/null || true
rm -f api.pid mcp.pid
echo "✓ All servers stopped successfully."
