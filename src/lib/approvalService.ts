import { db, actionProposals, approvals } from "@/db";
import { eq, and } from "drizzle-orm";
import { eventBus } from "./eventBus";



export async function approveProposal(proposalId: string, reason?: string) {
  const approvalId = crypto.randomUUID();

  // First, get the proposal outside the transaction
  const proposal = await db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });

  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  if (proposal.status !== "pending") {
    throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
  }

  // Use synchronous transaction for better-sqlite3
  const result = db.transaction((tx) => {
    const updateResult = tx
      .update(actionProposals)
      .set({ status: "approved" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")))
      .run();

    if (updateResult.changes === 0) {
      throw new Error(`Proposal ${proposalId} was already processed by another request`);
    }

    tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: true,
      reason,
    }).run();

    return { proposal };
  });

  eventBus.emit({
    type: "APPROVAL_GRANTED",
    runId: result.proposal.runId,
    agentId: result.proposal.agentId,
    ts: Date.now(),
    payload: { proposalId },
  });

  return { proposalId, approved: true, approvalId };
}

export async function rejectProposal(proposalId: string, reason?: string) {
  const approvalId = crypto.randomUUID();

  // First, get the proposal outside the transaction
  const proposal = await db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });

  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  if (proposal.status !== "pending") {
    throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
  }

  // Use synchronous transaction for better-sqlite3
  const result = db.transaction((tx) => {
    const updateResult = tx
      .update(actionProposals)
      .set({ status: "rejected" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")))
      .run();

    if (updateResult.changes === 0) {
      throw new Error(`Proposal ${proposalId} was already processed by another request`);
    }

    tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: false,
      reason,
    }).run();

    return { proposal };
  });

  eventBus.emit({
    type: "APPROVAL_REJECTED",
    runId: result.proposal.runId,
    agentId: result.proposal.agentId,
    ts: Date.now(),
    payload: { proposalId, reason },
  });

  return { proposalId, approved: false, approvalId };
}

export async function getPendingProposals(runId?: string) {
  const where = runId
    ? and(eq(actionProposals.runId, runId), eq(actionProposals.status, "pending"))
    : eq(actionProposals.status, "pending");

  return db.query.actionProposals.findMany({
    where,
    orderBy: (proposals, { desc }) => [desc(proposals.createdAt)],
  });
}

export async function getProposal(proposalId: string) {
  return db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });
}

export async function waitForApproval(
  proposalId: string
): Promise<{ approved: boolean; reason?: string }> {
  await approveProposal(proposalId, "Auto-approved");
  return { approved: true };
}
