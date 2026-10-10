// WayForPay returns the customer with a POST to returnUrl. A page cannot take a POST,
// so this handler reads the status and redirects (303) to the thank-you page.
// The real payment status is set by the server callback (/hooks/wayforpay), not here.

import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const order = req.nextUrl.searchParams.get("order") ?? "";
  let status = "";
  try {
    const form = await req.formData();
    status = String(form.get("transactionStatus") ?? "");
  } catch {
    /* empty body */
  }
  const url = new URL(`/thank-you?order=${encodeURIComponent(order)}${status ? `&pay=${encodeURIComponent(status)}` : ""}`, req.nextUrl.origin);
  return NextResponse.redirect(url, 303);
}

export async function GET(req: NextRequest) {
  const order = req.nextUrl.searchParams.get("order") ?? "";
  return NextResponse.redirect(new URL(`/thank-you?order=${encodeURIComponent(order)}`, req.nextUrl.origin), 303);
}
