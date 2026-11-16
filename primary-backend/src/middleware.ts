import type { NextFunction, Request, Response } from "express";
import { SESSION_SECONDS } from "./sessions.js";
import jwt from "jsonwebtoken";
import { JWT_PASSWORD } from "./config.js";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || typeof authHeader !== "string") {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader.trim();
  if (!token || token === "null" || token === "undefined") {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }
  try {
    const payload = jwt.verify(token, JWT_PASSWORD, {
      algorithms: ["HS256"],
      maxAge: SESSION_SECONDS,
    }) as { id: number | string; iat?: number; exp?: number };
    if (
      !Number.isFinite(payload?.iat) ||
      !Number.isFinite(payload?.exp) ||
      payload.exp! <= payload.iat! ||
      payload.exp! - payload.iat! > SESSION_SECONDS
    ) {
      return res.status(401).json({ message: "Your session has expired. Please sign in again." });
    }
    const id = payload?.id;
    const userId =
      typeof id === "number" ? id : typeof id === "string" && /^\d+$/.test(id) ? Number(id) : NaN;
    if (!Number.isSafeInteger(userId) || userId < 1) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.id = String(userId);
    next();
  } catch (e) {
    return res.status(401).json({
      message: "You are not logged in",
    });
  }
}
