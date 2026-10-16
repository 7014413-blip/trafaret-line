// Staging password (lib/security/basic-auth.ts): the setting, the browser's header, and which
// requests pass.

import { describe, expect, it } from "vitest";
import { hasOwnToken, isAllowedByBasicAuth, parseBasicAuthSetting, readBasicAuthHeader, sameSecret } from "@/lib/security/basic-auth";

const header = (login: string) => `Basic ${Buffer.from(login, "utf8").toString("base64")}`;
const expected = { user: "denys", password: "pa:ss-Пароль" };

describe("staging password", () => {
  it("reads login:password and keeps colons inside the password", () => {
    expect(parseBasicAuthSetting(" denys:pa:ss-Пароль ")).toEqual(expected);
    expect(parseBasicAuthSetting(undefined)).toBeNull();
    expect(parseBasicAuthSetting("")).toBeNull();
    expect(parseBasicAuthSetting("no-colon")).toBeNull();
    expect(parseBasicAuthSetting(":password")).toBeNull();
    expect(parseBasicAuthSetting("login:")).toBeNull();
  });

  it("decodes the browser header, including Cyrillic", () => {
    expect(readBasicAuthHeader(header("denys:pa:ss-Пароль"))).toEqual(expected);
    expect(readBasicAuthHeader(null)).toBeNull();
    expect(readBasicAuthHeader("Bearer abc")).toBeNull();
    expect(readBasicAuthHeader("Basic %%%")).toBeNull();
    expect(readBasicAuthHeader(`Basic ${Buffer.from("nocolon").toString("base64")}`)).toBeNull();
  });

  it("compares secrets exactly", () => {
    expect(sameSecret("abc", "abc")).toBe(true);
    expect(sameSecret("abc", "abd")).toBe(false);
    expect(sameSecret("abc", "abcd")).toBe(false);
    expect(sameSecret("", "")).toBe(true);
  });

  it("lets everything through when no password is set", () => {
    expect(isAllowedByBasicAuth(null, "/", null)).toBe(true);
  });

  it("asks for the password on pages and API, but not on routes with their own token", () => {
    expect(isAllowedByBasicAuth(expected, "/", null)).toBe(false);
    expect(isAllowedByBasicAuth(expected, "/api/novaposhta/cities", null)).toBe(false);
    expect(isAllowedByBasicAuth(expected, "/", header("denys:wrong"))).toBe(false);
    expect(isAllowedByBasicAuth(expected, "/", header("other:pa:ss-Пароль"))).toBe(false);
    expect(isAllowedByBasicAuth(expected, "/catalog", header("denys:pa:ss-Пароль"))).toBe(true);
    expect(hasOwnToken("/api/revalidate/catalog")).toBe(true);
    expect(hasOwnToken("/api/vchasno-kasa/receipt")).toBe(true);
    expect(isAllowedByBasicAuth(expected, "/api/revalidate/catalog", null)).toBe(true);
  });
});
