// «Простий кабінет»: checks and cleans the product form before saving. Messages are in
// Ukrainian because the owner sees them next to the field.

import { sanitizeHtml } from "./sanitize-html"
import type { KabinetError, KabinetFaq, KabinetImage, KabinetPriceCell, KabinetProductInput, ProductAvailability } from "../../types/kabinet"

const AVAILABILITY: readonly ProductAvailability[] = ["in_stock", "on_order", "out_of_stock"]
const MAX_PRICE = 1_000_000

const clean = (value: unknown, max: number) => String(value ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim().slice(0, max)

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia", ы: "y", э: "e", ё: "io", ъ: "", "ʼ": "", "'": "", "’": "",
}

/** Latin address part from a Ukrainian title (Ukrainian national transliteration). */
export function slugify(text: string): string {
  const latin = text.toLowerCase().split("").map((ch) => TRANSLIT[ch] ?? ch).join("")
  return latin.normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80)
}

export type ValidationResult = { ok: true; input: KabinetProductInput } | { ok: false; error: KabinetError }

const fail = (message: string, field?: string): ValidationResult => ({ ok: false, error: { message, field } })

export function validateKabinetInput(raw: unknown, isNew: boolean): ValidationResult {
  if (!raw || typeof raw !== "object") return fail("Порожній запит")
  const body = raw as Record<string, unknown>

  const title = clean(body.title, 200)
  if (title.length < 3) return fail("Вкажіть назву товару (щонайменше 3 символи)", "title")

  const handle = isNew ? slugify(clean(body.handle, 120) || title) : undefined
  if (isNew && (!handle || handle.length < 3)) return fail("Адреса товару має містити латинські літери або цифри", "handle")

  const status = body.status === "published" ? "published" : "draft"
  const availability = AVAILABILITY.includes(body.availability as ProductAvailability) ? (body.availability as ProductAvailability) : "in_stock"

  const categoryIds = Array.isArray(body.categoryIds) ? [...new Set(body.categoryIds.map((id) => clean(id, 64)).filter(Boolean))] : []
  if (!categoryIds.length) return fail("Оберіть хоча б один розділ каталогу", "categoryIds")

  const images: KabinetImage[] = Array.isArray(body.images)
    ? body.images
      .filter((img): img is Record<string, unknown> => !!img && typeof img === "object")
      .map((img) => ({ url: clean(img.url, 1000), alt: clean(img.alt, 300) }))
      .filter((img) => /^(https?:\/\/|\/)/.test(img.url))
    : []
  if (status === "published" && !images.length) return fail("Щоб опублікувати товар, додайте хоча б одне фото", "images")
  if (images.length > 30) return fail("Не більше 30 фото на товар", "images")

  const sizes = Array.isArray(body.sizes) ? [...new Set(body.sizes.map((s) => clean(s, 80)).filter(Boolean))] : []
  const materials = Array.isArray(body.materials) ? [...new Set(body.materials.map((m) => clean(m, 80)).filter(Boolean))] : []
  if (!sizes.length) return fail("Додайте хоча б один розмір", "sizes")
  if (!materials.length) return fail("Додайте хоча б один матеріал", "materials")

  const prices: KabinetPriceCell[] = []
  const seen = new Set<string>()
  for (const cell of Array.isArray(body.prices) ? body.prices : []) {
    if (!cell || typeof cell !== "object") continue
    const c = cell as Record<string, unknown>
    const size = clean(c.size, 80)
    const material = clean(c.material, 80)
    if (!sizes.includes(size) || !materials.includes(material)) continue
    const price = Math.round(Number(c.price))
    // An empty cell means "this combination is not sold".
    if (!Number.isFinite(price) || price <= 0) continue
    if (price > MAX_PRICE) return fail(`Ціна ${size} · ${material} завелика`, "prices")
    const key = `${size}\u0000${material}`
    if (seen.has(key)) continue
    seen.add(key)
    const variantId = typeof c.variantId === "string" && c.variantId.startsWith("variant_") ? c.variantId : null
    prices.push({ variantId, size, material, price })
  }
  if (!prices.length) return fail("Вкажіть ціну хоча б для одного розміру й матеріалу", "prices")

  const features = Array.isArray(body.features) ? body.features.map((f) => clean(f, 300)).filter(Boolean).slice(0, 20) : []
  const faq: KabinetFaq[] = Array.isArray(body.faq)
    ? body.faq
      .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
      .map((x) => ({ q: clean(x.q, 300), a: clean(x.a, 2000) }))
      .filter((x) => x.q && x.a)
      .slice(0, 20)
    : []
  const seoRaw = body.seo && typeof body.seo === "object" ? (body.seo as Record<string, unknown>) : {}

  return {
    ok: true,
    input: {
      title,
      handle,
      subtitle: clean(body.subtitle, 300),
      descriptionHtml: sanitizeHtml(clean(body.descriptionHtml, 50_000)),
      status,
      availability,
      hit: body.hit === true,
      categoryIds,
      images,
      sizes,
      materials,
      prices,
      features,
      faq,
      seo: { title: clean(seoRaw.title, 160), description: clean(seoRaw.description, 400) },
    },
  }
}
