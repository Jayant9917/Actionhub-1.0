const { createGoogleOAuthHandlers } = require("../src/google-oauth.ts");
const { googleOAuthEnabled, googleOAuthOrigin } = require("../src/google-oauth-config.ts");
const { decryptSecret, credentialContext } = require("../src/credentials.ts");
const jwt = require("jsonwebtoken");
const settings = {
  publicUrl: "https://actionhub.example.com",
  encryptionKey: "ab".repeat(32),
  clientId: "google-client",
  clientSecret: "private-client-secret",
  jwtSecret: "test-jwt-secret",
};
const scope = "https://www.googleapis.com/auth/spreadsheets";
const now = new Date("2026-11-18T09:00:00Z");
let db, tx, res, fetcher, verify, flow;
beforeEach(() => {
  flow = null;
  const storage = {
    deleteMany: jest.fn(),
    create: jest.fn(({ data }) => {
      flow = { ...data, status: "pending" };
      return flow;
    }),
    updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    findUniqueOrThrow: jest.fn(() => Promise.resolve(flow)),
    findFirst: jest.fn(),
    update: jest.fn(({ data }) => {
      Object.assign(flow, data);
      return flow;
    }),
  };
  tx = {
    googleOAuthFlow: storage,
    credential: { create: jest.fn() },
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      findFirst: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ id: 9 }),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
  };
  db = { googleOAuthFlow: storage, $transaction: jest.fn((fn) => fn(tx)) };
  res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
    setHeader: jest.fn(),
    cookie: jest.fn(),
    clearCookie: jest.fn(),
    redirect: jest.fn(),
    send: jest.fn(),
  };
  fetcher = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      id_token: "google-signed-id-token",
      refresh_token: "private-refresh-token",
      scope,
    }),
  });
  verify = jest.fn();
});
const handlers = () => createGoogleOAuthHandlers(db, settings, fetcher, verify, () => now);
async function start(purpose = "login") {
  await handlers().start(
    {
      id: purpose === "login" ? undefined : "2",
      params: { purpose },
      headers: { origin: settings.publicUrl },
      body: { name: "My Sheets" },
    },
    res,
  );
  const data = res.json.mock.calls.at(-1)[0],
    url = new URL(data.authorizationUrl),
    cookie = res.cookie.mock.calls.at(-1);
  verify.mockResolvedValue({
    sub: "google-subject",
    email: "owner@gmail.com",
    name: "Owner",
    nonce: url.searchParams.get("nonce"),
  });
  return {
    url,
    id: data.attemptId,
    req: {
      params: { mode: purpose === "sheets" ? "sheets" : "login" },
      headers: { cookie: cookie[0] + "=" + cookie[1] },
      query: { state: url.searchParams.get("state"), code: "authorization-code" },
    },
  };
}
test("login requests identity only, with encrypted PKCE, nonce, state and a private browser cookie", async () => {
  const { url, id } = await start();
  expect(url.searchParams.get("scope")).toBe("openid email profile");
  expect(url.searchParams.has("access_type")).toBe(false);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(flow).toMatchObject({
    ownerId: null,
    purpose: "login",
    expiresAt: new Date("2026-11-18T09:10:00Z"),
  });
  expect(id).not.toBe(url.searchParams.get("state"));
  expect(flow.verifier).not.toContain(
    decryptSecret(flow.verifier, settings.encryptionKey, `google-oauth:${id}`),
  );
  expect(res.cookie.mock.calls[0][2]).toMatchObject({
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  });
  expect(url.toString()).not.toContain("private-client-secret");
});
test("creates a Google-only user and exchanges a cookie handoff for an expiring ActionHub session", async () => {
  const { req } = await start();
  await handlers().callback(req, res);
  expect(tx.user.create).toHaveBeenCalledWith({
    data: {
      email: "owner@gmail.com",
      name: "Owner",
      googleSubject: "google-subject",
      password: null,
    },
  });
  expect(res.redirect).toHaveBeenCalledWith(
    303,
    "https://actionhub.example.com/auth/google/complete",
  );
  const cookie = res.cookie.mock.calls.find((c) => c[0] === "ah_google_session");
  expect(cookie).toBeDefined();
  await handlers().session(
    { headers: { origin: settings.publicUrl, cookie: "ah_google_session=" + cookie[1] } },
    res,
  );
  const token = res.json.mock.calls.at(-1)[0].token,
    payload = jwt.verify(token, settings.jwtSecret);
  expect(payload.id).toBe(9);
  expect(payload.exp - payload.iat).toBe(43200);
  expect(JSON.stringify(res.redirect.mock.calls)).not.toContain(token);
  expect(tx.credential.create).not.toHaveBeenCalled();
  const form = new URLSearchParams(fetcher.mock.calls[0][1].body);
  expect(form.get("code_verifier")).toHaveLength(43);
  expect(form.get("redirect_uri")).toBe(settings.publicUrl + "/api/v1/oauth/google/login/callback");
});
test("an already linked Google identity signs into the same account", async () => {
  const { req } = await start();
  tx.user.findUnique.mockResolvedValue({ id: 4 });
  await handlers().callback(req, res);
  expect(tx.user.create).not.toHaveBeenCalled();
  expect(flow.ownerId).toBe(4);
});
test("matching email alone never joins a password account", async () => {
  const { req } = await start();
  tx.user.findFirst.mockResolvedValue({ id: 2 });
  await handlers().callback(req, res);
  expect(tx.user.create).not.toHaveBeenCalled();
  expect(res.redirect).toHaveBeenCalledWith(
    303,
    settings.publicUrl + "/login?google=link_required",
  );
  expect(res.cookie.mock.calls.some((c) => c[0] === "ah_google_session")).toBe(false);
});
test("signed-in users can explicitly link Google without granting Sheets permission", async () => {
  const { req, url } = await start("link");
  await handlers().callback(req, res);
  expect(url.searchParams.get("scope")).not.toContain("spreadsheets");
  expect(tx.user.updateMany.mock.calls[0][0]).toMatchObject({
    where: { id: 2 },
    data: { googleSubject: "google-subject" },
  });
  expect(res.redirect).toHaveBeenCalledWith(303, settings.publicUrl + "/settings?google=linked");
  expect(tx.credential.create).not.toHaveBeenCalled();
});
test("Sheets authorization saves an encrypted owner-specific refresh token without logging in", async () => {
  const { req, url } = await start("sheets");
  expect(url.searchParams.get("scope")).toBe(scope);
  expect(url.searchParams.get("access_type")).toBe("offline");
  await handlers().callback(req, res);
  const credential = tx.credential.create.mock.calls[0][0].data;
  expect(credential).toMatchObject({ ownerId: 2, provider: "google.oauth", name: "My Sheets" });
  expect(
    JSON.parse(
      decryptSecret(
        credential.encryptedSecret,
        settings.encryptionKey,
        credentialContext(credential),
      ),
    ),
  ).toEqual({ kind: "google.oauth", refresh_token: "private-refresh-token" });
  expect(verify).not.toHaveBeenCalled();
  expect(tx.user.create).not.toHaveBeenCalled();
  expect(
    JSON.stringify(res.json.mock.calls) + JSON.stringify(res.redirect.mock.calls),
  ).not.toContain("private-refresh-token");
});
test("replayed, expired and wrong-browser callbacks do not exchange codes", async () => {
  const { req } = await start();
  db.googleOAuthFlow.updateMany.mockResolvedValue({ count: 0 });
  await handlers().callback(req, res);
  expect(fetcher).not.toHaveBeenCalled();
  expect(db.googleOAuthFlow.updateMany.mock.calls[0][0].where).toMatchObject({
    status: "pending",
    bindingHash: expect.any(String),
    expiresAt: { gt: now },
  });
});
test("the same callback cannot create a second session or credential", async () => {
  const { req } = await start();
  db.googleOAuthFlow.updateMany
    .mockResolvedValueOnce({ count: 1 })
    .mockResolvedValueOnce({ count: 0 });
  await handlers().callback(req, res);
  await handlers().callback(req, res);
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(tx.user.create).toHaveBeenCalledTimes(1);
});
test("missing browser cookie rejects authorization", async () => {
  const { req } = await start();
  req.headers.cookie = "";
  await handlers().callback(req, res);
  expect(fetcher).not.toHaveBeenCalled();
});
test("wrong ID-token nonce rejects login", async () => {
  const { req } = await start();
  verify.mockResolvedValue({ sub: "sub", email: "user@gmail.com", name: "User", nonce: "wrong" });
  await handlers().callback(req, res);
  expect(tx.user.create).not.toHaveBeenCalled();
  expect(res.redirect).toHaveBeenCalledWith(303, expect.stringContaining("failed"));
});
test("Google cancellation leaves accounts and connections unchanged", async () => {
  const { req } = await start();
  req.query.error = "access_denied";
  await handlers().callback(req, res);
  expect(fetcher).not.toHaveBeenCalled();
  expect(flow.status).toBe("denied");
});
test.each([{ scope }, { refresh_token: "refresh", scope: "other-scope" }])(
  "Sheets requires offline access and the granted Sheets scope",
  async (result) => {
    const { req } = await start("sheets");
    fetcher.mockResolvedValue({ ok: true, json: async () => result });
    await handlers().callback(req, res);
    expect(tx.credential.create).not.toHaveBeenCalled();
    expect(res.redirect).toHaveBeenCalledWith(303, expect.stringContaining("failed"));
  },
);
test("provider errors and tokens never appear in the browser response", async () => {
  const { req } = await start();
  fetcher.mockRejectedValue(new Error("private-provider-token"));
  await handlers().callback(req, res);
  expect(JSON.stringify(res.redirect.mock.calls)).not.toContain("private-provider-token");
});
test("start enforces origin, authenticated Sheets/link users, and valid purpose/name", async () => {
  for (const request of [
    { params: { purpose: "unknown" }, headers: {}, body: {} },
    { params: { purpose: "sheets" }, headers: { origin: settings.publicUrl }, body: {} },
    { params: { purpose: "login" }, headers: { origin: "https://evil.example" }, body: {} },
    {
      id: "2",
      params: { purpose: "sheets" },
      headers: { origin: settings.publicUrl },
      body: { name: "" },
    },
  ])
    await handlers().start(request, res);
  expect(db.googleOAuthFlow.create).not.toHaveBeenCalled();
  expect(res.status.mock.calls.map((c) => c[0])).toEqual([404, 403, 400, 400]);
});
test("session handoff is same-origin and single-use", async () => {
  await handlers().session({ headers: { origin: "https://evil.example" } }, res);
  await handlers().session({ headers: { origin: settings.publicUrl } }, res);
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json.mock.calls.every((c) => !c[0].token)).toBe(true);
});
test("Sheets polling is owner-scoped and does not return token fields", async () => {
  db.googleOAuthFlow.findFirst.mockResolvedValue({
    status: "connected",
    credentialId: "credential",
  });
  await handlers().status({ id: "2", params: { attemptId: "a".repeat(64) } }, res);
  expect(db.googleOAuthFlow.findFirst.mock.calls[0][0]).toMatchObject({
    where: { ownerId: 2, purpose: "sheets" },
    select: { status: true, credentialId: true },
  });
});
test("reports unconfigured Google cleanly", () => {
  expect(googleOAuthEnabled({ ...settings, clientSecret: "" })).toBe(false);
  handlers().capabilities({}, res);
  expect(res.json).toHaveBeenCalledWith({ enabled: true });
});
test.each([
  "http://public.example",
  "https://user:pass@example.com",
  "https://example.com/path",
  "",
])("rejects invalid public origin %s", (publicUrl) =>
  expect(() => googleOAuthOrigin({ ...settings, publicUrl })).toThrow(),
);

test("an already-consumed login handoff cannot issue another session", async () => {
  const { req } = await start();
  await handlers().callback(req, res);
  const cookie = res.cookie.mock.calls.find((c) => c[0] === "ah_google_session");
  db.googleOAuthFlow.updateMany.mockResolvedValue({ count: 0 });
  await handlers().session(
    { headers: { origin: settings.publicUrl, cookie: "ah_google_session=" + cookie[1] } },
    res,
  );
  expect(res.status).toHaveBeenCalledWith(403);
  expect(res.json.mock.calls.every((c) => !c[0].token)).toBe(true);
});
