const { createAuthRateLimiters } = require("../src/auth-rate-limit.ts");
const settings = {
  loginWindowMs: 900000,
  loginIpLimit: 30,
  loginAccountLimit: 10,
  signupWindowMs: 3600000,
  signupIpLimit: 5,
};
let db, res, next, limiter;
const now = new Date("2026-11-16T00:00:00Z");
beforeEach(() => {
  db = {
    $queryRaw: jest
      .fn()
      .mockResolvedValue([{ hits: 1, resetAt: new Date(now.getTime() + 900000) }]),
    authRateLimit: { deleteMany: jest.fn().mockResolvedValue({ count: 0 }) },
  };
  res = { setHeader: jest.fn(), status: jest.fn().mockReturnThis(), json: jest.fn() };
  next = jest.fn();
  limiter = createAuthRateLimiters(db, settings, "test-secret", () => now);
});
const request = (username = "person@example.com") => ({ ip: "203.0.113.1", body: { username } });
test("login checks IP and account atomically without storing raw identities", async () => {
  await limiter.login(request(), res, next);
  expect(next).toHaveBeenCalledTimes(1);
  expect(db.$queryRaw).toHaveBeenCalledTimes(2);
  const [sql, key] = db.$queryRaw.mock.calls[0];
  expect(sql.join("")).toContain("ON CONFLICT");
  expect(key).toMatch(/^[a-f0-9]{64}$/);
  expect(JSON.stringify(db.$queryRaw.mock.calls)).not.toContain("person@example.com");
  expect(JSON.stringify(db.$queryRaw.mock.calls)).not.toContain("203.0.113.1");
});
test.each([
  [30, true],
  [31, false],
])("IP limit boundary %i", async (hits, allowed) => {
  db.$queryRaw.mockResolvedValueOnce([{ hits, resetAt: new Date(now.getTime() + 900000) }]);
  await limiter.login(request(), res, next);
  expect(next).toHaveBeenCalledTimes(allowed ? 1 : 0);
  if (!allowed) {
    expect(res.status).toHaveBeenCalledWith(429);
    expect(res.setHeader).toHaveBeenCalledWith("Retry-After", "900");
  }
});
test("account limit blocks even below IP limit", async () => {
  db.$queryRaw
    .mockResolvedValueOnce([{ hits: 1, resetAt: now }])
    .mockResolvedValueOnce([{ hits: 11, resetAt: now }]);
  await limiter.login(request(), res, next);
  expect(res.status).toHaveBeenCalledWith(429);
  expect(next).not.toHaveBeenCalled();
});
test("signup uses its own limit", async () => {
  db.$queryRaw.mockResolvedValue([{ hits: 6, resetAt: now }]);
  await limiter.signup(request(), res, next);
  expect(db.$queryRaw).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(429);
});
test("email keys are case normalized and cleanup is throttled", async () => {
  await limiter.login(request(" Person@Example.com "), res, next);
  await limiter.login(request("person@example.com"), res, next);
  expect(db.$queryRaw.mock.calls[1][1]).toBe(db.$queryRaw.mock.calls[3][1]);
  expect(db.authRateLimit.deleteMany).toHaveBeenCalledTimes(1);
});
test("OAuth login without email still counts the IP", async () => {
  await limiter.login({ socket: { remoteAddress: "127.0.0.1" } }, res, next);
  expect(db.$queryRaw).toHaveBeenCalledTimes(1);
  expect(next).toHaveBeenCalled();
});
test.each(["failure", "empty"])("database %s fails closed", async (kind) => {
  if (kind === "failure") db.$queryRaw.mockRejectedValue(Error("private"));
  else db.$queryRaw.mockResolvedValue([]);
  await limiter.login(request(), res, next);
  expect(res.status).toHaveBeenCalledWith(503);
  expect(next).not.toHaveBeenCalled();
  expect(JSON.stringify(res.json.mock.calls)).not.toContain("private");
});
