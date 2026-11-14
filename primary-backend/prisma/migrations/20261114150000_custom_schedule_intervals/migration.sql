ALTER TABLE "ScheduleTrigger" ADD COLUMN "intervalMinutes" INTEGER NOT NULL DEFAULT 5;
ALTER TABLE "ScheduleTrigger" DROP CONSTRAINT "ScheduleTrigger_frequency_check";
ALTER TABLE "ScheduleTrigger" ADD CONSTRAINT "ScheduleTrigger_frequency_check" CHECK ("frequency" IN ('every_5_minutes','every_10_minutes','custom_interval','daily'));
ALTER TABLE "ScheduleTrigger" ADD CONSTRAINT "ScheduleTrigger_interval_check" CHECK ("intervalMinutes" BETWEEN 1 AND 1440);
