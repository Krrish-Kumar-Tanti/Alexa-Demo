#!/bin/bash
# Dev runner with --reload: installs deps, starts MCP server (:8001) + API+UI (:8000)
set -e
cd "$(dirname "$0")"
python3 -c "import fastapi, uvicorn, pydantic" 2>/dev/null || pip3 install -r requirements.txt
echo "Starting MCP server on :8001 ..."
python3 mcp-server/server.py > mcp.log 2>&1 &
echo $! > mcp.pid
sleep 2
echo "Starting API+UI on :8000 (dev mode with reload) ..."
python3 -m uvicorn api.main:app --port 8000 --reload &
API_PID=$!
echo $API_PID > api.pid
echo ""
echo "OPEN: http://127.0.0.1:8000"
echo "MCP:  http://127.0.0.1:8001/mcp  +  http://127.0.0.1:8001/health"
echo "Stop: kill $(cat mcp.pid) $API_PID"
wait $API_PID
