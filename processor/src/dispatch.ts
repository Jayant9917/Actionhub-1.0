import type { PrismaClient } from "./generated/prisma/client.js";
import { createActionJob } from "./payload.js";

type Database = Pick<
  PrismaClient,
  "$queryRaw" | "$transaction" | "zapRunOutbox" | "actionRun" | "legacyJob"
>;
type Publish = (job: ReturnType<typeof createActionJob>) => Promise<void>;

export async function dispatchActions(
  db: Database,
  publish: Publish,
  now = new Date(),
  batchSize = 50,
) {
  // Old outbox records predate action snapshots. Backfill once, atomically, then retire them.
  const outbox = await db.zapRunOutbox.findMany({ take: 10, orderBy: { id: "asc" } });
  for (const entry of outbox) {
    await db.$transaction(async (tx) => {
      const run = await tx.zapRun.findUniqueOrThrow({
        where: { id: entry.zapRunId },
        include: { actionRuns: true, zap: { include: { actions: true } } },
      });
      if (!run.zap.deletedAt && run.actionRuns.length === 0) {
        for (const action of run.zap.actions) {
          await tx.actionRun.upsert({
            where: { zapRunId_actionId: { zapRunId: run.id, actionId: action.id } },
            create: {
              zapRunId: run.id,
              actionId: action.id,
              type: action.actionId,
              config: action.Metadata ?? {},
              credentialId: action.credentialId ?? null,
            },
            update: {},
          });
        }
      }
      // Pending ActionRuns are now the durable per-action outbox; nothing is lost on a crash.
      await tx.zapRunOutbox.deleteMany({ where: { id: entry.id } });
    });
  }

  // A worker may have stopped after sending but before persisting success. Review, don't resend.
  await db.actionRun.updateMany({
    where: { status: "running", leaseUntil: { lte: now } },
    data: {
      status: "needs_attention",
      errorCode: "WORKER_LEASE_EXPIRED",
      claimToken: null,
      leaseUntil: null,
    },
  });
  await db.legacyJob.updateMany({
    where: { status: "running", leaseUntil: { lte: now } },
    data: { status: "needs_attention", errorCode: "WORKER_LEASE_EXPIRED", leaseUntil: null },
  });
  // Also catch an in-flight webhook/backfill that committed just after deletion.
  await db.actionRun.updateMany({
    where: { status: { in: ["pending", "retry"] }, zapRun: { zap: { deletedAt: { not: null } } } },
    data: {
      status: "cancelled",
      errorCode: "WORKFLOW_DELETED",
      claimToken: null,
      leaseUntil: null,
    },
  });
  // A retry blocks later steps until it settles. Other runs can progress independently.
  // Old snapshots have no sequence and retain their original behavior.
  const due = await db.$queryRaw<{ id: string; zapRunId: string }[]>`
    SELECT action.id, action."zapRunId"
    FROM "ActionRun" action
    JOIN "ZapRun" run ON run.id = action."zapRunId"
    JOIN "Zap" workflow ON workflow.id = run."zapId"
    WHERE workflow."deletedAt" IS NULL
      AND action.status IN ('pending', 'retry')
      AND action."nextAttemptAt" <= ${now}
      AND action."dispatchAfter" <= ${now}
      AND NOT EXISTS (
        SELECT 1 FROM "ActionRun" earlier
        WHERE earlier."zapRunId" = action."zapRunId"
          AND earlier.sequence < action.sequence
          AND earlier.status IN ('pending', 'retry', 'running')
      )
    ORDER BY action."createdAt", action.id
    LIMIT ${batchSize}
  `;
  for (const run of due) {
    // A short dispatch lease limits duplicate publication across processor instances.
    const lease = await db.actionRun.updateMany({
      where: { id: run.id, status: { in: ["pending", "retry"] }, dispatchAfter: { lte: now } },
      data: { dispatchAfter: new Date(now.getTime() + 30_000) },
    });
    if (!lease.count) continue;
    try {
      await publish(createActionJob(run));
    } catch {
      // Lease expires automatically. Continue publishing other eligible actions this cycle.
      console.error("Action publication deferred", { actionExecutionId: run.id });
    }
  }
}
