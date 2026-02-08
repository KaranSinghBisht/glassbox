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

  const result = await db.transaction(async (tx) => {
    const updated = await tx
      .update(actionProposals)
      .set({ status: "approved" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")))
      .returning({ id: actionProposals.id });

    if (updated.length === 0) {
      throw new Error(`Proposal ${proposalId} was already processed by another request`);
    }

    await tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: true,
      reason,
    });

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

  const result = await db.transaction(async (tx) => {
    const updated = await tx
      .update(actionProposals)
      .set({ status: "rejected" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")))
      .returning({ id: actionProposals.id });

    if (updated.length === 0) {
      throw new Error(`Proposal ${proposalId} was already processed by another request`);
    }

    await tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: false,
      reason,
    });

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
  proposalId: string,
  timeoutMs: number = 30 * 60 * 1000
): Promise<{ approved: boolean; reason?: string }> {
  // Check if already processed (handles race where user approved before we subscribed)
  const existing = await db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });

  if (existing?.status === "approved") {
    return { approved: true };
  }
  if (existing?.status === "rejected") {
    const existingApproval = await db.query.approvals.findFirst({
      where: eq(approvals.proposalId, proposalId),
    });
    return { approved: false, reason: existingApproval?.reason ?? undefined };
  }

  // Block until user approves/rejects via the API, or timeout
  return new Promise<{ approved: boolean; reason?: string }>((resolve, reject) => {
    const timeout = setTimeout(() => {
      unsubscribe();
      reject(new Error(`Approval timeout for proposal ${proposalId}`));
    }, timeoutMs);

    const unsubscribe = eventBus.subscribe((event) => {
      if (event.type === "APPROVAL_GRANTED" && event.payload.proposalId === proposalId) {
        clearTimeout(timeout);
        unsubscribe();
        resolve({ approved: true });
      } else if (event.type === "APPROVAL_REJECTED" && event.payload.proposalId === proposalId) {
        clearTimeout(timeout);
        unsubscribe();
        resolve({ approved: false, reason: event.payload.reason });
      }
    });
  });
}
