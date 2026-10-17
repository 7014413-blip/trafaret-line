// Check of the Telegram login data (core.telegram.org/widgets/login#checking-authorization):
// the fields except "hash", sorted and joined as "key=value" lines, signed with HMAC-SHA256
// whose key is SHA-256 of the bot token. The data is accepted for 24 hours after the sign-in.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import type { TelegramLogin } from "../../types/account";

export const TELEGRAM_LOGIN_MAX_AGE_S = 24 * 60 * 60;
const FIELDS = ["id", "first_name", "last_name", "username", "photo_url", "auth_date"] as const;

/** The person from the login data, or null when the signature, the age or the fields are wrong. */
export function verifyTelegramLogin(data: unknown, botToken: string, nowS: number = Math.floor(Date.now() / 1000)): TelegramLogin | null {
  if (!data || typeof data !== "object" || !botToken) return null;
  const raw = data as Record<string, unknown>;
  if (typeof raw.hash !== "string" || !/^[0-9a-f]{64}$/.test(raw.hash)) return null;
  const lines: string[] = [];
  for (const key of FIELDS) {
    const value = raw[key];
    if (value === undefined || value === null) continue;
    if (typeof value !== "string" && typeof value !== "number") return null;
    lines.push(`${key}=${value}`);
  }
  const secret = createHash("sha256").update(botToken).digest();
  const expected = Buffer.from(createHmac("sha256", secret).update(lines.sort().join("\n")).digest("hex"));
  const given = Buffer.from(raw.hash);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;

  const id = Number(raw.id);
  const authDate = Number(raw.auth_date);
  if (!Number.isSafeInteger(id) || id <= 0 || !Number.isSafeInteger(authDate)) return null;
  if (authDate > nowS + 60 || nowS - authDate > TELEGRAM_LOGIN_MAX_AGE_S) return null;
  return {
    id,
    firstName: String(raw.first_name ?? "").slice(0, 100),
    lastName: String(raw.last_name ?? "").slice(0, 100),
    username: typeof raw.username === "string" ? raw.username.slice(0, 64) : null,
    authDate,
  };
}
