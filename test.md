# GlassBox Test Plan

Manual and automated test plan for the full GlassBox application. Intended for an AI testing agent.

---

## Prerequisites

### Environment Setup

```bash
# 1. Install dependencies
npm install
npx playwright install chromium

# 2. Copy env and fill in keys
cp .env.example .env.local
```

Required env vars in `.env.local`:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_TAMBO_API_KEY` | Yes | Tambo API key (client-side) |
| `GEMINI_API_KEY` | Yes | Google Gemini API key (server-side) |
| `GLASSBOX_ADMIN_TOKEN` | No | If set, enables auth. Leave unset for easier testing. |

```bash
# 3. Start dev server
npm run dev
# App runs at http://localhost:3000
```

### Database

- SQLite file `sqlite.db` auto-creates at project root on first run
- No migration commands needed — schema auto-syncs via Drizzle
- Delete `sqlite.db` to reset all data

---

## Automated Tests

### Unit Tests (Vitest)

```bash
npm test
```

Expected: 10/10 tests pass. Covers:
- SSE endpoint validation (400 without runId, 200 with proper headers)
- Approval transaction concurrency (optimistic locking)
- Auth via proxy (cookie-based, `/api/auth/check` endpoint)
- No `middleware.ts` exists (uses `proxy.ts` instead)
- SwarmEventBridge deduplication and cleanup on runId change

### E2E Tests (Playwright)

```bash
# Dev server must be running on :3000
npm run test:e2e

# Or with browser visible:
npm run test:e2e:headed

# Or with Playwright UI:
npm run test:e2e:ui
```

Expected: All tests in `e2e/landing.spec.ts`, `e2e/dashboard.spec.ts`, `e2e/run-flow.spec.ts` pass.

Config notes:
- 60s global timeout (cold Turbopack compilation is slow)
- Chromium only
- CI: 1 worker, 2 retries, trace on first retry

### Type Check

```bash
npx tsc --noEmit
```

Expected: 0 errors.

### Lint

```bash
npx eslint src/ app/
```

Expected: 0 errors, 0 warnings.

---

## Manual Test Scenarios

### 1. Landing Page (`/`)

**Steps:**
1. Open `http://localhost:3000`
2. Verify hero section: heading "Agent Swarm Mission Control", subheading text, two CTA buttons
3. Scroll to Features section (`#features`): verify 4 cards — "Graph Viz", "Human Loop", "Generative UI", "Event Timeline"
4. Scroll to How it Works section (`#how-it-works`): verify 4 steps — Define Objective, Swarm Deploys, Review & Approve, Artifact Delivery
5. Verify animated SVG preview shows 4 agent nodes (Orchestrator, Research, Code, Audit) with pulsing edges
6. Verify status legend below SVG: Thinking (blue), Acting (violet), Done (green), Waiting (amber)
7. Click "Launch Mission Control" or "Start Simulation" — should navigate to `/dashboard`
8. Verify footer text: "Built for Tambo Hackathon 2026"

**Expected:** All content renders, animations play, navigation works.

---

### 2. Dashboard — Empty State (`/dashboard`)

**Steps:**
1. Open `http://localhost:3000/dashboard`
2. Wait for prompt input to appear (may take up to 60s on cold start)
3. Verify header: GlassBox logo (links to `/`), "Mission Control" label
4. Verify connection badge shows "OFFLINE" (gray) — no run active
5. Verify prompt input with placeholder text containing "mission" and "Cmd+K"
6. Verify "Initialize Swarm" button is disabled (empty input)
7. Verify 4 sample mission cards below input:
   - Blog Post (pencil icon)
   - Product Launch (rocket icon)
   - API Design (code icon)
   - Security Audit (shield icon)
8. Verify left panel shows empty state overlay: "Launch a mission to see agents come alive"
9. Verify SwarmGraph container exists (`data-testid="swarm-graph"`) with ReactFlow inside
10. Verify middle panel has "Generative" and "Console" tabs
11. Verify Generative tab shows: "AI Components" + "Tambo will render components here"
12. Click "Console" tab — verify: "No actionable items yet" + "Proposals and artifacts will appear here"
13. Verify right panel "Event Timeline" heading with "No events recorded."
14. Verify agent status panel shows "No agents spawned yet"

