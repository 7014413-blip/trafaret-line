// Google sign-in on the server: the code from the storefront's callback is exchanged for an
// access token with the client secret (oauth2.googleapis.com), then the person's verified
// e-mail and name are read from the OpenID userinfo endpoint. Unverified e-mails are refused,
// because the e-mail joins the customer's earlier orders to the cabinet.

import type { LoginProfile } from "../../types/account";

export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";

export interface GoogleClient {
  clientId: string;
  clientSecret: string;
}

/** The person behind the code, or null when Google refuses the code or the e-mail is not verified. */
export async function googleProfile(code: string, redirectUri: string, client: GoogleClient, fetchImpl: typeof fetch = fetch): Promise<LoginProfile | null> {
  const tokenResponse = await fetchImpl(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({
      code, redirect_uri: redirectUri, client_id: client.clientId, client_secret: client.clientSecret, grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenResponse.ok) return null;
  const { access_token: accessToken } = (await tokenResponse.json()) as { access_token?: string };
  if (!accessToken) return null;

  const infoResponse = await fetchImpl(GOOGLE_USERINFO_URL, { headers: { authorization: `Bearer ${accessToken}`, accept: "application/json" } });
  if (!infoResponse.ok) return null;
  const info = (await infoResponse.json()) as { email?: string; email_verified?: boolean | string; given_name?: string; family_name?: string; name?: string };
  const email = String(info.email ?? "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (info.email_verified !== true && info.email_verified !== "true") return null;
  const [nameFirst = "", ...nameRest] = String(info.name ?? "").trim().split(/\s+/);
  return {
    provider: "google",
    email,
    firstName: String(info.given_name ?? nameFirst).slice(0, 100),
    lastName: String(info.family_name ?? nameRest.join(" ")).slice(0, 100),
  };
}
