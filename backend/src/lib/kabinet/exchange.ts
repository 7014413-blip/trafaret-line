// «Простий кабінет», step 2: the product table for Excel, Prom.ua style (Денис 10.10).
// Export: one row per variant (size × material) with the product columns repeated, so the
// owner can filter and change prices in Excel. Import: rows grouped by product; existing
// products are updated (prices, availability, names, texts, categories, photos), rows with
// a new «Адреса» create products. Variants missing from the file are kept; a row with an
// empty or zero price takes that variant off sale. A dry run reports changes without saving.

import type { MedusaContainer } from "@medusajs/framework/types"
import type {
  KabinetCategory, KabinetImportIssue, KabinetImportReport, KabinetProductInput, ProductAvailability,
} from "../../types/kabinet"
import { parseCsv, toCsv } from "./csv"
import { listKabinetCategories, readRawProduct, toKabinetProduct, CURRENCY, type Graph, type RawProductRow } from "./read"
import { createKabinetProduct, updateKabinetProduct } from "./save"
import { storefrontUrl } from "./storefront"
import { slugify, validateKabinetInput } from "./validate"

export const COLUMNS = {
  productId: "ID_товару",
  variantId: "ID_варіанта",
  sku: "Код_товару",
  handle: "Адреса",
  title: "Назва_позиції",
  size: "Розмір",
  material: "Матеріал",
  price: "Ціна",
  currency: "Валюта",
  availability: "Наявність",
  status: "Статус",
  categories: "Розділи",
  hit: "Хіт",
  subtitle: "Короткий_опис",
  description: "Опис",
  images: "Посилання_зображення",
} as const

type ColumnKey = keyof typeof COLUMNS

/** Other spellings accepted on import (Prom export names, Russian, lower case). */
const ALIASES: Partial<Record<ColumnKey, string[]>> = {
  title: ["Назва_позиції_укр", "Название_позиции", "Назва"],
  price: ["Ціна_грн", "Цена"],
  availability: ["Наличие"],
  description: ["Опис_укр", "Описание"],
  images: ["Посилання_на_зображення", "Ссылка_изображения", "Фото"],
  sku: ["Код", "Артикул"],
  categories: ["Назва_групи", "Розділ", "Группа"],
}

// Prom.ua availability marks: «+» in stock, «-» not available, «&» on order.
const AVAILABILITY_TO_MARK: Record<ProductAvailability, string> = { in_stock: "+", out_of_stock: "-", on_order: "&" }

function availabilityFromCell(cell: string): ProductAvailability | null {
  const v = cell.trim().toLowerCase()
  if (!v) return null
  if (v === "+" || v.startsWith("в наявн") || v.startsWith("в налич") || v === "так") return "in_stock"
  if (v === "-" || v.startsWith("немає") || v.startsWith("нет")) return "out_of_stock"
  if (v === "&" || v === "@" || v.startsWith("під замов") || v.startsWith("под заказ")) return "on_order"
  return null
}

const statusLabel = (status: string) => (status === "published" ? "Опубліковано" : "Чернетка")
const statusFromCell = (cell: string): "published" | "draft" | null => {
  const v = cell.trim().toLowerCase()
  if (!v) return null
  if (v.startsWith("опубл") || v === "так" || v === "published") return "published"
  if (v.startsWith("черн") || v === "ні" || v === "draft" || v.startsWith("прихов")) return "draft"
  return null
}

/* ------------------------------------------------------------------ */
/* Export                                                              */
/* ------------------------------------------------------------------ */

const EXPORT_PAGE = 100

export async function exportProductsCsv(graph: Graph): Promise<string> {
  const categories = await listKabinetCategories(graph)
  const labelOf = new Map(categories.map((c) => [c.id, c.label]))
  const rows: string[][] = []
  for (let skip = 0; skip < 50_000; skip += EXPORT_PAGE) {
    const { data, metadata } = await graph({
      entity: "product",
      fields: ["id"],
      pagination: { skip, take: EXPORT_PAGE, order: { title: "ASC" } },
    })
    for (const { id } of data as { id: string }[]) {
      const raw = await readRawProduct(graph, id)
      if (!raw) continue
      rows.push(...productRows(raw, labelOf))
    }
    if (skip + EXPORT_PAGE >= (metadata?.count ?? 0)) break
  }
  return toCsv(Object.values(COLUMNS), rows)
}

