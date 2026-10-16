// GET /api/novaposhta/warehouses?cityRef=…&q=12&l=520&w=320&h=30&kg=0.9&lockers=0
// Branches and parcel lockers of a city; with the parcel size every point says whether it fits.
// lockers=0: the parcel is larger than a locker cell (40 × 60 × 30 см), lockers are left out.

import { NextResponse } from "next/server";
import { apiError, handleRouteError } from "@/lib/api/responses";
import { listWarehouses } from "@/services/novaposhta";

export const dynamic = "force-dynamic";

const REF = /^[0-9a-f-]{36}$/i;

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const cityRef = params.get("cityRef") ?? "";
  if (!REF.test(cityRef)) return apiError("novaposhta", "bad_request", "Оберіть місто зі списку.");
  const query = (params.get("q") ?? "").trim().slice(0, 60);
  const dims = ["l", "w", "h", "kg"].map((k) => Number(params.get(k)));
  const parcel = dims.every((v) => Number.isFinite(v) && v > 0)
    ? { lengthMm: dims[0], widthMm: dims[1], heightMm: dims[2], weightKg: dims[3] }
    : undefined;
  try {
    const warehouses = await listWarehouses(cityRef, query, 50, parcel, params.get("lockers") !== "0");
    return NextResponse.json({ warehouses }, { headers: { "cache-control": "public, max-age=900" } });
  } catch (error) {
    return handleRouteError("novaposhta", error);
  }
}
