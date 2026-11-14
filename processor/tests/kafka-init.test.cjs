const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
let directory, command, state, log;
beforeEach(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), "actionhub-kafka-init-"));
  command = path.join(directory, "topics");
  state = path.join(directory, "state");
  log = path.join(directory, "calls");
  fs.writeFileSync(
    command,
    `#!/usr/bin/env node
const fs=require('node:fs'); const args=process.argv.slice(2); const state=process.env.MOCK_STATE; const log=process.env.MOCK_LOG;
fs.appendFileSync(log,JSON.stringify(args)+'\\n');
const count=()=>Number(fs.readFileSync(state,'utf8'));
const desired=()=>args[args.indexOf('--partitions')+1];
if(args.includes('--create')&&!fs.existsSync(state))fs.writeFileSync(state,desired());
if(args.includes('--alter'))fs.writeFileSync(state,desired());
if(args.includes('--describe'))console.log('Topic: zap-events\\tPartitionCount: '+count()+'\\tReplicationFactor: 1');
`,
    { mode: 0o755 },
  );
});
afterEach(() => fs.rmSync(directory, { recursive: true, force: true }));
function run(partitions, current) {
  if (current !== undefined) fs.writeFileSync(state, String(current));
  return spawnSync("/bin/sh", [path.join(__dirname, "../scripts/init-kafka.sh")], {
    encoding: "utf8",
    env: {
      ...process.env,
      KAFKA_PARTITIONS: String(partitions),
      KAFKA_TOPICS_COMMAND: command,
      MOCK_STATE: state,
      MOCK_LOG: log,
    },
  });
}
function calls() {
  return fs.existsSync(log) ? fs.readFileSync(log, "utf8") : "";
}
test("creates a new topic using the requested partition count", () => {
  const result = run(3);
  expect(result.status).toBe(0);
  expect(fs.readFileSync(state, "utf8")).toBe("3");
});
test("increases an existing topic without deleting it", () => {
  const result = run(3, 1);
  expect(result.status).toBe(0);
  expect(fs.readFileSync(state, "utf8")).toBe("3");
  expect(calls()).toContain("--alter");
  expect(calls()).not.toContain("--delete");
});
test("same partition count is a no-op", () => {
  expect(run(3, 3).status).toBe(0);
  expect(calls()).not.toContain("--alter");
});
test("refuses to shrink an existing topic", () => {
  const result = run(1, 3);
  expect(result.status).not.toBe(0);
  expect(result.stderr).toContain("Cannot reduce");
  expect(fs.readFileSync(state, "utf8")).toBe("3");
  expect(calls()).not.toContain("--delete");
  expect(calls()).not.toContain("--alter");
});
test.each(["0", "-1", "1.5", "257", "abc", ""])(
  "rejects invalid partition count %s before calling Kafka",
  (value) => {
    expect(run(value).status).not.toBe(0);
    expect(calls()).toBe("");
  },
);
