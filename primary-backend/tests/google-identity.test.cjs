const mockVerify = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => ({ verifyIdToken: mockVerify })),
}));
const { verifyGoogleIdentity, resolveGoogleUser } = require("../src/google-identity.ts");
const identity = { sub: "stable-subject", email: "owner@gmail.com", name: "Owner", nonce: "nonce" };
beforeEach(() =>
  mockVerify.mockResolvedValue({ getPayload: () => ({ ...identity, email_verified: true }) }),
);
test("uses official signature, issuer, expiry and audience verification and returns stable subject", async () => {
  await expect(verifyGoogleIdentity("signed-token", "client")).resolves.toEqual(identity);
  expect(mockVerify).toHaveBeenCalledWith({ idToken: "signed-token", audience: "client" });
});
test.each([
  { email_verified: false },
  { sub: "" },
  { nonce: undefined },
  { email: "invalid" },
  { azp: "other-client" },
])("rejects invalid identity claims %j", async (change) => {
  mockVerify.mockResolvedValue({
    getPayload: () => ({ ...identity, email_verified: true, ...change }),
  });
  await expect(verifyGoogleIdentity("token", "client")).rejects.toThrow();
});
test("refuses linking a Google subject owned by another user", async () => {
  const tx = {
    user: { findUnique: jest.fn().mockResolvedValue({ id: 99 }), updateMany: jest.fn() },
  };
  await expect(resolveGoogleUser(tx, identity, 2)).rejects.toThrow("GOOGLE_ACCOUNT_ALREADY_LINKED");
  expect(tx.user.updateMany).not.toHaveBeenCalled();
});
test("does not replace a user's different linked Google identity", async () => {
  const tx = {
    user: {
      findUnique: jest.fn().mockResolvedValue(null),
      updateMany: jest.fn().mockResolvedValue({ count: 0 }),
    },
  };
  await expect(resolveGoogleUser(tx, identity, 2)).rejects.toThrow("GOOGLE_ACCOUNT_ALREADY_LINKED");
});

test("invalid Google signatures/audience/expiry errors are not bypassed", async () => {
  mockVerify.mockRejectedValue(new Error("invalid Google token"));
  await expect(verifyGoogleIdentity("forged-token", "client")).rejects.toThrow();
});
