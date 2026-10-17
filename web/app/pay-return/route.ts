// WayForPay returns the customer with a POST to returnUrl. A page cannot take a POST,
// so this handler reads the status and redirects (303) to the thank-you page.
// The real payment status is set by the server callback (/hooks/wayforpay), not here.
// `lang` (set by the backend from the page the buyer paid on) keeps the thank-you page in
// the buyer's language.

import { NextResponse, type NextRequest } from "next/server";
import { localeOf } from "@/lib/i18n/locales";
import { localePath } from "@/lib/i18n/locale-path";

function thankYouUrl(req: NextRequest, status: string): URL {
  const order = req.nextUrl.searchParams.get("order") ?? "";
  const locale = localeOf(req.nextUrl.searchParams.get("lang") ?? undefined);
  const query = `order=${encodeURIComponent(order)}${status ? `&pay=${encodeURIComponent(status)}` : ""}`;
  return new URL(`${localePath(locale, "/thank-you")}?${query}`, req.nextUrl.origin);
}

export async function POST(req: NextRequest) {
  let status = "";
  try {
    const form = await req.formData();
    status = String(form.get("transactionStatus") ?? "");
  } catch {
    /* empty body */
  }
  return NextResponse.redirect(thankYouUrl(req, status), 303);
}

export async function GET(req: NextRequest) {
  return NextResponse.redirect(thankYouUrl(req, ""), 303);
}
