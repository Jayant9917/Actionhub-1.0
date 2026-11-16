import { JWT, OAuth2Client } from "google-auth-library";
import { ActionError } from "./actions/registry.js";
export async function googleAccessToken(
  credentials:
    | { client_email: string; private_key: string }
    | { kind: "google.oauth"; refresh_token: string },
): Promise<string> {
  try {
    if ("kind" in credentials) {
      if (!process.env.GOOGLE_OAUTH_CLIENT_ID || !process.env.GOOGLE_OAUTH_CLIENT_SECRET)
        throw new ActionError("GOOGLE_OAUTH_NOT_CONFIGURED", "failed");
      const client = new OAuth2Client({
        clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
        clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
        transporterOptions: { timeout: 15000, retry: false },
      });
      client.setCredentials({ refresh_token: credentials.refresh_token });
      const result = await client.getAccessToken();
      if (!result.token) throw new ActionError("GOOGLE_RECONNECT_REQUIRED", "failed");
      return result.token;
    }
    const client = new JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      transporterOptions: { timeout: 15000, retry: false },
    });
    const result = await client.getAccessToken();
    if (!result.token) throw new ActionError("GOOGLE_AUTH_REJECTED", "failed");
    return result.token;
  } catch (error) {
    if (error instanceof ActionError) throw error;
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    // Authentication happens before appending, so a retry here cannot duplicate a row.
    throw new ActionError(
      "kind" in credentials && status && status >= 400 && status < 500 && status !== 429
        ? "GOOGLE_RECONNECT_REQUIRED"
        : "GOOGLE_AUTH_UNAVAILABLE",
      status && status >= 400 && status < 500 && status !== 429 ? "failed" : "retry",
    );
  }
}
