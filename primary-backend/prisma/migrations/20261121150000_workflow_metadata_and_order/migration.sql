ALTER TABLE "Zap"
  ADD COLUMN "name" TEXT,
  ADD COLUMN "createdAt" TIMESTAMP(3),
  ADD COLUMN "webhookEnabled" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "ActionRun" ADD COLUMN "sequence" INTEGER;
CREATE INDEX "ActionRun_zapRunId_sequence_idx" ON "ActionRun" ("zapRunId", "sequence");
