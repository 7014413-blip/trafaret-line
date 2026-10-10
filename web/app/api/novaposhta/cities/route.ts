// GET /api/novaposhta/cities?q=Київ — city suggestions for the checkout.

import { NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { searchCities } from "@/services/novaposhta";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return apiError("novaposhta", "bad_request", "Введіть щонайменше 2 літери назви міста.");
  try {
    const cities = await searchCities(q.slice(0, 60));
    return NextResponse.json({ cities }, { headers: { "cache-control": "public, max-age=3600" } });
  } catch (error) {
    return handleRouteError("novaposhta", error);
  }
}
