// «Простий кабінет»: reads products for the admin list and the product form.
// Products keep the catalogue layout (options «Розмір» × «Матеріал», UAH prices on
// variants, texts in metadata), so the editor and the catalogue import agree.

import type {
  KabinetCategory, KabinetFaq, KabinetListItem, KabinetListQuery, KabinetListResponse, KabinetProduct,
  KabinetPriceCell, KabinetStatus, ProductAvailability,
} from "../../types/kabinet"

export const SIZE_OPTION = "Розмір"
export const MATERIAL_OPTION = "Матеріал"
export const CURRENCY = "uah"
export const LIST_LIMIT_MAX = 100

export type Graph = (args: Record<string, unknown>) => Promise<{ data: unknown[]; metadata?: { count?: number; skip?: number; take?: number } }>

interface RawPrice { amount: number | string; currency_code: string }
interface RawVariantRow {
  id: string
  title: string
  sku: string | null
  options?: { value: string; option?: { title: string } | null }[]
  prices?: RawPrice[]
}
interface RawProductRow {
  id: string
  title: string
  handle: string
  subtitle: string | null
  description: string | null
  thumbnail: string | null
  status: string
  updated_at: string | Date
  metadata: Record<string, unknown> | null
  images?: { url: string; rank?: number }[]
  categories?: { id: string; name: string }[]
  options?: { id?: string; title: string; values?: { value: string }[] }[]
  variants?: RawVariantRow[]
}
interface RawCategoryRow { id: string; name: string; rank: number | null; parent_category_id: string | null }

const AVAILABILITY: readonly ProductAvailability[] = ["in_stock", "on_order", "out_of_stock"]

export function availabilityOf(metadata: Record<string, unknown> | null): ProductAvailability {
  const value = metadata?.availability
  return AVAILABILITY.includes(value as ProductAvailability) ? (value as ProductAvailability) : "in_stock"
}

function statusOf(status: string): KabinetStatus {
  return status === "published" ? "published" : "draft"
}

function uahPrice(prices: RawPrice[] | undefined): number | null {
  const price = prices?.find((p) => p.currency_code === CURRENCY)
  return price ? Number(price.amount) : null
}

function optionValue(variant: RawVariantRow, title: string): string {
  return variant.options?.find((o) => o.option?.title === title)?.value ?? ""
}

function optionList(product: RawProductRow, title: string, variants: RawVariantRow[]): string[] {
  const declared = product.options?.find((o) => o.title === title)?.values?.map((v) => v.value) ?? []
  const used = variants.map((v) => optionValue(v, title)).filter(Boolean)
  return [...new Set([...declared, ...used])]
}

/** Categories for the filter and the form, subcategories labelled with their parent. */
export async function listKabinetCategories(graph: Graph): Promise<KabinetCategory[]> {
  const { data } = await graph({ entity: "product_category", fields: ["id", "name", "rank", "parent_category_id"] })
  const rows = data as RawCategoryRow[]
  const byId = new Map(rows.map((r) => [r.id, r]))
  const roots = rows.filter((r) => !r.parent_category_id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
  const out: KabinetCategory[] = []
  for (const root of roots) {
    out.push({ id: root.id, name: root.name, label: root.name })
    for (const child of rows.filter((r) => r.parent_category_id === root.id).sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))) {
      out.push({ id: child.id, name: child.name, label: `${root.name} › ${child.name}` })
    }
  }
  // Deeper levels, if any appear later, still get listed.
  for (const row of rows) {
    if (!out.some((c) => c.id === row.id)) {
      const parent = row.parent_category_id ? byId.get(row.parent_category_id) : undefined
      out.push({ id: row.id, name: row.name, label: parent ? `${parent.name} › ${row.name}` : row.name })
    }
  }
  return out
}

