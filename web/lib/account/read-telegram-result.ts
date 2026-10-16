// The login data Telegram puts into the address after the sign-in: "#tgAuthResult=<base64 JSON>"
// (base64url, sometimes without padding). Medusa checks its signature; here it is only decoded.

export function readTelegramResult(hash: string): Record<string, unknown> | null {
  const match = /(?:^#|&)tgAuthResult=([A-Za-z0-9+/_=-]+)/.exec(hash);
  if (!match) return null;
  try {
    const base64 = match[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
    const data: unknown = JSON.parse(new TextDecoder().decode(bytes));
    return data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
