#!/usr/bin/env bash
set -euo pipefail

PORT=3000
BASE="http://localhost:$PORT"

kill_port() {
  lsof -ti:"$PORT" 2>/dev/null | xargs kill -9 2>/dev/null || true
}

cleanup() {
  echo ""
  kill_port
  echo "Server stopped"
  exit 0
}

start() {
  kill_port
  trap cleanup SIGINT SIGTERM

  echo "Starting dev server on port $PORT..."
  npm run dev &
  DEV_PID=$!

  for i in $(seq 1 30); do
    if curl -s "$BASE" > /dev/null 2>&1; then
      echo "Server ready at $BASE"
      echo "Dashboard: $BASE/dashboard"
      echo ""
      echo "Press Ctrl+C to stop"
      wait $DEV_PID
      return 0
    fi
    sleep 1
  done

  echo "Server failed to start within 30s"
  kill $DEV_PID 2>/dev/null
  return 1
}

stop() {
  kill_port
  echo "Server stopped"
}

run() {
  local prompt="${1:-Create a simple blog post outline}"
  echo "Starting run: \"$prompt\""
  local response
  response=$(curl -s -X POST "$BASE/api/run" \
    -H "Content-Type: application/json" \
    -d "{\"prompt\": \"$prompt\"}")

  local run_id
  run_id=$(echo "$response" | python3 -c "import json,sys; print(json.load(sys.stdin)['runId'])" 2>/dev/null)

  if [ -z "$run_id" ]; then
    echo "Failed to start run: $response"
    return 1
  fi

  echo "Run ID: $run_id"
  echo ""
  echo "Watching events (Ctrl+C to stop)..."
  echo "---"
  curl -sN "$BASE/api/run/events?runId=$run_id" | while IFS= read -r line; do
    if [[ "$line" == data:* ]]; then
      local data="${line#data: }"
      local type
      type=$(echo "$data" | python3 -c "import json,sys; print(json.load(sys.stdin).get('type',''))" 2>/dev/null)
      local payload
      payload=$(echo "$data" | python3 -c "
import json,sys
d=json.load(sys.stdin)
p=d.get('payload',{})
t=d.get('type','')
if t=='AGENT_SPAWNED': print(f\"  {p.get('name','')} ({p.get('role','')})\")
elif t=='AGENT_STATUS': print(f\"  → {p.get('status','')}\")
elif t=='AGENT_PROGRESS': print(f\"  {p.get('progress','')} ({p.get('percentage','')}%)\")
elif t=='AGENT_MESSAGE': print(f\"  {p.get('summary','')}\")
elif t=='ARTIFACT_CREATED': print(f\"  {p.get('name','')}\")
elif t=='APPROVAL_REQUIRED': print(f\"  ⚠ {p.get('title','')} [proposalId={p.get('proposalId','')}]\")
elif t=='RUN_COMPLETED': print(f\"  {p.get('status','')} — {p.get('summary','')}\")
elif t=='ERROR': print(f\"  {p.get('message','')}\")
elif t=='RUN_CREATED': print(f\"  {p.get('prompt','')}\")
elif t=='connected': print('')
else: print(f'  {json.dumps(p)[:80]}')
" 2>/dev/null)

      [ -n "$type" ] && [ "$type" != "connected" ] && printf "%-22s %s\n" "$type" "$payload"
    fi
  done
}

approve() {
  local proposal_id="$1"
  curl -s -X POST "$BASE/api/proposals/$proposal_id/approve" \
    -H "Content-Type: application/json" | python3 -m json.tool
}

reject() {
  local proposal_id="$1"
  local reason="${2:-Rejected by user}"
  curl -s -X POST "$BASE/api/proposals/$proposal_id/reject" \
    -H "Content-Type: application/json" \
    -d "{\"reason\": \"$reason\"}" | python3 -m json.tool
}

status() {
  local run_id="$1"
  curl -s "$BASE/api/run/$run_id" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f\"Status: {d['status']}\")
print(f\"Agents ({len(d.get('agents',[]))}):\")
for a in d.get('agents',[]):
    print(f\"  {a['name']:15} {a['status']}\")
print(f\"Artifacts ({len(d.get('artifacts',[]))}):\")
for a in d.get('artifacts',[]):
    print(f\"  {a['name']}\")
"
}

pending() {
  curl -s "$BASE/api/proposals" | python3 -c "
import json,sys
proposals=json.load(sys.stdin)
if not proposals:
    print('No pending proposals')
    sys.exit()
for p in proposals:
    print(f\"{p['id'][:8]}  {p.get('title','')}  [{p.get('risk','')}]  {p.get('status','')}\")
    print(f\"  Full ID: {p['id']}\")
"
}

case "${1:-start}" in
  start|"")  start ;;
  stop)      stop ;;
  run)       run "${2:-}" ;;
  approve)   approve "$2" ;;
  reject)    reject "$2" "${3:-}" ;;
  status)    status "$2" ;;
  pending)   pending ;;
  help|-h|--help)
    cat <<EOF
Usage: ./dev.sh [command]

  (no args)                Start dev server (Ctrl+C to stop)
  stop                     Force stop dev server
  run [prompt]             Start a run and stream events live
  approve <proposal-id>    Approve a pending proposal
  reject  <proposal-id>    Reject a pending proposal
  status  <run-id>         Check run status
  pending                  List pending proposals

Example:
  ./dev.sh
  # in another terminal:
  ./dev.sh run "Write a product launch plan"
  ./dev.sh approve <proposal-id>
EOF
    ;;
  *)
    echo "Unknown command: $1 (try ./dev.sh help)"
    exit 1
    ;;
esac
