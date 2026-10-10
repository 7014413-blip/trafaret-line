// GET /api/opendatabot?code=12345678 — buyer requisites for a B2B invoice by
// ЄДРПОУ (8 digits) or РНОКПП (10 digits). Checksum is verified before the paid
// lookup; 10 lookups per 10 minutes per visitor.

import { NextResponse } from "next/server";
import { clientIp, rateLimit } from "@/lib/api/rate-limit";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { validTaxCode } from "@/lib/validation/tax-codes";
import { lookupBusiness } from "@/services/opendatabot";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const code = (new URL(request.url).searchParams.get("code") ?? "").replace(/\s/g, "");
  if (!validTaxCode(code)) return apiError("opendatabot", "bad_request", "Перевірте код: ЄДРПОУ має 8 цифр, РНОКПП 10 цифр.");
  const limit = rateLimit(`odb:${clientIp(request)}`, 10, 10 * 60 * 1000);
  if (!limit.allowed) return apiError("opendatabot", "rate_limited", "Забагато перевірок. Заповніть реквізити вручну.", { details: { retryAfter: limit.retryAfter } });
  try {
    const company = await lookupBusiness(code);
    if (!company) return apiError("opendatabot", "not_found", "У реєстрі немає такого коду. Заповніть реквізити вручну.");
    return NextResponse.json({ company });
  } catch (error) {
    return handleRouteError("opendatabot", error);
  }
}
