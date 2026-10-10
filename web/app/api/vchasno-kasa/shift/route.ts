// POST /api/vchasno-kasa/shift { "action": "open" | "x_report" | "close" | "status" }
// Shift control for the manager panel and the nightly Z report (internal token required).

import { NextResponse } from "next/server";
import { isInternalRequest } from "@/lib/api/internal-auth";
import { apiError, handleRouteError, readJson } from "@/lib/api/responses";
import { shift } from "@/services/vchasno-kasa";
import type { ShiftAction } from "@/types/integrations";

export const dynamic = "force-dynamic";

const ACTIONS: ShiftAction[] = ["open", "x_report", "close", "status"];

export async function POST(request: Request) {
  try {
    if (!isInternalRequest(request)) return apiError("internal", "unauthorized", "Потрібен внутрішній токен.");
    const body = await readJson<{ action?: ShiftAction }>(request);
    if (!body?.action || !ACTIONS.includes(body.action)) return apiError("vchasno-kasa", "bad_request", `action: ${ACTIONS.join(" | ")}`);
    const result = await shift(body.action);
    return NextResponse.json({ action: body.action, res: result.res, info: result.info ?? null });
  } catch (error) {
    return handleRouteError("vchasno-kasa", error);
  }
}
