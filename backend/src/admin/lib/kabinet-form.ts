// Pure helpers of the product form: the form state is a KabinetProductInput; these
// functions change it without touching React, so the page stays a thin view.

import type { KabinetFaq, KabinetImage, KabinetPriceCell, KabinetProduct, KabinetProductInput } from "../../types/kabinet"

export function emptyInput(): KabinetProductInput {
  return {
    title: "",
    handle: "",
    subtitle: "",
    descriptionHtml: "",
    status: "draft",
    availability: "in_stock",
    hit: false,
    categoryIds: [],
    images: [],
    sizes: ["30×30 см"],
    materials: ["PET 0,5 мм"],
    prices: [],
    features: [],
    faq: [],
    seo: { title: "", description: "" },
  }
}

export function toInput(p: KabinetProduct): KabinetProductInput {
  return {
    title: p.title,
    subtitle: p.subtitle,
    descriptionHtml: p.descriptionHtml,
    status: p.status,
    availability: p.availability,
    hit: p.hit,
    categoryIds: [...p.categoryIds],
    images: p.images.map((i) => ({ ...i })),
    sizes: [...p.sizes],
    materials: [...p.materials],
    prices: p.prices.map((c) => ({ ...c })),
    features: [...p.features],
    faq: p.faq.map((f) => ({ ...f })),
    seo: { ...p.seo },
  }
}

export function priceAt(input: KabinetProductInput, size: string, material: string): KabinetPriceCell | undefined {
  return input.prices.find((c) => c.size === size && c.material === material)
}

/** Sets one cell of the price table; an empty value removes the combination from sale. */
export function setPrice(input: KabinetProductInput, size: string, material: string, value: string): KabinetProductInput {
  const price = Math.round(Number(value.replace(",", ".").replace(/\s/g, "")))
  const existing = priceAt(input, size, material)
  const others = input.prices.filter((c) => c !== existing)
  if (!value.trim() || !Number.isFinite(price) || price <= 0) return { ...input, prices: others }
  return { ...input, prices: [...others, { variantId: existing?.variantId ?? null, size, material, price }] }
}

/** Raises or lowers every price by a percent (Prom-style mass change), rounded to 1 ₴. */
export function changeAllPrices(input: KabinetProductInput, percent: number): KabinetProductInput {
  if (!Number.isFinite(percent) || percent === 0) return input
  return { ...input, prices: input.prices.map((c) => ({ ...c, price: Math.max(1, Math.round(c.price * (1 + percent / 100))) })) }
}

type Axis = "sizes" | "materials"

export function addAxisValue(input: KabinetProductInput, axis: Axis, value: string): KabinetProductInput {
  const clean = value.trim()
  if (!clean || input[axis].includes(clean)) return input
  return { ...input, [axis]: [...input[axis], clean] }
}

export function renameAxisValue(input: KabinetProductInput, axis: Axis, from: string, to: string): KabinetProductInput {
  const clean = to.trim()
  if (!clean || from === clean || input[axis].includes(clean)) return input
  const key = axis === "sizes" ? "size" : "material"
  return {
    ...input,
    [axis]: input[axis].map((v) => (v === from ? clean : v)),
    prices: input.prices.map((c) => (c[key] === from ? { ...c, [key]: clean } : c)),
  }
}

export function removeAxisValue(input: KabinetProductInput, axis: Axis, value: string): KabinetProductInput {
  const key = axis === "sizes" ? "size" : "material"
  return { ...input, [axis]: input[axis].filter((v) => v !== value), prices: input.prices.filter((c) => c[key] !== value) }
}

export function moveImage(images: KabinetImage[], from: number, to: number): KabinetImage[] {
  if (to < 0 || to >= images.length || from === to) return images
  const next = [...images]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

export function updateList<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item))
}

export const emptyFaq = (): KabinetFaq => ({ q: "", a: "" })
