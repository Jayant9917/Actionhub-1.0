import { Router } from "express";
import { authMiddleware } from "../middleware.js";
import { prismaClient } from "../db/index.js";
import { JWT_PASSWORD, config } from "../config.js";
import { createUserAuthHandlers } from "../user-auth.js";
import { createAuthRateLimiters } from "../auth-rate-limit.js";
const router = Router();
export const authRateLimiters = createAuthRateLimiters(
  prismaClient,
  config.authLimits,
  JWT_PASSWORD,
);
const handlers = createUserAuthHandlers(prismaClient, JWT_PASSWORD);
router.post("/signup", authRateLimiters.signup, handlers.signup);
router.post("/signin", authRateLimiters.login, handlers.signin);
router.get("/", authMiddleware, async (req, res) => {
  const id = req.id;
  if (!id) {
    return res.status(403).json({
      message: "Unauthorized",
    });
  }

  const user = await prismaClient.user.findFirst({
    where: {
      id: parseInt(id),
    },
    select: {
      name: true,
      email: true,
      googleSubject: true,
    },
  });

  return res.json({
    user: user ? { name: user.name, email: user.email, googleLinked: !!user.googleSubject } : null,
  });
});

export const userRouter = router;
