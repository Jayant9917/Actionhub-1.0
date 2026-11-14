jest.mock("dotenv/config", () => ({}));
const originalEnv = process.env;
const load = () => require("../src/config.ts");
beforeEach(() => {
  jest.resetModules();
  process.env = {
    DATABASE_URL: "postgresql://unit:unit@postgres:5432/unit",
    JWT_PASSWORD: "unit-test-secret",
    KAFKA_BROKERS: "kafka:9092, second:9093",
    SMTP_ENDPOINT: "smtp.test",
    SMTP_USERNAME: "unit@example.test",
    SMTP_PASSWORD: "unit-test-password",
  };
});
afterEach(() => {
  process.env = originalEnv;
});

test("accepts a PostgreSQL URL", () => {
  expect(load().config.databaseUrl).toBe(process.env.DATABASE_URL);
});
test.each([undefined, "", "   ", "https://wrong.test/db", "postgresql://postgres/"])(
  "rejects invalid database URL %s",
  (value) => {
    if (value === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = value;
    expect(load).toThrow(/DATABASE_URL/);
  },
);
test("accepts postgres URL scheme", () => {
  process.env.DATABASE_URL = "postgres://unit:unit@postgres:5432/unit";
  expect(load().config.databaseUrl).toBe(process.env.DATABASE_URL);
});

test("trims the broker list and retains the default topic", () => {
  expect(load().config.brokers).toEqual(["kafka:9092", "second:9093"]);
  expect(load().config.topic).toBe("zap-events");
});
test("accepts IPv6 brokers", () => {
  process.env.KAFKA_BROKERS = "[::1]:9092";
  expect(load().config.brokers).toEqual(["[::1]:9092"]);
});
test.each(["", "kafka:9092,", "kafka", "http://kafka:9092", "kafka:0", "kafka:65536"])(
  "rejects invalid brokers %s",
  (value) => {
    process.env.KAFKA_BROKERS = value;
    expect(load).toThrow(/KAFKA_BROKERS/);
  },
);
test("allows a topic override", () => {
  process.env.KAFKA_TOPIC = " unit-topic ";
  expect(load().config.topic).toBe("unit-topic");
});
test("rejects a blank topic", () => {
  process.env.KAFKA_TOPIC = " ";
  expect(load).toThrow(/KAFKA_TOPIC/);
});

test("PROCESSOR_BATCH_SIZE retains its default and accepts a configured value", () => {
  expect(load().config.batchSize).toBe(50);
  jest.resetModules();
  process.env.PROCESSOR_BATCH_SIZE = "2";
  expect(load().config.batchSize).toBe(2);
});
test.each(["", "0", "-1", "1.5", "1001", "abc"])(
  "rejects invalid PROCESSOR_BATCH_SIZE %s",
  (value) => {
    process.env.PROCESSOR_BATCH_SIZE = value;
    expect(load).toThrow(/PROCESSOR_BATCH_SIZE/);
  },
);

test("PROCESSOR_POLL_INTERVAL_MS retains its default and accepts a configured value", () => {
  expect(load().config.pollIntervalMs).toBe(2000);
  jest.resetModules();
  process.env.PROCESSOR_POLL_INTERVAL_MS = "101";
  expect(load().config.pollIntervalMs).toBe(101);
});
test.each(["", "0", "-1", "1.5", "60001", "abc"])(
  "rejects invalid PROCESSOR_POLL_INTERVAL_MS %s",
  (value) => {
    process.env.PROCESSOR_POLL_INTERVAL_MS = value;
    expect(load).toThrow(/PROCESSOR_POLL_INTERVAL_MS/);
  },
);

test("SCHEDULER_BATCH_SIZE retains its default and accepts a configured value", () => {
  expect(load().config.scheduleBatchSize).toBe(50);
  jest.resetModules();
  process.env.SCHEDULER_BATCH_SIZE = "2";
  expect(load().config.scheduleBatchSize).toBe(2);
});
test.each(["", "0", "-1", "1.5", "501", "abc"])(
  "rejects invalid SCHEDULER_BATCH_SIZE %s",
  (value) => {
    process.env.SCHEDULER_BATCH_SIZE = value;
    expect(load).toThrow(/SCHEDULER_BATCH_SIZE/);
  },
);
