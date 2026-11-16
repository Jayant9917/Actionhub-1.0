import { OAuth2Client } from "google-auth-library";
import type { Prisma } from "./generated/prisma-new/client.js";
export type GoogleIdentity = { sub: string; email: string; name: string; nonce: string };
export async function verifyGoogleIdentity(
  idToken: string,
  clientId: string,
): Promise<GoogleIdentity> {
  const client = new OAuth2Client({ transporterOptions: { timeout: 15000, retry: false } });
  const ticket = await client.verifyIdToken({ idToken, audience: clientId });
  const payload = ticket.getPayload();
  if (
    !payload ||
    payload.email_verified !== true ||
    !payload.sub ||
    payload.sub.length > 255 ||
    typeof payload.email !== "string" ||
    payload.email.length > 320 ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email) ||
    typeof payload.nonce !== "string" ||
    (payload.azp && payload.azp !== clientId)
  )
    throw new Error("INVALID_GOOGLE_IDENTITY");
  return {
    sub: payload.sub,
    email: payload.email.toLowerCase(),
    name: (payload.name ?? "Google user").slice(0, 150),
    nonce: payload.nonce,
  };
}
export async function resolveGoogleUser(
  tx: Pick<Prisma.TransactionClient, "user">,
  identity: GoogleIdentity,
  linkOwner?: number,
): Promise<number> {
  const linked = await tx.user.findUnique({ where: { googleSubject: identity.sub } });
  if (linkOwner !== undefined) {
    if (linked && linked.id !== linkOwner) throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
    const result = await tx.user.updateMany({
      where: { id: linkOwner, OR: [{ googleSubject: null }, { googleSubject: identity.sub }] },
      data: { googleSubject: identity.sub },
    });
    if (!result.count) throw new Error("GOOGLE_ACCOUNT_ALREADY_LINKED");
    return linkOwner;
  }
  if (linked) return linked.id;
  // Existing password accounts must link while signed in, never solely by matching email.
  if (
    await tx.user.findFirst({ where: { email: { equals: identity.email, mode: "insensitive" } } })
  )
    throw new Error("GOOGLE_LINK_REQUIRED");
  const created = await tx.user.create({
    data: {
      email: identity.email,
      name: identity.name,
      googleSubject: identity.sub,
      password: null,
    },
  });
  return created.id;
}
