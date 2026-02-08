import { db, runs, agents, artifacts, events } from "@/db";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import SharePageClient from "./SharePageClient";

export const dynamic = "force-dynamic";

interface SharePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SharePageProps) {
  const { id } = await params;
  const run = await db.query.runs.findFirst({
    where: eq(runs.id, id),
  });

  if (!run) return { title: "Not Found — GlassBox" };

  return {
    title: `${run.prompt.slice(0, 60)} — GlassBox`,
    description: `AI-generated document: ${run.prompt.slice(0, 150)}`,
  };
}

export default async function SharePage({ params }: SharePageProps) {
  const { id } = await params;

  const run = await db.query.runs.findFirst({
    where: eq(runs.id, id),
  });

  if (!run) notFound();

  const [runAgents, runArtifacts, runEvents] = await Promise.all([
    db.query.agents.findMany({
      where: eq(agents.runId, id),
    }),
    db.query.artifacts.findMany({
      where: eq(artifacts.runId, id),
    }),
    db.query.events.findMany({
      where: eq(events.runId, id),
      orderBy: [asc(events.timestamp)],
    }),
  ]);

  const duration =
    run.completedAt && run.createdAt
      ? Math.round(
          (new Date(run.completedAt).getTime() -
            new Date(run.createdAt).getTime()) /
            1000
        )
      : null;

  return (
    <SharePageClient
      run={{
        id: run.id,
        prompt: run.prompt,
        status: run.status,
        createdAt: run.createdAt?.toISOString() ?? new Date().toISOString(),
        completedAt: run.completedAt?.toISOString() ?? null,
      }}
      agents={runAgents.map((a) => ({
        id: a.id,
        name: a.name,
        role: a.role,
        status: a.status,
      }))}
      artifacts={runArtifacts.map((a) => ({
        id: a.id,
        name: a.name,
        content: a.content,
        contentType: a.contentType,
      }))}
      eventCount={runEvents.length}
      duration={duration}
    />
  );
}
