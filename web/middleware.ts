// Closes a staging copy with a password (STAGING_BASIC_AUTH="login:password"). Without the
// variable, as on the real shop, every request passes untouched.

import { NextResponse, type NextRequest } from "next/server";
import { isAllowedByBasicAuth, parseBasicAuthSetting } from "./lib/security/basic-auth";

export function middleware(request: NextRequest): NextResponse {
  const expected = parseBasicAuthSetting(process.env.STAGING_BASIC_AUTH);
  if (isAllowedByBasicAuth(expected, request.nextUrl.pathname, request.headers.get("authorization"))) {
    const response = NextResponse.next();
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
