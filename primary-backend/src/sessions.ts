import jwt from "jsonwebtoken";
export const SESSION_SECONDS = 12 * 60 * 60;
export function createSessionToken(userId: number, secret: string) {
  if (!Number.isSafeInteger(userId) || userId < 1 || !secret.trim())
    throw new Error("INVALID_SESSION");
  return jwt.sign({ id: userId }, secret, { algorithm: "HS256", expiresIn: SESSION_SECONDS });
}
