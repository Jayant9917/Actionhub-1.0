import type { Request, Response } from "express";
import type { PrismaClient } from "./generated/prisma-new/client.js";
import { SigninSchema, SignupSchema } from "./types.js";
import { hashPassword, verifyPassword } from "./passwords.js";
import { createSessionToken } from "./sessions.js";
export function createUserAuthHandlers(
  db: Pick<PrismaClient, "user">,
  secret: string,
  hash = hashPassword,
  verify = verifyPassword,
) {
  return {
    async signup(req: Request, res: Response) {
      const parsed = SignupSchema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({ message: "Enter a valid email, name and password of at least six characters." });
      try {
        const existing = await db.user.findFirst({
          where: { email: { equals: parsed.data.username, mode: "insensitive" } },
          select: { id: true },
        });
        if (existing)
          return res
            .status(409)
            .json({ message: "An account already exists with this email. Please sign in." });
        const password = await hash(parsed.data.password);
        await db.user.create({
          data: {
            email: parsed.data.username,
            name: parsed.data.name,
            password,
            passwordHashed: true,
          },
        });
        return res.status(201).json({ message: "Account created. You can now sign in." });
      } catch (error) {
        if ((error as { code?: string })?.code === "P2002")
          return res
            .status(409)
            .json({ message: "An account already exists with this email. Please sign in." });
        return res
          .status(503)
          .json({ message: "Could not create your account right now. Please try again shortly." });
      }
    },
    async signin(req: Request, res: Response) {
      const parsed = SigninSchema.safeParse(req.body);
      if (!parsed.success)
        return res.status(400).json({ message: "Enter a valid email and password." });
      try {
        const user = await db.user.findFirst({ where: { email: parsed.data.username } });
        if (user?.password && !user.passwordHashed)
          return res.status(503).json({
            message: "Account security upgrade is in progress. Please try again shortly.",
          });
        const accepted = await verify(parsed.data.password, user?.password ?? null);
        if (!user || !accepted)
          return res.status(401).json({ message: "Email or password is incorrect." });
        return res.json({ token: createSessionToken(user.id, secret) });
      } catch {
        return res
          .status(503)
          .json({ message: "Sign-in is temporarily unavailable. Please try again shortly." });
      }
    },
  };
}
