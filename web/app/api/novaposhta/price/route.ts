// POST /api/novaposhta/price — delivery cost and expected date for the checkout.
// Body: NpPriceQuery (types/integrations.ts). The parcel comes from lib/calculators/packaging.ts.

import { NextResponse } from "next/server";
import { apiError, handleRouteError, readJson } from "@/lib/api/responses";
import { quoteDelivery } from "@/services/novaposhta";
import type { NpPriceQuery } from "@/types/integrations";

export const dynamic = "force-dynamic";

const REF = /^[0-9a-f-]{36}$/i;
const positive = (v: unknown, max: number) => typeof v === "number" && Number.isFinite(v) && v > 0 && v <= max;

export async function POST(request: Request) {
  const body = await readJson<NpPriceQuery>(request);
  if (!body) return apiError("novaposhta", "bad_request", "Очікуємо JSON.");
  const valid = REF.test(body.cityRecipientRef ?? "")
    && (body.serviceType === "WarehouseWarehouse" || body.serviceType === "WarehouseDoors")
    && positive(body.weightKg, 1000)
    && positive(body.declaredValue, 10_000_000)
    && positive(body.lengthMm, 5000) && positive(body.widthMm, 5000) && positive(body.heightMm, 5000)
    && typeof body.codAmount === "number" && body.codAmount >= 0;
  if (!valid) return apiError("novaposhta", "bad_request", "Неповні дані для розрахунку доставки.");
  try {
    return NextResponse.json(await quoteDelivery(body));
  } catch (error) {
    return handleRouteError("novaposhta", error);
  }
}
