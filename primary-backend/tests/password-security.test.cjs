const jwt = require("jsonwebtoken");
const { hashPassword, verifyPassword } = require("../src/passwords.ts");
const { migrateLegacyPasswords } = require("../src/password-migration.ts");
const { createUserAuthHandlers } = require("../src/user-auth.ts");
const { createSessionToken } = require("../src/sessions.ts");
const response = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });
test("salted hashes verify only the correct password", async () => {
  const a = await hashPassword("secret-password"),
    b = await hashPassword("secret-password");
  expect(a).not.toBe(b);
  expect(a).not.toContain("secret-password");
  expect(await verifyPassword("secret-password", a)).toBe(true);
  expect(await verifyPassword("wrong", a)).toBe(false);
  expect(await verifyPassword("secret-password", null)).toBe(false);
  expect(await verifyPassword("secret-password", "invalid")).toBe(false);
}, 15000);
test("legacy passwords migrate conditionally and reruns are safe", async () => {
  const db = {
    user: {
      findMany: jest
        .fn()
        .mockResolvedValueOnce([{ id: 1, password: "old" }])
        .mockResolvedValue([]),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  const hash = jest.fn().mockResolvedValue("hashed");
  expect(await migrateLegacyPasswords(db, hash)).toBe(1);
  expect(db.user.updateMany).toHaveBeenCalledWith({
    where: { id: 1, passwordHashed: false, password: "old" },
    data: { password: "hashed", passwordHashed: true },
  });
  expect(await migrateLegacyPasswords(db, hash)).toBe(0);
});
test("migration never overwrites when hashing fails", async () => {
  const db = {
    user: {
      findMany: jest.fn().mockResolvedValue([{ id: 1, password: "old" }]),
      updateMany: jest.fn(),
    },
  };
  await expect(
    migrateLegacyPasswords(db, async () => {
      throw Error("failed");
    }),
  ).rejects.toThrow("failed");
  expect(db.user.updateMany).not.toHaveBeenCalled();
});
test("sessions last twelve hours and reject invalid IDs", () => {
  const claims = jwt.verify(createSessionToken(1, "test-secret"), "test-secret");
  expect(claims.exp - claims.iat).toBe(43200);
  expect(() => createSessionToken(0, "test-secret")).toThrow();
});
let db, hash, verify, handlers;
beforeEach(() => {
  db = { user: { findFirst: jest.fn(), create: jest.fn() } };
  hash = jest.fn().mockResolvedValue("hashed");
  verify = jest.fn().mockResolvedValue(true);
  handlers = createUserAuthHandlers(db, "test-secret", hash, verify);
});
const body = { username: "person@example.com", password: "password123", name: "Person" };
test("signup stores only a password hash", async () => {
  const res = response();
  await handlers.signup({ body }, res);
  expect(db.user.create).toHaveBeenCalledWith({
    data: { email: body.username, name: body.name, password: "hashed", passwordHashed: true },
  });
  expect(res.status).toHaveBeenCalledWith(201);
});
test("signup rejects duplicate and invalid accounts", async () => {
  const res = response();
  await handlers.signup({ body: {} }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  db.user.findFirst.mockResolvedValue({ id: 1 });
  await handlers.signup({ body }, res);
  expect(res.status).toHaveBeenCalledWith(409);
  expect(hash).not.toHaveBeenCalled();
});
test.each(["P2002", "OTHER"])("signup handles persistence failure %s", async (code) => {
  db.user.create.mockRejectedValue({ code });
  const res = response();
  await handlers.signup({ body }, res);
  expect(res.status).toHaveBeenCalledWith(code === "P2002" ? 409 : 503);
});
test("password login returns expiring token and does not query by password", async () => {
  db.user.findFirst.mockResolvedValue({ id: 1, password: "hashed", passwordHashed: true });
  const res = response();
  await handlers.signin({ body }, res);
  expect(db.user.findFirst).toHaveBeenCalledWith({ where: { email: body.username } });
  const claims = jwt.verify(res.json.mock.calls[0][0].token, "test-secret");
  expect(claims.exp - claims.iat).toBe(43200);
});
test.each([null, { id: 1, password: null, passwordHashed: false }])(
  "missing and Google-only users perform dummy verification",
  async (user) => {
    db.user.findFirst.mockResolvedValue(user);
    verify.mockResolvedValue(false);
    const res = response();
    await handlers.signin({ body }, res);
    expect(verify).toHaveBeenCalledWith(body.password, null);
    expect(res.status).toHaveBeenCalledWith(401);
  },
);
test("wrong passwords are rejected", async () => {
  db.user.findFirst.mockResolvedValue({ id: 1, password: "hashed", passwordHashed: true });
  verify.mockResolvedValue(false);
  const res = response();
  await handlers.signin({ body }, res);
  expect(res.status).toHaveBeenCalledWith(401);
});
test("unmigrated accounts fail closed", async () => {
  db.user.findFirst.mockResolvedValue({ id: 1, password: "plaintext", passwordHashed: false });
  const res = response();
  await handlers.signin({ body }, res);
  expect(res.status).toHaveBeenCalledWith(503);
  expect(verify).not.toHaveBeenCalled();
});
test("invalid input and database failures are safe", async () => {
  const res = response();
  await handlers.signin({ body: {} }, res);
  expect(res.status).toHaveBeenCalledWith(400);
  db.user.findFirst.mockRejectedValue(Error("private"));
  await handlers.signin({ body }, res);
  expect(res.status).toHaveBeenCalledWith(503);
  expect(JSON.stringify(res.json.mock.calls)).not.toContain("private");
});
