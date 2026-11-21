import { createDeleteWorkflowHandler } from "../delete-workflow.js";
import { createTestEventHandler } from "../test-event.js";
import { createTallySetupHandlers } from "../tally-setup.js";
import { createScheduleHandlers } from "../schedule-setup.js";
import { z } from "zod";
import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { createWorkflowActionHandlers } from "../workflow-actions.js";
import { prismaClient } from "../db/index.js";
import { config } from "../config.js";
import { createGitHubSetupHandlers } from "../github-setup.js";
import { createExecutionHistoryHandler } from "../execution-history.js";

const router = Router();
const scheduleSetup = createScheduleHandlers(prismaClient);
router.get("/:zapId/schedule", authMiddleware, scheduleSetup.get);
router.put("/:zapId/schedule", authMiddleware, scheduleSetup.save);
router.delete("/:zapId", authMiddleware, createDeleteWorkflowHandler(prismaClient));
router.post(
  "/:zapId/test-event",
  authMiddleware,
  createTestEventHandler(prismaClient, config.testEventsEnabled),
);
const tallySetup = createTallySetupHandlers(prismaClient, config.encryptionKey);
router.get("/:zapId/tally-trigger", authMiddleware, tallySetup.get);
router.put("/:zapId/tally-trigger", authMiddleware, tallySetup.save);
const githubSetup = createGitHubSetupHandlers(prismaClient, config);
router.get("/:zapId/github-trigger", authMiddleware, githubSetup.get);
router.put("/:zapId/github-trigger", authMiddleware, githubSetup.save);

const workflowActions = createWorkflowActionHandlers(prismaClient, config.encryptionKey);
router.post("/", authMiddleware, workflowActions.create);
router.put("/:zapId/actions", authMiddleware, workflowActions.update);

const metadataSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    enabled: z.boolean().optional(),
  })
  .strict()
  .refine((value) => (value.name !== undefined) !== (value.enabled !== undefined));

router.patch("/:zapId", authMiddleware, async (req, res) => {
  const userId = Number(req.id);
  if (!Number.isSafeInteger(userId) || userId < 1)
    return res.status(403).json({ message: "Unauthorized" });
  const parsed = metadataSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ message: "Enter a valid workflow name or status." });
  const { name, enabled } = parsed.data;
  const id = String(req.params.zapId);
  try {
    const result = await prismaClient.$transaction(async (tx) => {
      const claimed = await tx.zap.updateMany({
        where: { id, userId, deletedAt: null },
        data: { ...(name === undefined ? {} : { name }), actionsRevision: { increment: 0 } },
      });
      if (!claimed.count) return "missing";
      if (enabled === undefined) return "saved";
      const trigger = await tx.trigger.findUnique({
        where: { ZapId: id },
        select: { triggerId: true },
      });
      const type = trigger?.triggerId;
      if (type === "schedule") {
        const updated = await tx.scheduleTrigger.updateMany({
          where: { workflowId: id },
          data: { enabled },
        });
        return updated.count ? "saved" : "unconfigured";
      }
      if (type === "tally.form_submitted") {
        const updated = await tx.tallyTrigger.updateMany({
          where: { workflowId: id, enabled: !enabled },
          data: { enabled, revision: { increment: 1 } },
        });
        return updated.count || (await tx.tallyTrigger.count({ where: { workflowId: id } }))
          ? "saved"
          : "unconfigured";
      }
      if (type?.startsWith("github.")) {
        const updated = await tx.githubTrigger.updateMany({
          where: { workflowId: id, enabled: !enabled },
          data: { enabled, revision: { increment: 1 } },
        });
        return updated.count || (await tx.githubTrigger.count({ where: { workflowId: id } }))
          ? "saved"
          : "unconfigured";
      }
      await tx.zap.update({ where: { id }, data: { webhookEnabled: enabled } });
      return "saved";
    });
    if (result === "missing") return res.status(404).json({ message: "Workflow not found." });
    if (result === "unconfigured")
      return res.status(409).json({ message: "Configure the trigger before changing its status." });
    return res.json({ name, enabled });
  } catch {
    return res.status(503).json({ message: "Could not update workflow." });
  }
});

router.get("/", authMiddleware, async (req, res) => {
  const id = req.id;
  if (!id) {
    return res.status(403).json({
      message: "Unauthorized",
    });
  }

  const userId = parseInt(id, 10);
  if (isNaN(userId)) {
    return res.status(400).json({
      message: "Invalid user ID",
    });
  }

  const zaps = await prismaClient.zap.findMany({
    orderBy: [{ createdAt: { sort: "desc", nulls: "last" } }, { id: "asc" }],
    where: {
      userId: userId,
      deletedAt: null,
    },
    include: {
      actions: {
        orderBy: { sortingOrder: "asc" },
        include: {
          type: true,
        },
      },
      trigger: {
        include: {
          type: true,
        },
      },
    },
  });

  return res.json({
    zaps,
  });
});

router.get("/:zapId/runs", authMiddleware, createExecutionHistoryHandler(prismaClient));

router.get("/:zapId", authMiddleware, async (req, res) => {
  const id = req.id;
  if (!id) {
    return res.status(403).json({
      message: "Unauthorized",
    });
  }

  const zapId = Array.isArray(req.params.zapId) ? req.params.zapId[0] : req.params.zapId;

  if (!zapId || typeof zapId !== "string") {
    return res.status(411).json({
      message: "Invalid zap ID",
    });
  }

  const zap = await prismaClient.zap.findFirst({
    where: {
      id: zapId,
      deletedAt: null,
      userId: parseInt(id, 10),
    },
    include: {
      actions: {
        orderBy: { sortingOrder: "asc" },
        include: {
          type: true,
        },
      },
      trigger: {
        include: {
          type: true,
        },
      },
    },
  });

  return res.json({
    testEventsEnabled: config.testEventsEnabled,
    zap,
  });
});

export const zapRouter = router;