**Expected:** Clean empty state, all panels render, tabs switch correctly.

---

### 3. Sample Mission Cards

**Steps:**
1. On dashboard, click the "Blog Post" sample card
2. Verify input fills with: "Write a technical blog post about building AI agent swarms with human-in-the-loop oversight"
3. Verify "Initialize Swarm" button becomes enabled
4. Clear input, click "Product Launch" card — verify different prompt fills
5. Clear input, click "API Design" card — verify fills
6. Clear input, click "Security Audit" card — verify fills

**Expected:** Each card fills the input with its specific prompt text. Button enables.

---

### 4. Keyboard Shortcuts

**Steps:**
1. On dashboard, click somewhere else (blur the input)
2. Press `Cmd+K` (Mac) or `Ctrl+K` (Windows/Linux)
3. Verify the prompt input gains focus
4. Type some text, press `Escape`
5. Verify the input blurs (loses focus)

**Expected:** Cmd+K focuses input, Escape blurs it.

---

### 5. Full Run — Happy Path

This is the core test. Requires valid `GEMINI_API_KEY`.

**Steps:**
1. On dashboard, type or select a prompt (e.g. "Write a blog post about AI agents")
2. Click "Initialize Swarm"
3. Verify immediately:
   - Sample mission cards disappear
   - "Initialize Swarm" button replaced by "Cancel" and "Reset" buttons
   - Connection badge changes to "LIVE" (green, pulsing)
   - Run ID appears in header: `RUN: xxxxxxxx`
   - Timer starts counting (blue Timer icon + seconds)
   - Empty state overlay disappears from graph panel
4. Watch the SwarmGraph:
   - Orchestrator node should already be present
   - New agent nodes spawn as the orchestrator delegates (researcher, builder, auditor)
   - Edges connect child agents to their parents
   - Node status colors change: idle (gray) → thinking (blue) → acting (violet) → done (green)
   - Edges pulse with animation when agents are communicating
   - Graph auto-fits viewport when new nodes appear
5. Watch Agent Status Panel:
   - Agent count badge updates
   - Active/done counts update in real-time
   - Each agent shows role icon, name, status badge
   - Status badges change color as agents progress
6. Watch the Event Timeline (right panel):
   - Events appear chronologically with timestamps
   - Different event types have colored icons (blue for agent, amber for approval, green for artifact, red for error)
   - "Action Required" badges appear for approval events
7. Watch LLM Metrics (header bar):
   - Shows call count, token count, estimated cost
   - Updates every 2 seconds during run
8. Wait for run completion:
   - Timer stops
   - "Cancel" button disappears
   - "Export" and "Reset" buttons appear
   - Connection badge may go to "OFFLINE" (SSE closes)
9. Click "Export":
   - New tab opens with YAML export of the run
   - Verify it contains: version, run metadata, agents list, artifacts list, event counts

**Expected:** Full run lifecycle works end-to-end. Graph animates, events stream, metrics update, run completes.

---

### 6. Run Cancellation

**Steps:**
1. Start a new run with any prompt
2. Wait for at least one agent to spawn (watch for nodes in graph)
3. Click "Cancel" button
4. Verify:
   - Run stops (no new events)
   - Status changes to failed
   - "Export" and "Reset" buttons appear
   - Timer stops
5. Alternative: start a run, then press `Escape` — should also cancel

**Expected:** Run cancels cleanly. UI reflects stopped state.

---

### 7. Run Reset

**Steps:**
1. After a completed or cancelled run, click "Reset"
2. Verify:
   - Run ID clears from header
   - Timer disappears
   - Metrics clear from header
   - Graph returns to single Orchestrator node
   - Empty state overlay reappears
   - Sample mission cards reappear
   - Event timeline clears
   - Agent status panel shows "No agents spawned yet"
   - "Initialize Swarm" button reappears (disabled until text entered)

**Expected:** Full state reset to initial empty dashboard.

