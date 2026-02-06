import { db, actionProposals, approvals } from "@/db";
import { eq, and } from "drizzle-orm";
import { eventBus } from "./eventBus";

const INITIAL_POLL_MS = 500;
const MAX_POLL_MS = 10_000;
const APPROVAL_TIMEOUT_MS = 24 * 60 * 60 * 1000;

export async function approveProposal(proposalId: string, reason?: string) {
  const approvalId = crypto.randomUUID();

  const result = await db.transaction(async (tx) => {
    const proposal = await tx.query.actionProposals.findFirst({
      where: eq(actionProposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== "pending") {
      throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
    }

    const updateResult = await tx
      .update(actionProposals)
      .set({ status: "approved" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")));

    if (updateResult.changes === 0) {
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

  const result = await db.transaction(async (tx) => {
    const proposal = await tx.query.actionProposals.findFirst({
      where: eq(actionProposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status !== "pending") {
      throw new Error(`Proposal ${proposalId} is not pending (status: ${proposal.status})`);
    }

    const updateResult = await tx
      .update(actionProposals)
      .set({ status: "rejected" })
      .where(and(eq(actionProposals.id, proposalId), eq(actionProposals.status, "pending")));

    if (updateResult.changes === 0) {
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
  proposalId: string
): Promise<{ approved: boolean; reason?: string }> {
  const startTime = Date.now();
  let pollInterval = INITIAL_POLL_MS;

  while (Date.now() - startTime < APPROVAL_TIMEOUT_MS) {
    const proposal = await db.query.actionProposals.findFirst({
      where: eq(actionProposals.id, proposalId),
    });

    if (!proposal) {
      throw new Error(`Proposal ${proposalId} not found`);
    }

    if (proposal.status === "approved") {
      return { approved: true };
    }

    if (proposal.status === "rejected") {
      const approval = await db.query.approvals.findFirst({
        where: eq(approvals.proposalId, proposalId),
      });
      return { approved: false, reason: approval?.reason ?? undefined };
    }

    await new Promise((r) => setTimeout(r, pollInterval));
    pollInterval = Math.min(pollInterval * 1.5, MAX_POLL_MS);
  }

  throw new Error(`Approval timeout for proposal ${proposalId} after 24 hours`);
}
