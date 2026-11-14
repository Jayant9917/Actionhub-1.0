import type { PrismaClient } from "./generated/prisma/client.js";
import { nextSchedule } from "./schedule-time.js";
export async function dispatchSchedules(
  db: Pick<PrismaClient, "scheduleTrigger" | "$transaction">,
  now = new Date(),
  batchSize = 50,
) {
  const due = await db.scheduleTrigger.findMany({
    where: {
      enabled: true,
      nextRunAt: { lte: now },
      workflow: { deletedAt: null, trigger: { triggerId: "schedule" } },
    },
    orderBy: { nextRunAt: "asc" },
    take: batchSize,
  });
  for (const timer of due) {
    await db.$transaction(async (tx) => {
      // Lock the workflow before taking action snapshots, matching action edits/deletion.
      const owned = await tx.zap.updateMany({
        where: { id: timer.workflowId, deletedAt: null, trigger: { triggerId: "schedule" } },
        data: { actionsRevision: { increment: 0 } },
      });
      if (!owned.count) return;
      const claim = await tx.scheduleTrigger.updateMany({
        where: {
          workflowId: timer.workflowId,
          enabled: true,
          frequency: timer.frequency,
          intervalMinutes: timer.intervalMinutes,
          hour: timer.hour,
          minute: timer.minute,
          nextRunAt: timer.nextRunAt,
        },
        data: { nextRunAt: nextSchedule(timer, now, timer.nextRunAt) },
      });
      if (!claim.count) return; // Another processor or a settings change already took this slot.
      const actions = await tx.action.findMany({
        where: { zapId: timer.workflowId },
        orderBy: { sortingOrder: "asc" },
      });
      if (!actions.length) return;
      await tx.zapRun.create({
        data: {
          zapId: timer.workflowId,
          metadata: {
            schedule: {
              scheduledAt: timer.nextRunAt.toISOString(),
              firedAt: now.toISOString(),
              frequency: timer.frequency,
              timezone: "UTC",
              intervalMinutes:
                timer.frequency === "every_5_minutes"
                  ? 5
                  : timer.frequency === "every_10_minutes"
                    ? 10
                    : timer.frequency === "custom_interval"
                      ? timer.intervalMinutes
                      : 1440,
            },
          },
          actionRuns: {
            create: actions.map((action) => ({
              actionId: action.id,
              type: action.actionId,
              config: action.Metadata ?? {},
              credentialId: action.credentialId ?? null,
            })),
          },
        },
      });
    });
  }
}