---

### 8. Agent Click-to-Focus

**Steps:**
1. During or after a run with multiple agents
2. Click an agent card in the Agent Status Panel
3. Verify:
   - Graph pans and zooms to center on that agent's node
   - The node briefly glows/highlights (2-second highlight effect)
   - Middle panel switches to "Generative" tab

**Expected:** Graph focuses on selected agent, brief visual highlight.

---

### 9. Human-in-the-Loop Approval

**Steps:**
1. Start a run (builder agents typically generate approval proposals)
2. Switch to "Console" tab in middle panel
3. Wait for an `ActionProposalCard` to appear with:
   - Risk badge (low/medium/high/critical, color-coded)
   - Title and rationale text
   - Diff preview (before/after sections)
   - "Approve Action" (green) and "Reject" (red) buttons
4. Also check Event Timeline for "Action Required" badge on the approval event
5. Click "Approve Action":
   - Button should show approved state
   - Agent should continue execution (status changes from waiting → acting → done)
   - `APPROVAL_GRANTED` event appears in timeline
6. For rejection test: start another run, wait for proposal, click "Reject"
   - Agent enters rejected state
   - `APPROVAL_REJECTED` event appears in timeline

**Note:** If no proposals appear within 60 seconds, they auto-reject (timeout).

**Expected:** Proposals render with full details. Approve/reject work and unblock the agent.

---

### 10. Tambo Generative UI Components

**Steps:**
1. During a run, watch the "Generative" tab in the middle panel
2. As events flow, Tambo should render components in the thread:
   - `RunProgressCard` — progress bar, agent statuses, token count
   - `TaskPlanCard` — step list with status dots
   - `AgentMessageCard` — agent messages with role icons
   - `ArtifactViewer` — code/text viewer with copy button
   - `MetricsSummary` — appears on run completion with token breakdown
   - `AuditSummary` — appears if auditor runs successfully
3. Verify streaming indicator appears while Tambo generates components:
   - "Selecting component...", "Fetching context...", "Generating props...", "Streaming..."
4. Verify components show loading skeletons before props arrive (shimmer placeholders)
5. Verify auto-scroll: thread scrolls to bottom as new messages appear

**Expected:** Multiple Tambo component types render throughout the run lifecycle.

---

### 11. Tambo Suggestions

**Steps:**
1. After assistant messages appear in the Generative thread
2. Look for suggestion buttons at the bottom of the thread
3. Click a suggestion button
4. Verify it auto-submits the suggestion as a message to Tambo
5. Verify Tambo responds with an appropriate component

**Expected:** Suggestions appear and are actionable.

---

### 12. Tambo Thread History

**Steps:**
1. Complete at least 2 separate runs (reset between them)
2. In the Generative tab, look for a thread sidebar (only visible with 2+ threads)
3. Verify thread list shows up to 5 past threads with "History" label
4. Click a previous thread
5. Verify the thread content switches to show the old conversation
6. Current thread should be visually highlighted

**Expected:** Thread history enables navigating between past conversations.

---

### 13. Export — JSON Format

**Steps:**
1. After a completed run, instead of clicking the "Export" button in the UI, manually navigate to:
   `http://localhost:3000/api/run/{runId}/export?format=json`
2. Verify JSON response contains:
   - `version: "1.0"`
   - `exportedAt` timestamp
   - `run` object (id, prompt, status, createdAt, completedAt, durationMs)
   - `agents` array (id, name, role, status, parentId)
   - `artifacts` array (id, name, content, contentType, agentId)
   - `events` array (id, type, agentId, payload, timestamp)
   - `proposals` array (if any)
   - `approvals` array (if any)
3. Click the "Export" button in the UI — verify it downloads a YAML file (`run-xxxxxxxx.yaml`)

**Expected:** Both JSON and YAML exports return complete run data.

---

### 14. Export — YAML Format (default)

**Steps:**
1. After a completed run, navigate to: `http://localhost:3000/api/run/{runId}/export`
2. Verify Content-Disposition header: `attachment; filename="run-xxxxxxxx.yaml"`
3. Verify YAML structure includes: version, run, agents, artifacts, events (with total and byType counts)

