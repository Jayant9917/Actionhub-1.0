const mockGet = jest.fn(),
  mockSet = jest.fn();
const mockClient = jest.fn(() => ({ setCredentials: mockSet, getAccessToken: mockGet }));
jest.mock("google-auth-library", () => ({ OAuth2Client: mockClient, JWT: jest.fn() }));
const { googleAccessToken } = require("../src/google-token.ts");
const { parseGoogleOAuthConnection } = require("../src/connection-secrets.ts");
const originalEnv = process.env;
beforeEach(() => {
  process.env = {
    ...originalEnv,
    GOOGLE_OAUTH_CLIENT_ID: "client",
    GOOGLE_OAUTH_CLIENT_SECRET: "secret",
  };
  mockGet.mockResolvedValue({ token: "fresh-access-token" });
});
afterEach(() => {
  process.env = originalEnv;
});
const connection = { kind: "google.oauth", refresh_token: "private-refresh-token" };
test("refreshes a Google user's token for background Sheets execution", async () => {
  await expect(googleAccessToken(connection)).resolves.toBe("fresh-access-token");
  expect(mockSet).toHaveBeenCalledWith({ refresh_token: "private-refresh-token" });
  expect(mockClient).toHaveBeenCalledWith(
    expect.objectContaining({
      clientId: "client",
      clientSecret: "secret",
      transporterOptions: { timeout: 15000, retry: false },
    }),
  );
});
test("missing worker OAuth app credentials fail before any write", async () => {
  delete process.env.GOOGLE_OAUTH_CLIENT_SECRET;
  await expect(googleAccessToken(connection)).rejects.toMatchObject({
    code: "GOOGLE_OAUTH_NOT_CONFIGURED",
  });
});
test.each([
  [400, "failed", "GOOGLE_RECONNECT_REQUIRED"],
  [429, "retry", "GOOGLE_AUTH_UNAVAILABLE"],
  [503, "retry", "GOOGLE_AUTH_UNAVAILABLE"],
])("classifies refresh failure %s", async (status, outcome, code) => {
  mockGet.mockRejectedValue({ response: { status } });
  await expect(googleAccessToken(connection)).rejects.toMatchObject({ code, outcome });
});
test("empty refreshed token requires reconnecting", async () => {
  mockGet.mockResolvedValue({ token: null });
  await expect(googleAccessToken(connection)).rejects.toMatchObject({
    code: "GOOGLE_RECONNECT_REQUIRED",
  });
});
test("validates OAuth refresh credentials without requiring service-account JSON", () => {
  expect(parseGoogleOAuthConnection(connection)).toEqual(connection);
  expect(() => parseGoogleOAuthConnection({ kind: "google.oauth", refresh_token: "" })).toThrow();
});
