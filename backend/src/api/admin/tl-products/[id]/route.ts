// «Простий кабінет» API for one product (admin only).
// GET  /admin/tl-products/:id → form data
// POST /admin/tl-products/:id → save the form

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { KabinetSaveResponse } from "../../../../types/kabinet"
import { readRawProduct, toKabinetProduct, type Graph } from "../../../../lib/kabinet/read"
import { updateKabinetProduct } from "../../../../lib/kabinet/save"
import { refreshStorefrontCatalog, storefrontUrl } from "../../../../lib/kabinet/storefront"
import { validateKabinetInput } from "../../../../lib/kabinet/validate"

function graphOf(req: MedusaRequest): Graph {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: Graph }
  return query.graph.bind(query)
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const raw = await readRawProduct(graphOf(req), String(req.params.id))
  if (!raw) return res.status(404).json({ message: "Товар не знайдено" })
  res.json({ product: toKabinetProduct(raw, storefrontUrl()) })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const graph = graphOf(req)
  const existing = await readRawProduct(graph, String(req.params.id))
  if (!existing) return res.status(404).json({ message: "Товар не знайдено" })
  const checked = validateKabinetInput(req.body, false)
  if (!checked.ok) return res.status(400).json(checked.error)

  await updateKabinetProduct(req.scope, graph, existing, checked.input)
  const raw = await readRawProduct(graph, existing.id)
  if (!raw) return res.status(500).json({ message: "Збережено, але не вдалося прочитати товар" })
  await refreshStorefrontCatalog()
  const body: KabinetSaveResponse = { product: toKabinetProduct(raw, storefrontUrl()) }
  res.json(body)
}