**Expected:** Default export is YAML with download filename.

---

### 15. Replay Endpoint

**Steps:**
1. After a completed run, navigate to: `http://localhost:3000/api/run/{runId}/replay`
2. Verify JSON response contains:
   - `runId`
   - `totalEvents` (number)
   - `durationMs` (number)
   - `events` array where each event has a `delayMs` field (relative to first event)
3. Verify first event has `delayMs: 0`
4. Verify subsequent events have increasing `delayMs` values

**Expected:** Replay data includes timing offsets for time-travel playback.

---

### 16. Error Boundary

**Steps:**
1. This is hard to trigger manually. Verify by inspection:
   - The SwarmGraph is wrapped in an `ErrorBoundary` with title "Graph rendering error"
   - The TamboThread is wrapped in an `ErrorBoundary` with title "Generative output error"
2. If a render error occurs, verify:
   - Error message is displayed with red styling
   - "Try Again" button appears
   - Clicking "Try Again" resets the error boundary and re-renders the component

**Expected:** Error boundaries catch render crashes and offer recovery.

---

### 17. Graph Interactions

**Steps:**
1. During or after a run with multiple nodes:
2. **Pan**: Click and drag on the graph background — graph should pan
3. **Zoom**: Scroll wheel on graph — graph should zoom in/out
4. **Controls**: Click zoom-in, zoom-out, fit-view buttons in bottom-left control bar
5. **MiniMap**: Verify bottom-right minimap shows node overview with status-based colors:
   - Blue: thinking/acting agents
   - Green: done agents
   - Red: error agents
   - Amber: waiting agents
   - Gray: idle agents
6. **Node appearance**: Verify custom agent nodes show:
   - Role icon (target/magnifier/hammer/shield)
   - Agent name
   - Status badge with color
   - Pulse animation on active nodes (thinking, acting, waiting)
   - Glow effect on thinking/acting/escalated nodes
   - Token count badge (if available)

**Expected:** Full ReactFlow interactivity, custom styled nodes and edges.

---

### 18. Authentication (optional — requires `GLASSBOX_ADMIN_TOKEN`)

**Steps:**
1. Set `GLASSBOX_ADMIN_TOKEN=test-secret-123` in `.env.local`
2. Restart dev server
3. Open `http://localhost:3000/dashboard`
4. Verify a login modal overlay appears
5. Enter wrong token — verify error message, verify rate limit after 5 attempts
6. Enter correct token (`test-secret-123`) — verify modal dismisses, dashboard loads
7. Verify "Logout" button appears in header
8. Click "Logout" — verify login modal reappears
9. Verify API endpoints return 401 without the token cookie

**Steps for API auth testing:**
```bash
# Without auth — should get 401
curl http://localhost:3000/api/metrics

# With auth — should get 200
curl -H "Authorization: Bearer test-secret-123" http://localhost:3000/api/metrics

# Auth check
curl http://localhost:3000/api/auth/check
# Returns: { "authRequired": true, "authenticated": false }
```

**Expected:** Auth gates all API routes except login/logout/check. Cookie persists 7 days.

---

### 19. Rate Limiting

**Steps:**
```bash
# Run creation: limit 10/60s
for i in {1..12}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/run \
    -H "Content-Type: application/json" \
    -d '{"prompt":"test"}'
done
# First 10 should return 200, last 2 should return 429

# Login: limit 5/60s (if GLASSBOX_ADMIN_TOKEN is set)
for i in {1..7}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"token":"wrong"}'
done
# First 5 return 401, last 2 return 429
```

**Expected:** Rate limits trigger 429 responses with `Retry-After` header.

---

### 20. SSE Event Stream

**Steps:**
```bash
# Missing runId — should return 400
curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/api/run/events"

# With runId — should return 200 with SSE headers
curl -N -H "Accept: text/event-stream" "http://localhost:3000/api/run/events?runId=some-id"
# First frame: data: {"type":"connected"}
# Then historical events replay
# Then heartbeat every 30s: ": heartbeat"
```