/** Product list with search, category and status filters, newest changes first. */
export async function listKabinetProducts(graph: Graph, query: KabinetListQuery): Promise<KabinetListResponse> {
  const limit = Math.max(1, Math.min(LIST_LIMIT_MAX, Math.round(query.limit ?? 50)))
  const offset = Math.max(0, Math.round(query.offset ?? 0))
  const filters: Record<string, unknown> = {}
  const text = query.q?.trim().slice(0, 100)
  if (text) {
    // Search by name or address part, case-insensitive, like the search box on Prom.
    const like = `%${text.replace(/[%_\\]/g, (c) => `\\${c}`)}%`
    filters.$or = [{ title: { $ilike: like } }, { handle: { $ilike: like } }]
  }
  if (query.status) filters.status = query.status
  if (query.categoryId) filters.categories = { id: query.categoryId }

  const [{ data, metadata }, categories] = await Promise.all([
    graph({
      entity: "product",
      fields: [
        "id", "title", "handle", "thumbnail", "status", "updated_at", "metadata",
        "categories.id", "categories.name", "variants.id", "variants.prices.amount", "variants.prices.currency_code",
      ],
      filters,
      pagination: { skip: offset, take: limit, order: { updated_at: "DESC" } },
    }),
    listKabinetCategories(graph),
  ])

  const items: KabinetListItem[] = (data as RawProductRow[]).map((p) => {
    const prices = (p.variants ?? []).map((v) => uahPrice(v.prices)).filter((x): x is number => x != null && x > 0)
    return {
      id: p.id,
      title: p.title,
      handle: p.handle,
      thumbnail: p.thumbnail,
      status: statusOf(p.status),
      minPrice: prices.length ? Math.min(...prices) : null,
      categories: (p.categories ?? []).map((c) => c.name),
      variantCount: p.variants?.length ?? 0,
      hit: p.metadata?.hit === true,
      isNew: p.metadata?.is_new === true,
      availability: availabilityOf(p.metadata),
      updatedAt: new Date(p.updated_at).toISOString(),
    }
  })
  return { items, count: metadata?.count ?? items.length, offset, limit, categories }
}

function textList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === "string") : []
}

function faqList(value: unknown): KabinetFaq[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((x): x is { q: unknown; a: unknown } => !!x && typeof x === "object")
    .map((x) => ({ q: String(x.q ?? ""), a: String(x.a ?? "") }))
    .filter((x) => x.q || x.a)
}

function ukOf(value: unknown): unknown {
  return value && typeof value === "object" ? (value as Record<string, unknown>).uk : undefined
}

/** Raw product with everything the form shows; null when it does not exist. */
export async function readRawProduct(graph: Graph, id: string): Promise<RawProductRow | null> {
  const { data } = await graph({
    entity: "product",
    fields: [
      "id", "title", "handle", "subtitle", "description", "thumbnail", "status", "updated_at", "metadata",
      "images.url", "images.rank", "categories.id", "categories.name", "options.id", "options.title", "options.values.value",
      "variants.id", "variants.title", "variants.sku", "variants.options.value", "variants.options.option.title",
      "variants.prices.amount", "variants.prices.currency_code",
    ],
    filters: { id },
  })
  return (data as RawProductRow[])[0] ?? null
}

export function toKabinetProduct(p: RawProductRow, storefrontUrl: string): KabinetProduct {
  const variants = p.variants ?? []
  const metadata = p.metadata ?? {}
  const alts = Array.isArray(metadata.image_alts) ? (metadata.image_alts as { url: string; uk?: string }[]) : []
  const images = [...(p.images ?? [])]
    .sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0))
    .map((img) => ({ url: img.url, alt: alts.find((a) => a.url === img.url)?.uk ?? "" }))
  const prices: KabinetPriceCell[] = variants.map((v) => ({
    variantId: v.id,
    size: optionValue(v, SIZE_OPTION),
    material: optionValue(v, MATERIAL_OPTION),
    price: uahPrice(v.prices) ?? 0,
  }))
  const seo = ukOf(metadata.seo) as { title?: string; description?: string } | undefined
  return {
    id: p.id,
    title: p.title,
    handle: p.handle,
    subtitle: p.subtitle ?? "",
    descriptionHtml: p.description ?? "",
    status: statusOf(p.status),
    availability: availabilityOf(metadata),
    hit: metadata.hit === true,
    isNew: metadata.is_new === true,
    categoryIds: (p.categories ?? []).map((c) => c.id),
    images,
    sizes: optionList(p, SIZE_OPTION, variants),
    materials: optionList(p, MATERIAL_OPTION, variants),
    prices,
    features: textList(ukOf(metadata.features)),
    faq: faqList(ukOf(metadata.faq)),
    seo: { title: seo?.title ?? "", description: seo?.description ?? "" },
    storefrontUrl: `${storefrontUrl.replace(/\/$/, "")}/p/${p.handle}`,
  }
}

export type { RawProductRow, RawVariantRow }
