// Cabinet POST routes accept only requests from the site's own pages: the browser's Origin must
// name the host the request came to. This stops another site from signing a visitor in or out.

export function isSameOrigin(headers: Headers): boolean {
  const origin = headers.get("origin");
  const host = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!origin || !host) return false;
  try {
    return new URL(origin).host === host.split(",")[0].trim();
  } catch {
    return false;
  }
}
