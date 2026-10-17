// Customer cabinet helpers: signed tokens, sign-in links, Telegram's answer, cookies and the
// carrier tracking link.

import { describe, expect, it } from "vitest";
import { ACCOUNT_TOKEN_TTL_S, makeAccountToken, readAccountToken } from "@/lib/account/account-token";
import { trackingUrl } from "@/lib/account/tracking-url";
import { loginProviders } from "@/lib/account/login-providers";
import { googleAuthUrl } from "@/lib/account/google-auth-url";
import { telegramAuthUrl } from "@/lib/account/telegram-auth-url";
import { readTelegramResult } from "@/lib/account/read-telegram-result";
import { buyerAddress } from "@/lib/account/buyer-address";
import { isSameOrigin } from "@/lib/account/same-origin";
import { signInErrorText } from "@/lib/account/sign-in-error-text";
import { cookieOptions, sessionCookieOptions } from "@/lib/account/session-cookie";

const SECRET = "test-secret";
const NOW = 1_800_000_000;

describe("account tokens", () => {
  it("reads back the customer of a fresh token of the same purpose", () => {
    const token = makeAccountToken("session", "cus_01ABC", SECRET, NOW);
    expect(readAccountToken("session", token, SECRET, NOW + 60)).toBe("cus_01ABC");
  });

  it("refuses another purpose, another secret, a changed customer and an expired token", () => {
    const token = makeAccountToken("checkout", "cus_01ABC", SECRET, NOW);
    expect(readAccountToken("session", token, SECRET, NOW)).toBeNull();
    expect(readAccountToken("checkout", token, "other", NOW)).toBeNull();
    expect(readAccountToken("checkout", token.replace("cus_01ABC", "cus_01ABD"), SECRET, NOW)).toBeNull();
    expect(readAccountToken("checkout", token, SECRET, NOW + ACCOUNT_TOKEN_TTL_S.checkout + 1)).toBeNull();
    expect(readAccountToken("checkout", token, undefined, NOW)).toBeNull();
    expect(readAccountToken("checkout", 42, SECRET, NOW)).toBeNull();
  });

  it("refuses an expiry further away than the purpose allows", () => {
    const longLived = makeAccountToken("session", "cus_1", SECRET, NOW);
    const [, expires] = longLived.split(".");
    expect(Number(expires) - NOW).toBe(ACCOUNT_TOKEN_TTL_S.session);
    expect(readAccountToken("checkout", longLived, SECRET, NOW)).toBeNull();
  });
});

describe("tracking links", () => {
  it("sends Nova Poshta numbers to Nova Poshta and others to Ukrposhta", () => {
    expect(trackingUrl("2045 0012 3456 78")).toBe("https://novaposhta.ua/tracking/?cargo_number=20450012345678");
    expect(trackingUrl("0500123456789")).toContain("track.ukrposhta.ua");
  });
});

describe("sign-in links", () => {
  it("shows only the buttons whose keys are set", () => {
    expect(loginProviders({})).toEqual({ google: false, telegramBotId: null });
    expect(loginProviders({ GOOGLE_CLIENT_ID: "id.apps.googleusercontent.com", TELEGRAM_BOT_ID: "123456789" })).toEqual({ google: true, telegramBotId: "123456789" });
    expect(loginProviders({ TELEGRAM_BOT_ID: "123456789:secret" }).telegramBotId).toBeNull();
  });

  it("builds Google's code flow with e-mail and the state", () => {
    const url = new URL(googleAuthUrl("client", "https://trafaret-line.com.ua/api/kabinet/google/callback", "st4te"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("scope")).toBe("openid email profile");
    expect(url.searchParams.get("state")).toBe("st4te");
    expect(url.searchParams.get("redirect_uri")).toBe("https://trafaret-line.com.ua/api/kabinet/google/callback");
  });

  it("sends Telegram back to the site's return page", () => {
    const url = new URL(telegramAuthUrl("123456789", "https://trafaret-line.com.ua"));
    expect(url.searchParams.get("bot_id")).toBe("123456789");
    expect(url.searchParams.get("origin")).toBe("https://trafaret-line.com.ua");
    expect(url.searchParams.get("return_to")).toBe("https://trafaret-line.com.ua/kabinet/vhid-telegram");
  });
});

describe("Telegram's answer", () => {
  const data = { id: 42, first_name: "Олена", auth_date: NOW, hash: "a".repeat(64) };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value), "utf8").toString("base64");

  it("decodes base64 JSON with Cyrillic names, with or without padding and in base64url", () => {
    expect(readTelegramResult(`#tgAuthResult=${encode(data)}`)).toEqual(data);
    expect(readTelegramResult(`#tgAuthResult=${encode(data).replace(/=+$/, "")}`)).toEqual(data);
    expect(readTelegramResult(`#tgAuthResult=${encode(data).replace(/\+/g, "-").replace(/\//g, "_")}`)).toEqual(data);
  });

  it("gives null for an empty, broken or non-object answer", () => {
    expect(readTelegramResult("")).toBeNull();
    expect(readTelegramResult("#tgAuthResult=@@@")).toBeNull();
    expect(readTelegramResult(`#tgAuthResult=${encode([1, 2])}`)).toBeNull();
    expect(readTelegramResult(`#tgAuthResult=${encode(false)}`)).toBeNull();
  });
});

describe("requests", () => {
  it("takes the buyer's address from nginx", () => {
    expect(buyerAddress(new Headers({ "x-real-ip": "198.51.100.7", "x-forwarded-for": "203.0.113.1" }))).toBe("198.51.100.7");
    expect(buyerAddress(new Headers({ "x-forwarded-for": "203.0.113.1, 198.51.100.7" }))).toBe("198.51.100.7");
    expect(buyerAddress(new Headers())).toBeNull();
  });

  it("accepts only the site's own pages as the origin", () => {
    expect(isSameOrigin(new Headers({ origin: "https://trafaret-line.com.ua", host: "trafaret-line.com.ua" }))).toBe(true);
    expect(isSameOrigin(new Headers({ origin: "https://evil.example", host: "trafaret-line.com.ua" }))).toBe(false);
    expect(isSameOrigin(new Headers({ host: "trafaret-line.com.ua" }))).toBe(false);
    expect(isSameOrigin(new Headers({ origin: "null", host: "trafaret-line.com.ua" }))).toBe(false);
  });

  it("keeps cookies https-only except on a local run", () => {
    expect(sessionCookieOptions("trafaret-line.com.ua")).toMatchObject({ httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: ACCOUNT_TOKEN_TTL_S.session });
    expect(cookieOptions(600, "127.0.0.1:3100", "/api/kabinet/google").secure).toBe(false);
    expect(cookieOptions(600, null).secure).toBe(true);
  });

  it("explains known sign-in errors and ignores unknown ones", () => {
    expect(signInErrorText("google")).toMatch(/Google/);
    expect(signInErrorText("<script>")).toBeNull();
    expect(signInErrorText(undefined)).toBeNull();
  });
});
