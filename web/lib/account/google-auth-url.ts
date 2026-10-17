// Google's sign-in page for the cabinet: OpenID Connect code flow with e-mail and name; the
// answer comes back to /api/kabinet/google/callback with the same state.

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_CALLBACK_PATH = "/api/kabinet/google/callback";

export function googleAuthUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  return `${GOOGLE_AUTH_URL}?${params}`;
}
