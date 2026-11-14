const { dispatchSchedules } = require("../src/scheduler.ts");
const { nextSchedule } = require("../src/schedule-time.ts");
const now = new Date("2026-11-14T09:05:30Z");
test("five-minute slots and daily rollover are strictly in the future", () => {
  expect(nextSchedule({ frequency: "every_5_minutes" }, now).toISOString()).toBe(
    "2026-11-14T09:10:00.000Z",
  );
  expect(nextSchedule({ frequency: "daily", hour: 9, minute: 5 }, now).toISOString()).toBe(
    "2026-11-15T09:05:00.000Z",
  );
  expect(nextSchedule({ frequency: "daily", hour: 10, minute: 0 }, now).toISOString()).toBe(
    "2026-11-14T10:00:00.000Z",
  );
});
function database(claim = 1, active = 1) {
  const timer = {
    workflowId: "workflow",
    frequency: "every_5_minutes",
    hour: 9,
    minute: 0,
    nextRunAt: new Date("2026-11-14T08:00:00Z"),
  };
  const tx = {
    zap: { updateMany: jest.fn().mockResolvedValue({ count: active }) },
    scheduleTrigger: { updateMany: jest.fn().mockResolvedValue({ count: claim }) },
    action: {
      findMany: jest.fn().mockResolvedValue([
        { id: "a", actionId: "email", Metadata: { body: "old" } },
        {
          id: "b",
          actionId: "http.request",
          Metadata: { url: "https://example.com" },
          credentialId: "private-reference",
        },
      ]),
    },
    zapRun: { create: jest.fn() },
  };
  return {
    tx,
    db: {
      scheduleTrigger: { findMany: jest.fn().mockResolvedValue([timer]) },
      $transaction: jest.fn((fn) => fn(tx)),
    },
  };
}
test("one overdue slot creates a run with every action snapshot and skips missed intervals", async () => {
  const { db, tx } = database();
  await dispatchSchedules(db, now);
  expect(tx.scheduleTrigger.updateMany.mock.calls[0][0].data.nextRunAt.toISOString()).toBe(
    "2026-11-14T09:10:00.000Z",
  );
  const data = tx.zapRun.create.mock.calls[0][0].data;
  expect(data.metadata.schedule.scheduledAt).toBe("2026-11-14T08:00:00.000Z");
  expect(data.actionRuns.create).toHaveLength(2);
  expect(data.actionRuns.create[1]).toMatchObject({
    type: "http.request",
    credentialId: "private-reference",
  });
  expect(db.scheduleTrigger.findMany.mock.calls[0][0].where).toMatchObject({
    enabled: true,
    workflow: { deletedAt: null, trigger: { triggerId: "schedule" } },
  });
});
test.each([
  [0, 1],
  [1, 0],
])("does not create a duplicate or deleted workflow run (%s,%s)", async (claim, active) => {
  const { db, tx } = database(claim, active);
  await dispatchSchedules(db, now);
  expect(tx.zapRun.create).not.toHaveBeenCalled();
});

test("ten-minute preset uses the next clock boundary", () => {
  expect(nextSchedule({ frequency: "every_10_minutes" }, now).toISOString()).toBe(
    "2026-11-14T09:10:00.000Z",
  );
  expect(
    nextSchedule({ frequency: "every_10_minutes" }, new Date("2026-11-14T09:10:00Z")).toISOString(),
  ).toBe("2026-11-14T09:20:00.000Z");
});
test("custom intervals start after saving and retain their cadence after downtime", () => {
  const settings = { frequency: "custom_interval", intervalMinutes: 12 };
  expect(nextSchedule(settings, now).toISOString()).toBe("2026-11-14T09:17:30.000Z");
  expect(
    nextSchedule(
      settings,
      new Date("2026-11-14T10:00:00Z"),
      new Date("2026-11-14T09:17:30Z"),
    ).toISOString(),
  ).toBe("2026-11-14T10:05:30.000Z");
});
test.each([0, -1, 1.5, 1441, undefined])("rejects invalid custom interval %s", (intervalMinutes) =>
  expect(() => nextSchedule({ frequency: "custom_interval", intervalMinutes }, now)).toThrow(
    "INVALID_INTERVAL",
  ),
);
test.each([1, 1440])("accepts custom interval boundary %s", (intervalMinutes) =>
  expect(
    nextSchedule({ frequency: "custom_interval", intervalMinutes }, now).getTime() - now.getTime(),
  ).toBe(intervalMinutes * 60000),
);

test("dispatches a custom timer once and preserves its twelve-minute cadence", async () => {
  const { db, tx } = database();
  db.scheduleTrigger.findMany.mockResolvedValue([
    {
      workflowId: "workflow",
      frequency: "custom_interval",
      intervalMinutes: 12,
      hour: 9,
      minute: 0,
      nextRunAt: new Date("2026-11-14T08:53:00Z"),
    },
  ]);
  await dispatchSchedules(db, now);
  expect(tx.scheduleTrigger.updateMany.mock.calls[0][0]).toMatchObject({
    where: { intervalMinutes: 12 },
    data: { nextRunAt: new Date("2026-11-14T09:17:00Z") },
  });
  expect(tx.zapRun.create.mock.calls[0][0].data.metadata.schedule.intervalMinutes).toBe(12);
});

test("uses the configured scheduler batch size", async () => {
  const { db } = database();
  await dispatchSchedules(db, now, 8);
  expect(db.scheduleTrigger.findMany.mock.calls[0][0].take).toBe(8);
});
