import { createHmac } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "./generated/prisma-new/client.js";
export type AuthLimits = {
  loginWindowMs: number;
  loginIpLimit: number;
  loginAccountLimit: number;
  signupWindowMs: number;
  signupIpLimit: number;
};
type Database = Pick<PrismaClient, "$queryRaw" | "authRateLimit">;
export function createAuthRateLimiters(
  db: Database,
  settings: AuthLimits,
  secret: string,
  clock = () => new Date(),
) {
  let nextCleanup = 0;
  async function consume(
    scope: string,
    value: string,
    windowMs: number,
    limit: number,
    res: Response,
  ) {
    const now = clock(),
      resetAt = new Date(now.getTime() + windowMs);
    const key = createHmac("sha256", secret)
      .update(scope + ":" + value)
      .digest("hex");
    // PostgreSQL serializes updates to the same key, including requests on different API replicas.
    const rows = await db.$queryRaw<{ hits: number; resetAt: Date }[]>`
   INSERT INTO "AuthRateLimit" ("key","hits","resetAt") VALUES (${key},1,${resetAt})
   ON CONFLICT ("key") DO UPDATE SET
    "hits"=CASE WHEN "AuthRateLimit"."resetAt"<=${now} THEN 1 ELSE LEAST("AuthRateLimit"."hits"+1,1000000) END,
    "resetAt"=CASE WHEN "AuthRateLimit"."resetAt"<=${now} THEN ${resetAt} ELSE "AuthRateLimit"."resetAt" END
   RETURNING "hits","resetAt"`;
    const row = rows[0];
    if (!row) throw new Error("RATE_LIMIT_UNAVAILABLE");
    const seconds = Math.max(1, Math.ceil((row.resetAt.getTime() - now.getTime()) / 1000));
    res.setHeader("RateLimit-Limit", String(limit));
    res.setHeader("RateLimit-Remaining", String(Math.max(0, limit - row.hits)));
    res.setHeader("RateLimit-Reset", String(seconds));
    if (row.hits > limit) {
      res.setHeader("Retry-After", String(seconds));
      res
        .status(429)
        .json({ message: "Too many authentication attempts. Please wait and try again." });
      return false;
    }
    return true;
  }
  function middleware(kind: "login" | "signup") {
    return async (req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-store");
      try {
        const now = clock();
        if (now.getTime() >= nextCleanup) {
          nextCleanup = now.getTime() + 60000;
          await db.authRateLimit.deleteMany({
            where: { resetAt: { lt: new Date(now.getTime() - 86400000) } },
          });
        }
        const ip = req.ip ?? req.socket?.remoteAddress ?? "unknown";
        const windowMs = kind === "login" ? settings.loginWindowMs : settings.signupWindowMs;
        if (
          !(await consume(
            kind + "-ip",
            ip,
            windowMs,
            kind === "login" ? settings.loginIpLimit : settings.signupIpLimit,
            res,
          ))
        )
          return;
        const email =
          typeof req.body?.username === "string" ? req.body.username.trim().toLowerCase() : "";
        if (
          kind === "login" &&
          email &&
          email.length <= 320 &&
          !(await consume(
            "login-account",
            ip + "|" + email,
            windowMs,
            settings.loginAccountLimit,
            res,
          ))
        )
          return;
        next();
      } catch {
        return res.status(503).json({
          message: "Authentication is temporarily unavailable. Please try again shortly.",
        });
      }
    };
  }
  return { login: middleware("login"), signup: middleware("signup") };
}
