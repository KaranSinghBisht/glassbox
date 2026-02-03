# GlassBox MVP - Hackathon Build Plan

## TL;DR

> **Quick Summary**: Build a Generative UI + Agent Swarm "Mission Control" web app where users see agents spawn in a live graph, watch artifacts being created, and approve actions via diff-before-execute UI.
> 
> **Deliverables**:
> - 2-pane UI: Swarm Graph (left) + Tambo Audit Console (right)
> - 4 agents: Orchestrator, Researcher, Builder, Auditor
> - 5 Tambo-registered components for Generative UI (MVP subset)
> - WebSocket event streaming with real-time graph updates
> - Diff-before-execute approval flow
> - SQLite persistence for runs/artifacts
> 
> **Estimated Effort**: Large (6 days, solo)
> **Parallel Execution**: YES - 4 waves
> **Critical Path**: Task 1 (Scaffold) -> Task 4 (WebSocket) -> Task 8 (Tambo Components) -> Task 10 (Agents) -> Task 12 (Integration) -> Task 14 (Submission)

---

## Progress Tracking

- [x] **Task 1**: Project Scaffold with Tambo Starter ✅ DONE
- [x] **Task 2**: Database Schema with Drizzle + SQLite ✅ DONE
- [x] **Task 3**: Zod Schemas for Shared Types ✅ DONE
- [x] **Task 4**: WebSocket Server for Event Streaming ✅ DONE
- [x] **Task 5**: SwarmGraph Component with React Flow ✅ DONE
- [x] **Task 6**: SwarmEventBridge Component ✅ DONE
- [x] **Task 7**: AgentLLMClient with Caching and Fallback ✅ DONE
- [x] **Task 8**: Tambo Components (Core 5) ✅ DONE
- [x] **Task 9**: Approval Flow Implementation ✅ DONE
- [x] **Task 10**: Agent Implementation ✅ DONE
- [x] **Task 11**: Run Orchestration System ✅ DONE
- [x] **Task 12**: End-to-End Integration ✅ DONE
- [x] **Task 13**: Demo Polish and Visual Refinement ✅ DONE
- [x] **Task 14**: Submission Package ✅ DONE

---

## Context

### Stack Decisions
- **Frontend**: Next.js 16 + React 19 + Tambo + @xyflow/react
- **LLM**: Google Gemini via @google/genai
- **Database**: SQLite + Drizzle ORM
- **Styling**: Tailwind CSS v4

### Research Findings
- **Tambo**: Use `addThreadMessage()` to bridge WebSocket events, `z.describe()` on ALL schema fields, `withInteractable` HOC for approval components
- **React Flow**: Use `@xyflow/react` v12, `<animateMotion>` SVG for edge animation (not `animated: true`), wrap nodes in `memo()`
- **Gemini**: Rate limits dangerous (5-15 RPM free tier), need caching + model fallback chain + exponential backoff

---

## Task 2: Database Schema with Drizzle + SQLite

**What to do**:
- Create `/src/db/schema.ts` with tables: `runs`, `agents`, `events`, `artifacts`, `action_proposals`, `approvals`
- Create `/src/db/index.ts` with Drizzle client setup
- Add `drizzle.config.ts` at root
- Run initial migration

**Schema Design**:
```typescript
// runs: id, prompt, status, createdAt, completedAt
// agents: id, runId, name, role, status
// events: id, runId, agentId, type, payload, timestamp
// artifacts: id, runId, agentId, name, content, createdAt
// action_proposals: id, runId, actionId, kind, title, rationale, risk, status
// approvals: id, proposalId, approved, approvedAt
```

**Acceptance Criteria**:
```bash
npx drizzle-kit generate && npx drizzle-kit migrate
sqlite3 sqlite.db ".tables"
# Should show: runs, agents, events, artifacts, action_proposals, approvals
```

---

## Task 3: Zod Schemas for Shared Types

**What to do**:
- Create `/src/lib/schemas/events.ts` - all event type schemas
- Create `/src/lib/schemas/components.ts` - Tambo component schemas  
- Create `/src/lib/schemas/agents.ts` - agent state schemas
- Export from `/src/lib/schemas/index.ts`
- Use `.describe()` on EVERY field (critical for Tambo)

**Key Schemas**:
```typescript
// EventSchema - discriminated union for RUN_CREATED, AGENT_SPAWNED, etc.
// TaskPlanCardSchema, ActionProposalSchema, AuditSummarySchema
// ArtifactSchema, AgentStatusSchema
```

---

## Task 4: WebSocket Server for Event Streaming

**What to do**:
- Create `/src/app/api/run/events/route.ts` - WebSocket upgrade handler
- Create `/src/lib/eventBus.ts` - server-side pub/sub
- Implement event broadcasting to connected clients

---

## Task 5: SwarmGraph Component with React Flow

**What to do**:
- Create `/src/components/SwarmGraph/index.tsx`
- Create `/src/components/SwarmGraph/AgentNode.tsx` - custom node
- Create `/src/components/SwarmGraph/PulseEdge.tsx` - animated edge with `<animateMotion>`
- Create `/src/components/SwarmGraph/useDagreLayout.ts` - auto-layout hook

**Must NOT**:
- Don't use `animated: true` (CPU intensive)
- Don't regenerate node IDs on updates

---

## Task 6: SwarmEventBridge Component

**What to do**:
- Create component that connects WebSocket to SwarmGraph + Tambo
- Map events to graph updates and Tambo messages

---

## Task 7: AgentLLMClient with Caching and Fallback

**What to do**:
- Create `/src/lib/llm/client.ts` with caching + model fallback
- Fallback chain: gemini-2.5-flash-lite -> gemini-2.5-flash -> gemini-1.5-flash
- Exponential backoff for 429 errors

---

## Task 8: Tambo Components (Core 5)

**Components to build**:
1. TaskPlanCard - shows plan steps with status
2. ArtifactViewer - displays generated content
3. ActionProposalCard - shows proposed action with risk
4. DiffBeforeAction - shows diff preview
5. AuditSummary - shows confidence and red flags

**Critical**: Use `withInteractable` HOC and `.describe()` on all schema fields

---

## Task 9-14: See full plan details

Remaining tasks cover:
- Approval flow API
- Agent implementation (Orchestrator, Researcher, Builder, Auditor)
- Run orchestration system
- End-to-end integration
- Demo polish
- Submission package

---

## Panic MVP (If Behind Schedule)

If only 3 days remain:
- Static SwarmGraph with 4 hardcoded nodes
- Hardcoded demo sequence (no real LLM)
- 3 components only: TaskPlanCard + ArtifactViewer + ActionProposalCard
- Fake "Approve" button
- 45-second video
