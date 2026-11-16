import { createHash, randomBytes, randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import type { PrismaClient } from "./generated/prisma-new/client.js";
import { createSessionToken } from "./sessions.js";
import { credentialContext, encryptSecret, decryptSecret } from "./credentials.js";
import { googleOAuthOrigin, googleOAuthEnabled } from "./google-oauth-config.js";
import type { GoogleOAuthSettings } from "./google-oauth-config.js";
import { verifyGoogleIdentity, resolveGoogleUser } from "./google-identity.js";
const sheetsScope = "https://www.googleapis.com/auth/spreadsheets";
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
const cookieName = (id: string) => `ah_google_${id.slice(0, 16)}`;
function readCookie(req: Request, name: string) {
  return (
    (req.headers.cookie ?? "")
      .split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(name + "="))
      ?.slice(name.length + 1) ?? ""
  );
}
type Database = Pick<PrismaClient, "googleOAuthFlow" | "$transaction">;
export function createGoogleOAuthHandlers(
  db: Database,
  settings: GoogleOAuthSettings,
  fetcher: typeof fetch = fetch,
  verify = verifyGoogleIdentity,
  clock = () => new Date(),
) {
  const origin = () => googleOAuthOrigin(settings);
  const redirectUri = (purpose: string) =>
    `${origin()}/api/v1/oauth/google/${purpose === "sheets" ? "sheets" : "login"}/callback`;
  const cookieOptions = () => ({
    httpOnly: true,
    sameSite: "lax" as const,
    secure: origin().startsWith("https:"),
    path: "/api/v1/oauth/google",
  });
  function finish(res: Response, purpose: string, result: string) {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Referrer-Policy", "no-referrer");
    const path =
      purpose === "sheets" ? "/oauth/google/complete" : purpose === "link" ? "/settings" : "/login";
    return res.redirect(303, `${origin()}${path}?google=${result}`);
  }
  return {
    capabilities(_req: Request, res: Response) {
      res.setHeader("Cache-Control", "no-store");
      return res.json({ enabled: googleOAuthEnabled(settings) });
    },
    async start(req: Request, res: Response) {
      const purpose = String(req.params.purpose ?? "login");
      if (!["login", "link", "sheets"].includes(purpose))
        return res.status(404).json({ message: "Not found" });
      if (!googleOAuthEnabled(settings))
        return res.status(503).json({ message: "Google OAuth is not configured yet." });
      if (req.headers.origin !== origin())
        return res
          .status(400)
          .json({ message: "Open ActionHub at OAUTH_PUBLIC_URL before connecting Google." });
      const ownerId = purpose === "login" ? null : Number(req.id);
      if (ownerId !== null && (!Number.isSafeInteger(ownerId) || ownerId < 1))
        return res.status(403).json({ message: "Sign in first." });
      const name =
        purpose === "sheets" && typeof req.body?.name === "string"
          ? req.body.name.trim()
          : "Google sign-in";
      if (!name || name.length > 80)
        return res.status(400).json({ message: "Enter a connection name (1-80 characters)." });
      const state = randomBytes(32).toString("hex"),
        id = hash(state),
        binding = randomBytes(32).toString("hex"),
        nonce = randomBytes(32).toString("hex"),
        verifier = randomBytes(32).toString("base64url");
      try {
        await db.googleOAuthFlow.deleteMany({ where: { expiresAt: { lt: clock() } } });
        await db.googleOAuthFlow.create({
          data: {
            id,
            ownerId,
            purpose,
            name,
            bindingHash: hash(binding),
            nonceHash: hash(nonce),
            verifier: encryptSecret(verifier, settings.encryptionKey!, `google-oauth:${id}`),
            expiresAt: new Date(clock().getTime() + 600000),
          },
        });
        res.cookie(cookieName(id), binding, { ...cookieOptions(), maxAge: 600000 });
        res.setHeader("Cache-Control", "no-store");
        const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
        for (const [key, value] of Object.entries({
          client_id: settings.clientId!,
          redirect_uri: redirectUri(purpose),
          response_type: "code",
          scope: purpose === "sheets" ? sheetsScope : "openid email profile",
          state,
          nonce,
          code_challenge: createHash("sha256").update(verifier).digest("base64url"),
          code_challenge_method: "S256",
          prompt: purpose === "sheets" ? "consent" : "select_account",
        }))
          url.searchParams.set(key, value);
        if (purpose === "sheets") url.searchParams.set("access_type", "offline");
        return res.json({ authorizationUrl: url.toString(), attemptId: id });
      } catch {
        return res
          .status(503)
          .json({ message: "Could not start Google authorization. Please try again." });
      }
    },
    async callback(req: Request, res: Response) {
      if (!googleOAuthEnabled(settings))
        return res.status(503).send("Google OAuth is not configured.");
      const route = String(req.params.mode);
      if (!["login", "sheets"].includes(route)) return res.status(404).send("Not found");
      const state = typeof req.query.state === "string" ? req.query.state : "";
      if (!/^[a-f0-9]{64}$/.test(state)) return finish(res, route, "failed");
      const id = hash(state),
        binding = readCookie(req, cookieName(id));
      if (!/^[a-f0-9]{64}$/.test(binding)) return finish(res, route, "failed");
      let purpose = route;
      try {
        const claim = await db.googleOAuthFlow.updateMany({
          where: {
            id,
            bindingHash: hash(binding),
            purpose: { in: route === "sheets" ? ["sheets"] : ["login", "link"] },
            status: "pending",
            expiresAt: { gt: clock() },
          },
          data: { status: "processing" },
        });
        if (!claim.count) return finish(res, route, "failed");
        const flow = await db.googleOAuthFlow.findUniqueOrThrow({ where: { id } });
        purpose = flow.purpose;
        res.clearCookie(cookieName(id), cookieOptions());
        if (req.query.error) {
          await db.googleOAuthFlow.update({ where: { id }, data: { status: "denied" } });
          return finish(res, purpose, "denied");
        }
        const code = typeof req.query.code === "string" ? req.query.code : "";
        if (!code || code.length > 4096) throw new Error();
        const form = new URLSearchParams({
          code,
          client_id: settings.clientId!,
          client_secret: settings.clientSecret!,
          redirect_uri: redirectUri(purpose),
          grant_type: "authorization_code",
          code_verifier: decryptSecret(
            flow.verifier,
            settings.encryptionKey!,
            `google-oauth:${id}`,
          ),
        });
        const response = await fetcher("https://oauth2.googleapis.com/token", {
          method: "POST",
          redirect: "error",
          signal: AbortSignal.timeout(15000),
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: form.toString(),
        });
        if (!response.ok) throw new Error();
        const result = (await response.json()) as {
          id_token?: unknown;
          refresh_token?: unknown;
          scope?: unknown;
        };
        if (purpose === "sheets") {
          if (
            !flow.ownerId ||
            typeof result.refresh_token !== "string" ||
            !result.refresh_token ||
            result.refresh_token.length > 10000 ||
            typeof result.scope !== "string" ||
            !result.scope.split(" ").includes(sheetsScope)
          )
            throw new Error();
          await db.$transaction(async (tx) => {
            const credential = {
              id: randomUUID(),
              ownerId: flow.ownerId!,
              provider: "google.oauth",
            };
            await tx.credential.create({
              data: {
                ...credential,
                name: flow.name,
                encryptedSecret: encryptSecret(
                  JSON.stringify({ kind: "google.oauth", refresh_token: result.refresh_token }),
                  settings.encryptionKey!,
                  credentialContext(credential),
                ),
              },
            });
            await tx.googleOAuthFlow.update({
              where: { id },
              data: { status: "connected", credentialId: credential.id },
            });
          });
          return finish(res, purpose, "connected");
        }
        if (typeof result.id_token !== "string" || result.id_token.length > 20000)
          throw new Error();
        const identity = await verify(result.id_token, settings.clientId!);
        if (hash(identity.nonce) !== flow.nonceHash) throw new Error();
        const handoff = randomBytes(32).toString("hex");
        await db.$transaction(async (tx) => {
          if (purpose === "link" && !flow.ownerId) throw new Error();
          const userId = await resolveGoogleUser(
            tx,
            identity,
            purpose === "link" ? flow.ownerId! : undefined,
          );
          await tx.googleOAuthFlow.update({
            where: { id },
            data: {
              status: "connected",
              ownerId: userId,
              ...(purpose === "login"
                ? {
                    sessionHash: hash(handoff),
                    sessionExpiresAt: new Date(clock().getTime() + 180000),
                  }
                : {}),
            },
          });
        });
        if (purpose === "link") return finish(res, purpose, "linked");
        res.cookie("ah_google_session", handoff, { ...cookieOptions(), maxAge: 180000 });
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("Referrer-Policy", "no-referrer");
        return res.redirect(303, `${origin()}/auth/google/complete`);
      } catch (error) {
        await db.googleOAuthFlow
          .updateMany({
            where: { id, bindingHash: hash(binding), status: "processing" },
            data: { status: "failed" },
          })
          .catch(() => {});
        return finish(
          res,
          purpose,
          error instanceof Error && error.message === "GOOGLE_LINK_REQUIRED"
            ? "link_required"
            : "failed",
        );
      }
    },
    async session(req: Request, res: Response) {
      if (!googleOAuthEnabled(settings) || req.headers.origin !== origin())
        return res.status(403).json({ message: "Google sign-in could not be confirmed." });
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Referrer-Policy", "no-referrer");
      const handoff = readCookie(req, "ah_google_session");
      if (!/^[a-f0-9]{64}$/.test(handoff))
        return res.status(403).json({ message: "Google sign-in expired. Please try again." });
      try {
        const where = {
          sessionHash: hash(handoff),
          purpose: "login",
          status: "connected",
          expiresAt: { gt: clock() },
          sessionExpiresAt: { gt: clock() },
        };
        const claim = await db.googleOAuthFlow.updateMany({ where, data: { status: "completed" } });
        if (!claim.count)
          return res.status(403).json({ message: "Google sign-in expired. Please try again." });
        const flow = await db.googleOAuthFlow.findUniqueOrThrow({
          where: { sessionHash: hash(handoff) },
        });
        if (!flow.ownerId) throw new Error();
        res.clearCookie("ah_google_session", cookieOptions());
        return res.json({
          token: createSessionToken(flow.ownerId, settings.jwtSecret),
        });
      } catch {
        return res
          .status(503)
          .json({ message: "Could not finish Google sign-in. Please try again." });
      }
    },
    async status(req: Request, res: Response) {
      res.setHeader("Cache-Control", "no-store");
      if (!/^[a-f0-9]{64}$/.test(String(req.params.attemptId)))
        return res.status(404).json({ message: "Connection attempt not found." });
      try {
        const flow = await db.googleOAuthFlow.findFirst({
          where: {
            id: String(req.params.attemptId),
            ownerId: Number(req.id),
            purpose: "sheets",
            expiresAt: { gt: clock() },
          },
          select: { status: true, credentialId: true },
        });
        if (!flow)
          return res
            .status(404)
            .json({ message: "Google connection expired. Please connect again." });
        return res.json(flow);
      } catch {
        return res.status(503).json({ message: "Could not check Google connection." });
      }
    },
  };
}
