// POST /api/vchasno-kasa/receipt — fiscal sale receipt for a paid order.
// Server-to-server only: Medusa calls it after the payment callback with
// "Authorization: Bearer <INTERNAL_API_TOKEN>". Repeating the call for the same order
// returns the same receipt (the request tag is derived from the order number).

import { NextResponse } from "next/server";
import { isInternalRequest } from "@/lib/api/internal-auth";
import { apiError, handleRouteError, readJson } from "@/lib/api/responses";
import { issueSaleReceipt } from "@/services/vchasno-kasa";
import type { ReceiptRequestBody } from "@/types/integrations";

export const dynamic = "force-dynamic";

function validBody(body: ReceiptRequestBody | null): body is ReceiptRequestBody {
  if (!body || typeof body.orderNumber !== "string" || !/^TL-\d+$/.test(body.orderNumber)) return false;
  if (body.payment !== "card" && body.payment !== "privat") return false;
  if (!Array.isArray(body.lines) || !body.lines.length || body.lines.length > 200) return false;
  return body.lines.every((l) => typeof l.title === "string" && l.title.trim()
    && typeof l.quantity === "number" && l.quantity > 0
    && typeof l.unitPrice === "number" && l.unitPrice >= 0);
}

export async function POST(request: Request) {
  try {
    if (!isInternalRequest(request)) return apiError("internal", "unauthorized", "Потрібен внутрішній токен.");
    const body = await readJson<ReceiptRequestBody>(request);
    if (!validBody(body)) return apiError("vchasno-kasa", "bad_request", "Неповні дані чека.");
    return NextResponse.json(await issueSaleReceipt(body));
  } catch (error) {
    return handleRouteError("vchasno-kasa", error);
  }
}
