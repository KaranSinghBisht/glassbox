import { db, actionProposals, approvals } from "@/db";
import { eq } from "drizzle-orm";
import { eventBus } from "./eventBus";

export async function approveProposal(proposalId: string, reason?: string) {
  const proposal = await db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });

  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  if (proposal.status !== "pending") {
    throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
  }

  const approvalId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: true,
      reason,
    });

    await tx
      .update(actionProposals)
      .set({ status: "approved" })
      .where(eq(actionProposals.id, proposalId));
  });

  eventBus.emit({
    type: "APPROVAL_GRANTED",
    runId: proposal.runId,
    agentId: proposal.agentId,
    ts: Date.now(),
    payload: { proposalId },
  });

  return { proposalId, approved: true, approvalId };
}

export async function rejectProposal(proposalId: string, reason?: string) {
  const proposal = await db.query.actionProposals.findFirst({
    where: eq(actionProposals.id, proposalId),
  });

  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  if (proposal.status !== "pending") {
    throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
  }

  const approvalId = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(approvals).values({
      id: approvalId,
      proposalId,
      approved: false,
      reason,
    });

    await tx
      .update(actionProposals)
      .set({ status: "rejected" })
      .where(eq(actionProposals.id, proposalId));
  });

  eventBus.emit({
    type: "APPROVAL_REJECTED",
    runId: proposal.runId,
    agentId: proposal.agentId,
    ts: Date.now(),
    payload: { proposalId, reason },
  });

  return { proposalId, approved: false, approvalId };
}

export async function getPendingProposals(runId?: string) {
  const where = runId
    ? eq(actionProposals.runId, runId)
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
