import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";

const base = "http://localhost";
let token;

async function request(path, expected, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const response = await fetch(new URL(path, base), {
    method: body === undefined ? "GET" : "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  assert.equal(response.status, expected, path);
  return response.json();
}

const deadline = Date.now() + 60_000;
for (;;) {
  const ready = await request("/api/v1/trigger/available", 200).catch(() => null);
  if (ready) break;
  if (Date.now() >= deadline) throw new Error("Gateway did not become ready");
  await delay(1_000);
}

const username = `smoke-${randomUUID()}@example.com`;
const password = randomUUID();
await request("/api/v1/user/signup", 201, { username, password, name: "Deployment smoke" });
({ token } = await request("/api/v1/user/signin", 200, { username, password }));
assert.ok(token, "Sign-in should return a token");

const { zapId } = await request("/api/v1/zap", 201, {
  name: "Deployment smoke",
  availableTriggerId: "webhook",
  actions: [
    {
      availableActionId: "email",
      // Rendering must fail before SMTP, so the smoke test cannot send mail.
      actionMetadata: { email: "recipient@example.com", body: "{{missingField}}" },
    },
  ],
});
assert.ok(zapId);
const { zap, testEventsEnabled } = await request(`/api/v1/zap/${zapId}`, 200);
assert.equal(testEventsEnabled, false);
assert.ok(Number.isInteger(zap.userId));
const receipt = await request(`/hooks/catch/${zap.userId}/${zapId}`, 200, { source: "smoke" });
assert.equal(receipt.success, true);

for (let attempt = 0; attempt < 60; attempt++) {
  const history = await request(`/api/v1/runs?workflowId=${zapId}`, 200);
  const action = history.runs[0]?.actionRuns[0];
  if (action?.status === "failed") {
    assert.equal(action.attempts, 1);
    assert.equal(action.errorCode, "MISSING_EVENT_FIELD");
    console.log("Verified gateway, auth, migrations, webhook, Kafka worker, and run history");
    process.exit(0);
  }
  await delay(1_000);
}
throw new Error("The worker did not record the expected action failure");
