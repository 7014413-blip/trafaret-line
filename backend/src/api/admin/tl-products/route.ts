// «Простий кабінет» API (admin only, Medusa protects /admin/*).
// GET  /admin/tl-products?q=&categoryId=&status=&offset=&limit=  → product list
// POST /admin/tl-products                                         → new product

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { KabinetListQuery, KabinetSaveResponse, KabinetStatus } from "../../../types/kabinet"
import { listKabinetProducts, readRawProduct, toKabinetProduct, type Graph } from "../../../lib/kabinet/read"
import { createKabinetProduct } from "../../../lib/kabinet/save"
import { refreshStorefrontCatalog, storefrontUrl } from "../../../lib/kabinet/storefront"
import { validateKabinetInput } from "../../../lib/kabinet/validate"

const one = (value: unknown): string | undefined => (Array.isArray(value) ? value[0] : typeof value === "string" ? value : undefined)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const queryService = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: Graph }
  const graph = queryService.graph.bind(queryService)
  const status = one(req.query.status)
  const query: KabinetListQuery = {
    q: one(req.query.q),
    categoryId: one(req.query.categoryId),
    status: status === "published" || status === "draft" ? (status as KabinetStatus) : undefined,
    offset: Number(one(req.query.offset) ?? 0) || 0,
    limit: Number(one(req.query.limit) ?? 50) || 50,
  }
  res.json(await listKabinetProducts(graph, query))
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const checked = validateKabinetInput(req.body, true)
  if (!checked.ok) return res.status(400).json(checked.error)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: Graph }
  const graph = query.graph.bind(query)

  const { data: taken } = await graph({ entity: "product", fields: ["id"], filters: { handle: checked.input.handle } })
  if (taken.length) return res.status(400).json({ message: "Товар з такою адресою вже є, змініть назву або адресу", field: "handle" })

  const id = await createKabinetProduct(req.scope, checked.input)
  const raw = await readRawProduct(graph, id)
  if (!raw) return res.status(500).json({ message: "Товар створено, але не вдалося його прочитати" })
  await refreshStorefrontCatalog()
  const body: KabinetSaveResponse = { product: toKabinetProduct(raw, storefrontUrl()) }
  res.json(body)
}