function productRows(raw: RawProductRow, labelOf: Map<string, string>): string[][] {
  const p = toKabinetProduct(raw, storefrontUrl())
  const skuOf = new Map((raw.variants ?? []).map((v) => [v.id, v.sku ?? ""]))
  const common = {
    productId: p.id,
    handle: p.handle,
    title: p.title,
    currency: CURRENCY.toUpperCase(),
    availability: AVAILABILITY_TO_MARK[p.availability],
    status: statusLabel(p.status),
    categories: p.categoryIds.map((id) => labelOf.get(id) ?? id).join(" | "),
    hit: p.hit ? "так" : "",
    subtitle: p.subtitle,
    description: p.descriptionHtml,
    images: p.images.map((i) => i.url).join(", "),
  }
  const cells = p.prices.length ? p.prices : [{ variantId: null, size: p.sizes[0] ?? "", material: p.materials[0] ?? "", price: 0 }]
  return cells.map((cell) => (Object.keys(COLUMNS) as ColumnKey[]).map((key) => {
    switch (key) {
      case "variantId": return cell.variantId ?? ""
      case "sku": return cell.variantId ? skuOf.get(cell.variantId) ?? "" : ""
      case "size": return cell.size
      case "material": return cell.material
      case "price": return cell.price ? String(cell.price) : ""
      default: return String(common[key as keyof typeof common] ?? "")
    }
  }))
}

/* ------------------------------------------------------------------ */
/* Import                                                              */
/* ------------------------------------------------------------------ */

interface SheetRow {
  line: number
  get: (key: ColumnKey) => string
}

function columnIndex(header: string[]): Partial<Record<ColumnKey, number>> {
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, "_")
  const at = header.map(norm)
  const out: Partial<Record<ColumnKey, number>> = {}
  for (const key of Object.keys(COLUMNS) as ColumnKey[]) {
    const names = [COLUMNS[key], ...(ALIASES[key] ?? [])].map(norm)
    const index = at.findIndex((h) => names.includes(h))
    if (index >= 0) out[key] = index
  }
  return out
}

function categoryIdsFrom(cell: string, categories: KabinetCategory[], line: number, issues: KabinetImportIssue[]): string[] | null {
  if (!cell.trim()) return null
  const ids: string[] = []
  for (const part of cell.split(/\s*[|;]\s*/).map((s) => s.trim()).filter(Boolean)) {
    const found = categories.find((c) => c.label.toLowerCase() === part.toLowerCase())
      ?? categories.find((c) => c.name.toLowerCase() === part.toLowerCase())
    if (found) ids.push(found.id)
    else issues.push({ row: line, message: `Розділ «${part}» не знайдено, його пропущено` })
  }
  return ids
}

function priceFrom(cell: string): number | null {
  const v = cell.replace(/\s/g, "").replace(",", ".")
  if (!v) return null
  const n = Math.round(Number(v))
  return Number.isFinite(n) ? n : NaN
}

