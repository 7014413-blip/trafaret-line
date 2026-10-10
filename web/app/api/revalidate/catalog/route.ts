// POST /api/revalidate/catalog — called by Medusa after a product is saved in «Простий
// кабінет», so the change shows on the site at once instead of after the 5-minute cache.
// Server-to-server only: "Authorization: Bearer <INTERNAL_API_TOKEN>".

import { revalidatePath, revalidateTag } from "next/cache";
import { isInternalRequest } from "@/lib/api/internal-auth";
import { ConfigError } from "@/services/config";

export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  try {
    if (!isInternalRequest(request)) return Response.json({ error: "unauthorized" }, { status: 401 });
  } catch (error) {
    if (error instanceof ConfigError) return Response.json({ error: "not_configured" }, { status: 503 });
    throw error;
  }
  revalidateTag("catalog");
  revalidatePath("/", "layout");
  return Response.json({ ok: true });
}
