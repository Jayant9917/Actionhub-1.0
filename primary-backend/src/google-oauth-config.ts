export type GoogleOAuthSettings = {
  publicUrl?: string | undefined;
  clientId?: string | undefined;
  clientSecret?: string | undefined;
  encryptionKey?: string | undefined;
  jwtSecret: string;
};
export function googleOAuthOrigin(settings: GoogleOAuthSettings): string {
  const url = new URL(settings.publicUrl ?? "");
  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/" ||
    !(url.protocol === "https:" || (url.protocol === "http:" && url.hostname === "localhost"))
  )
    throw new Error("GOOGLE_OAUTH_NOT_CONFIGURED");
  return url.origin;
}
export function googleOAuthEnabled(settings: GoogleOAuthSettings): boolean {
  try {
    googleOAuthOrigin(settings);
    return !!(
      settings.clientId?.trim() &&
      settings.clientSecret?.trim() &&
      settings.encryptionKey &&
      settings.jwtSecret
    );
  } catch {
    return false;
  }
}
