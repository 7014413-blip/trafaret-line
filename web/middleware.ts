// Languages and the staging password. Ukrainian pages keep addresses without a prefix and are
// served from app/[lang] with lang "uk"; "/ru/…" pages pass as they are (lib/i18n/locale-route.ts).
// A staging copy is closed with a password (STAGING_BASIC_AUTH="login:password"); without the
// variable, as on the real shop, every request passes.

import { NextResponse, type NextRequest } from "next/server";
import { isAllowedByBasicAuth, parseBasicAuthSetting } from "./lib/security/basic-auth";
import { localeRoute } from "./lib/i18n/locale-route";

// `next start` runs the middleware again for the rewritten "/uk/…" path; this header marks
// that second pass, so it is served instead of redirected back to the address without "/uk".
const REWRITTEN = "x-tl-locale-rewrite";

function routed(request: NextRequest): NextResponse {
  if (request.headers.get(REWRITTEN) === "1") return NextResponse.next();
  const route = localeRoute(request.nextUrl.pathname);
  if (route.action === "pass") return NextResponse.next();
  const url = request.nextUrl.clone();
  url.pathname = route.path;
  if (route.action === "redirect") return NextResponse.redirect(url, 308);
  const headers = new Headers(request.headers);
  headers.set(REWRITTEN, "1");
  return NextResponse.rewrite(url, { request: { headers } });
}

export function middleware(request: NextRequest): NextResponse {
  const expected = parseBasicAuthSetting(process.env.STAGING_BASIC_AUTH);
  if (isAllowedByBasicAuth(expected, request.nextUrl.pathname, request.headers.get("authorization"))) {
    const response = routed(request);
    // A closed copy is never indexed, even by a crawler that was given the password.
    if (expected) response.headers.set("X-Robots-Tag", "noindex, nofollow");
    return response;
  }
  return new NextResponse("Тестова версія сайту. Потрібен логін і пароль.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Trafaret Line staging", charset="UTF-8"',
      "X-Robots-Tag": "noindex, nofollow",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export const config = {
  // Static build files and the favicon need no password; pages, API and images do.
  matcher: ["/((?!_next/static|favicon.ico).*)"],
};
