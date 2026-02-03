import { relations } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const runs = sqliteTable("runs", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  status: text("status", {
    enum: ["pending", "running", "completed", "failed"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
});

export const agents = sqliteTable("agents", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  role: text("role", {
    enum: ["orchestrator", "researcher", "builder", "auditor"],
  }).notNull(),
  status: text("status", {
    enum: ["idle", "thinking", "acting", "waiting", "done", "error"],
  })
    .notNull()
    .default("idle"),
  parentId: text("parent_id"),
});

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  agentId: text("agent_id").references(() => agents.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  payload: text("payload", { mode: "json" }),
  timestamp: integer("timestamp", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const artifacts = sqliteTable("artifacts", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  contentType: text("content_type").notNull().default("text/plain"),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const actionProposals = sqliteTable("action_proposals", {
  id: text("id").primaryKey(),
  runId: text("run_id")
    .notNull()
    .references(() => runs.id, { onDelete: "cascade" }),
  agentId: text("agent_id")
    .notNull()
    .references(() => agents.id, { onDelete: "cascade" }),
  actionId: text("action_id").notNull(),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  rationale: text("rationale"),
  risk: text("risk", { enum: ["low", "medium", "high", "critical"] })
    .notNull()
    .default("low"),
  diffBefore: text("diff_before"),
  diffAfter: text("diff_after"),
  status: text("status", {
    enum: ["pending", "approved", "rejected", "expired"],
  })
    .notNull()
    .default("pending"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  proposalId: text("proposal_id")
    .notNull()
    .references(() => actionProposals.id, { onDelete: "cascade" }),
  approved: integer("approved", { mode: "boolean" }).notNull(),
  reason: text("reason"),
  approvedAt: integer("approved_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const runsRelations = relations(runs, ({ many }) => ({
  agents: many(agents),
  events: many(events),
  artifacts: many(artifacts),
  actionProposals: many(actionProposals),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  run: one(runs, { fields: [agents.runId], references: [runs.id] }),
  events: many(events),
  artifacts: many(artifacts),
  actionProposals: many(actionProposals),
}));

export const eventsRelations = relations(events, ({ one }) => ({
  run: one(runs, { fields: [events.runId], references: [runs.id] }),
  agent: one(agents, { fields: [events.agentId], references: [agents.id] }),
}));

export const artifactsRelations = relations(artifacts, ({ one }) => ({
  run: one(runs, { fields: [artifacts.runId], references: [runs.id] }),
  agent: one(agents, { fields: [artifacts.agentId], references: [agents.id] }),
}));

export const actionProposalsRelations = relations(actionProposals, ({ one, many }) => ({
  run: one(runs, { fields: [actionProposals.runId], references: [runs.id] }),
  agent: one(agents, { fields: [actionProposals.agentId], references: [agents.id] }),
  approvals: many(approvals),
}));

export const approvalsRelations = relations(approvals, ({ one }) => ({
  proposal: one(actionProposals, { fields: [approvals.proposalId], references: [actionProposals.id] }),
}));

export type Run = typeof runs.$inferSelect;
export type NewRun = typeof runs.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type Artifact = typeof artifacts.$inferSelect;
export type NewArtifact = typeof artifacts.$inferInsert;
export type ActionProposal = typeof actionProposals.$inferSelect;
export type NewActionProposal = typeof actionProposals.$inferInsert;
export type Approval = typeof approvals.$inferSelect;
export type NewApproval = typeof approvals.$inferInsert;
