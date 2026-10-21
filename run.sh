#!/bin/bash
# Day-1 runner: installs deps, starts MCP server (:8001) + API+UI (:8000)
set -e
cd "$(dirname "$0")"
pip3 install -r requirements.txt
echo "Starting MCP server on :8001 ..."
(cd mcp-server && nohup python3 server.py > ../mcp.log 2>&1 & echo $! > ../mcp.pid)
sleep 2
echo "Starting API+UI on :8000 ..."
# no --reload: _PENDING_PROPOSAL is in-memory; a reload mid-demo kills staged orders
python3 -m uvicorn api.main:app --port 8000 &
API_PID=$!
echo $API_PID > api.pid
echo ""
echo "OPEN: http://127.0.0.1:8000"
echo "MCP:  http://127.0.0.1:8001/mcp  +  http://127.0.0.1:8001/health"
echo "Stop: kill $(cat mcp.pid) $API_PID"
wait $API_PID