**Expected:** SSE validates input, streams events, sends heartbeats.

---

### 21. Concurrent Approval Race Condition

**Steps:**
1. Start a run that produces approval proposals
2. Note the proposal ID from the event
3. Simultaneously send two approve requests:
```bash
curl -X POST http://localhost:3000/api/proposals/{id}/approve &
curl -X POST http://localhost:3000/api/proposals/{id}/approve &
wait
```
4. One should succeed (200), the other should fail (400) with "was already processed by another request"

**Expected:** Optimistic concurrency prevents double-approval.

---

### 22. Approval Timeout

**Steps:**
1. Start a run that produces proposals
2. Do NOT click approve or reject
3. Wait 60 seconds
4. Verify:
   - Proposal auto-rejects with reason "Auto-rejected: approval timed out after 60s"
   - Agent enters rejected state
   - `APPROVAL_REJECTED` event appears in timeline

**Expected:** Proposals don't hang forever. Auto-reject after 60s.

---

## API Endpoint Reference

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/run` | Create a new run |
| `GET` | `/api/run/[id]` | Get run status + agents + artifacts + events |
| `DELETE` | `/api/run/[id]` | Cancel a running run |
| `GET` | `/api/run/events?runId=` | SSE event stream |
| `GET` | `/api/run/[id]/export` | Export run (YAML default, `?format=json` for JSON) |
| `GET` | `/api/run/[id]/replay` | Get replay events with timing offsets |
| `GET` | `/api/proposals?runId=` | List pending proposals |
| `GET` | `/api/proposals/[id]` | Get single proposal |
| `POST` | `/api/proposals/[id]/approve` | Approve proposal |
| `POST` | `/api/proposals/[id]/reject` | Reject proposal |
| `GET` | `/api/metrics` | Get LLM usage metrics |
| `DELETE` | `/api/metrics` | Reset metrics |
| `POST` | `/api/auth/login` | Login (sets cookie) |
| `POST` | `/api/auth/logout` | Logout (clears cookie) |
| `GET` | `/api/auth/check` | Check auth status |

---

## Run State Machine

```
User submits prompt
        │
        ▼
   ┌─────────┐   POST /api/run
   │ pending  │ ──────────────────► runId returned
   └────┬────┘
        │ orchestrator starts
        ▼
   ┌─────────┐
   │ running  │ ◄─── agents spawn, think, act, produce artifacts
   └────┬────┘
        │
   ┌────┴─────────────────────────┐
   │                              │
   ▼                              ▼
┌───────────┐              ┌──────────┐
│ completed │              │  failed  │
└───────────┘              └──────────┘
   (success)           (error, cancel, timeout)
```

Agent statuses: `idle` → `thinking` → `waiting` (if proposals) → `acting` (if approved) → `done` | `error` | `rejected`

---

## Gotchas for Test Agents

1. **Cold start is slow**: First page load compiles Turbopack. Use 60s timeouts.
2. **No `middleware.ts`**: Auth uses `proxy.ts`. Creating `middleware.ts` breaks the build.
3. **SQLite auto-creates**: No setup needed, but delete `sqlite.db` to fully reset data.
4. **Metrics are in-memory**: Cleared on server restart and between runs.
5. **Rate limits are in-memory**: Reset on server restart.
6. **SSE reconnection**: Client auto-reconnects with exponential backoff. Events are deduped by ID.
7. **Approval auto-rejects at 60s**: Don't wait longer than that if testing approvals.
8. **Landing page SVGs**: `#how-it-works svg` with `.first()` — lucide icons also produce SVGs.
9. **Text ambiguity in selectors**: Use `{ exact: true }` for text like "Orchestrator", "Blog Post" that appear in multiple places.
10. **Prefer `getByRole("button", ...)`** over `getByText()` for button clicks in tests.
11. **`GEMINI_API_KEY` required for real runs**: Without it, run creation will fail at the LLM call stage.
12. **Tambo needs API key**: Without `NEXT_PUBLIC_TAMBO_API_KEY`, the generative thread won't render AI components.
