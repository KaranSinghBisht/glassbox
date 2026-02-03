# GlassBox

**Agent Swarm Mission Control** - Watch AI agents collaborate in real-time with transparent decision-making.

## What is GlassBox?

GlassBox is a Generative UI application that visualizes multi-agent AI systems. Users can:

- See agents spawn in a live graph visualization
- Watch artifacts being created in real-time
- Approve or reject agent actions via diff-before-execute UI
- Track the full audit trail of agent decisions

## Tech Stack

- **Frontend**: Next.js 16 + React 19 + Tailwind CSS v4
- **Visualization**: @xyflow/react (React Flow) for agent graph
- **AI**: Google Gemini via @google/genai
- **Database**: SQLite + Drizzle ORM
- **Generative UI**: Tambo AI for component generation

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment**
   ```bash
   cp .env.example .env
   # Add your GEMINI_API_KEY to .env
   ```

3. **Run database migrations**
   ```bash
   npx drizzle-kit migrate
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Mission Control UI                    │
├─────────────────────────┬───────────────────────────────┤
│     SwarmGraph          │       Tambo Console           │
│   (React Flow)          │    (Generative UI)            │
├─────────────────────────┴───────────────────────────────┤
│                  SwarmEventBridge (SSE)                  │
├─────────────────────────────────────────────────────────┤
│                   Run Orchestrator                       │
├──────────┬──────────┬──────────┬────────────────────────┤
│Orchestrator│Researcher│ Builder │       Auditor          │
├──────────┴──────────┴──────────┴────────────────────────┤
│              AgentLLMClient (Gemini)                     │
├─────────────────────────────────────────────────────────┤
│            SQLite + Drizzle ORM                          │
└─────────────────────────────────────────────────────────┘
```

## Agent Roles

| Agent | Role |
|-------|------|
| **Orchestrator** | Breaks down goals, creates plans, delegates to workers |
| **Researcher** | Gathers context, identifies constraints and assumptions |
| **Builder** | Creates artifacts (documents, code, copy) |
| **Auditor** | Reviews work, identifies red flags, creates verification checklists |

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/run` | POST | Start a new swarm run |
| `/api/run/[id]` | GET | Get run with agents and artifacts |
| `/api/run/events` | GET | SSE stream for real-time events |
| `/api/proposals` | GET | List pending action proposals |
| `/api/proposals/[id]/approve` | POST | Approve a proposal |
| `/api/proposals/[id]/reject` | POST | Reject a proposal |

## Tambo Components

Five Generative UI components for agent output:

1. **TaskPlanCard** - Shows plan steps with progress
2. **ArtifactViewer** - Displays generated content
3. **ActionProposalCard** - Shows proposed actions with risk levels
4. **DiffBeforeAction** - Diff preview before applying changes
5. **AuditSummary** - Confidence levels and verification checklists

## License

MIT