/** Applies the rows of one product to its form state; returns the changes in words. */
function applyRows(base: KabinetProductInput, rows: SheetRow[], categories: KabinetCategory[], issues: KabinetImportIssue[], has: (k: ColumnKey) => boolean): { input: KabinetProductInput; priceChanges: number; added: number; removed: number; notes: string[] } {
  const first = rows[0]
  const input: KabinetProductInput = { ...base, prices: base.prices.map((c) => ({ ...c })), sizes: [...base.sizes], materials: [...base.materials] }
  const notes: string[] = []
  const text = (key: ColumnKey) => (has(key) ? first.get(key).trim() : "")

  if (text("title") && text("title") !== input.title) { notes.push(`назва → «${text("title")}»`); input.title = text("title") }
  const status = has("status") ? statusFromCell(first.get("status")) : null
  if (status && status !== input.status) { notes.push(status === "published" ? "опубліковано" : "у чернетки"); input.status = status }
  const availability = has("availability") ? availabilityFromCell(first.get("availability")) : null
  if (has("availability") && first.get("availability").trim() && !availability) issues.push({ row: first.line, message: "Наявність: пишіть «+», «-» або «&»" })
  if (availability && availability !== input.availability) { notes.push(`наявність → ${availability === "in_stock" ? "в наявності" : availability === "on_order" ? "під замовлення" : "немає"}`); input.availability = availability }
  if (has("hit") && first.get("hit").trim()) {
    const hit = /^(так|да|1|\+|yes)$/i.test(first.get("hit").trim())
    if (hit !== input.hit) { notes.push(hit ? "позначка «Хіт»" : "без «Хіт»"); input.hit = hit }
  }
  if (text("subtitle") && text("subtitle") !== input.subtitle) { notes.push("короткий опис"); input.subtitle = text("subtitle") }
  if (text("description") && text("description") !== input.descriptionHtml) { notes.push("опис"); input.descriptionHtml = text("description") }
  const categoryIds = has("categories") ? categoryIdsFrom(first.get("categories"), categories, first.line, issues) : null
  if (categoryIds && categoryIds.length && categoryIds.join() !== input.categoryIds.join()) { notes.push("розділи"); input.categoryIds = categoryIds }
  if (text("images")) {
    const urls = text("images").split(/\s*[,\n]\s*/).map((u) => u.trim()).filter((u) => /^https?:\/\//.test(u) || u.startsWith("/"))
    if (urls.length && urls.join() !== input.images.map((i) => i.url).join()) {
      notes.push(`фото: ${urls.length}`)
      input.images = urls.map((url) => ({ url, alt: input.images.find((i) => i.url === url)?.alt ?? "" }))
    }
  }

  let priceChanges = 0
  let added = 0
  let removed = 0
  for (const row of rows) {
    const size = row.get("size").trim()
    const material = row.get("material").trim()
    if (!size || !material) { issues.push({ row: row.line, message: "Порожній розмір або матеріал, рядок пропущено" }); continue }
    const price = priceFrom(row.get("price"))
    if (price != null && Number.isNaN(price)) { issues.push({ row: row.line, message: `Ціна «${row.get("price")}» не число, рядок пропущено` }); continue }
    const variantId = has("variantId") ? row.get("variantId").trim() : ""
    const index = input.prices.findIndex((c) => (variantId && c.variantId === variantId) || (c.size === size && c.material === material))
    if (!price || price <= 0) {
      if (index >= 0) { input.prices.splice(index, 1); removed++ }
      continue
    }
    if (!input.sizes.includes(size)) input.sizes.push(size)
    if (!input.materials.includes(material)) input.materials.push(material)
    if (index >= 0) {
      const cell = input.prices[index]
      if (cell.price !== price || cell.size !== size || cell.material !== material) {
        priceChanges++
        input.prices[index] = { ...cell, size, material, price }
      }
    } else {
      added++
      input.prices.push({ variantId: null, size, material, price })
    }
  }
  // Option values no longer used by any price are dropped from the table.
  input.sizes = input.sizes.filter((s) => input.prices.some((c) => c.size === s))
  input.materials = input.materials.filter((m) => input.prices.some((c) => c.material === m))
  if (priceChanges) notes.push(`цін змінено: ${priceChanges}`)
  if (added) notes.push(`нових варіантів: ${added}`)
  if (removed) notes.push(`знято з продажу: ${removed}`)
  return { input, priceChanges, added, removed, notes }
}

function newProductBase(title: string, handle: string): KabinetProductInput {
  return {
    title, handle, subtitle: "", descriptionHtml: "", status: "draft", availability: "in_stock", hit: false,
    categoryIds: [], images: [], sizes: [], materials: [], prices: [], features: [], faq: [], seo: { title: "", description: "" },
  }
}

export async function importProductsCsv(container: MedusaContainer, graph: Graph, csv: string, dryRun: boolean): Promise<KabinetImportReport> {
  const report: KabinetImportReport = {
    dryRun, rows: 0, productsUpdated: 0, productsCreated: 0, pricesChanged: 0, variantsAdded: 0, variantsRemoved: 0, issues: [], preview: [],
  }
  const table = parseCsv(csv)
  if (table.length < 2) { report.issues.push({ row: 1, message: "Файл порожній або без рядків з товарами" }); return report }
  const index = columnIndex(table[0])
  const has = (key: ColumnKey) => index[key] != null
  for (const required of ["title", "size", "material", "price"] as ColumnKey[]) {
    if (!has(required)) report.issues.push({ row: 1, message: `Немає колонки «${COLUMNS[required]}»` })
  }
  if (!has("productId") && !has("handle")) report.issues.push({ row: 1, message: `Потрібна колонка «${COLUMNS.productId}» або «${COLUMNS.handle}»` })
  if (report.issues.length) return report

  const rows: SheetRow[] = table.slice(1).map((cells, i) => ({ line: i + 2, get: (key) => (index[key] != null ? cells[index[key] as number] ?? "" : "") }))
  report.rows = rows.length

  // Group by product: existing id first, otherwise the address (or one made from the name).
  const groups = new Map<string, SheetRow[]>()
  for (const row of rows) {
    const id = row.get("productId").trim()
    const handle = row.get("handle").trim() || slugify(row.get("title"))
    const key = id ? `id:${id}` : handle ? `new:${slugify(handle)}` : ""
    if (!key) { report.issues.push({ row: row.line, message: "Немає ні ID товару, ні назви, рядок пропущено" }); continue }
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  const categories = await listKabinetCategories(graph)
  for (const [key, group] of groups) {
    const line = group[0].line
    let existing: RawProductRow | null = null
    let base: KabinetProductInput
    if (key.startsWith("id:")) {
      existing = await readRawProduct(graph, key.slice(3))
      if (!existing) { report.issues.push({ row: line, message: `Товар ${key.slice(3)} не знайдено, рядки пропущено` }); continue }
      const p = toKabinetProduct(existing, storefrontUrl())
      base = { ...p, handle: undefined }
    } else {
      const handle = key.slice(4)
      const { data } = await graph({ entity: "product", fields: ["id"], filters: { handle } })
      if (data.length) {
        existing = await readRawProduct(graph, (data[0] as { id: string }).id)
        if (!existing) continue
        base = { ...toKabinetProduct(existing, storefrontUrl()), handle: undefined }
      } else {
        base = newProductBase(group[0].get("title").trim(), handle)
      }
    }

    const issuesBefore = report.issues.length
    const applied = applyRows(base, group, categories, report.issues, has)
    if (!existing && !applied.input.categoryIds.length) {
      report.issues.push({ row: line, message: `Новий товар «${applied.input.title}»: вкажіть «${COLUMNS.categories}»` })
      continue
    }
    const checked = validateKabinetInput(applied.input, !existing)
    if (!checked.ok) { report.issues.push({ row: line, message: `«${applied.input.title}»: ${checked.error.message}` }); continue }
    if (existing && !applied.notes.length) continue
    if (report.issues.length > issuesBefore && !applied.notes.length) continue

    if (existing) {
      report.productsUpdated++
      report.pricesChanged += applied.priceChanges
      report.variantsAdded += applied.added
      report.variantsRemoved += applied.removed
      if (report.preview.length < 30) report.preview.push(`${existing.title}: ${applied.notes.join(", ")}`)
      if (!dryRun) await updateKabinetProduct(container, graph, existing, checked.input)
    } else {
      report.productsCreated++
      report.variantsAdded += checked.input.prices.length
      if (report.preview.length < 30) report.preview.push(`Новий товар «${checked.input.title}» (${checked.input.prices.length} варіантів, ${checked.input.status === "published" ? "опубліковано" : "чернетка"})`)
      if (!dryRun) await createKabinetProduct(container, checked.input)
    }
  }
  return report
}
