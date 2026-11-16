import "dotenv/config";
import { readEncryptionKey } from "./credentials.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value?.trim()) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function port(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  if (!/^\d+$/.test(raw)) throw new Error(`Invalid port: ${name}`);
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error(`Invalid port: ${name}`);
  }
  return value;
}

function databaseUrl(): string {
  const value = required("DATABASE_URL");
  try {
    const url = new URL(value);
    if (
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      !url.hostname ||
      url.pathname.length < 2
    )
      throw new Error();
  } catch {
    throw new Error("Invalid PostgreSQL URL: DATABASE_URL");
  }
  return value;
}

function authInteger(name: string, fallback: number, maximum: number, minimum = 1) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!/^\d+$/.test(raw) || !Number.isSafeInteger(value) || value < minimum || value > maximum)
    throw new Error(`Invalid ${name}`);
  return value;
}
export const config = {
  authLimits: {
    loginWindowMs: authInteger("AUTH_LOGIN_WINDOW_MS", 900000, 86400000, 1000),
    loginIpLimit: authInteger("AUTH_LOGIN_IP_LIMIT", 30, 10000),
    loginAccountLimit: authInteger("AUTH_LOGIN_ACCOUNT_LIMIT", 10, 10000),
    signupWindowMs: authInteger("AUTH_SIGNUP_WINDOW_MS", 3600000, 86400000, 1000),
    signupIpLimit: authInteger("AUTH_SIGNUP_IP_LIMIT", 5, 10000),
  },
  testEventsEnabled: process.env.APP_ENV === "development" && process.env.NODE_ENV !== "production",
  databaseUrl: databaseUrl(),
  port: port("PORT", 3000),
  encryptionKey: readEncryptionKey(process.env.CREDENTIAL_ENCRYPTION_KEY),
  githubSetupSecret: process.env.GITHUB_SECRETS,
  googleOAuth: {
    publicUrl: process.env.GOOGLE_OAUTH_PUBLIC_URL,
    clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    encryptionKey: readEncryptionKey(process.env.CREDENTIAL_ENCRYPTION_KEY),
    jwtSecret: required("JWT_PASSWORD"),
  },
  githubSetupWorkflowId: process.env.GITHUB_SETUP_WORKFLOW_ID,
};
export const JWT_PASSWORD = required("JWT_PASSWORD");
