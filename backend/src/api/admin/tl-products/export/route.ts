// GET /admin/tl-products/export → every product as a CSV table for Excel (admin only).

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { exportProductsCsv } from "../../../../lib/kabinet/exchange"
import type { Graph } from "../../../../lib/kabinet/read"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: Graph }
  const csv = await exportProductsCsv(query.graph.bind(query))
  const date = new Date().toISOString().slice(0, 10)
  res.setHeader("Content-Type", "text/csv; charset=utf-8")
  res.setHeader("Content-Disposition", `attachment; filename="tovary-trafaret-line-${date}.csv"`)
  res.send(csv)
}
