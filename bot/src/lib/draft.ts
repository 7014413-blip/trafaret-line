import type { CatalogLookup } from "../types/catalog"
import type { DraftCheck } from "../types/draft-check"
import type { ProductKind } from "../types/intake"
import type { Draft } from "../types/state"
import { makeDraftId } from "./intake-id"
import { kindFromCategory, parseCaption, parseMaterial, resolveMaterialCode } from "./parse-caption"

export function newDraft(chatId: number, telegramId: number, now: Date = new Date()): Draft {
  return {
    draftId: makeDraftId(),
    chatId,
    telegramId,
    startedAt: now.toISOString(),
    rawText: [],
    files: [],
    product: {
      kind: null,
      category_handle: null,
      title_uk: null,
      title_ru: null,
      text_on_stencil: null,
      material: null,
      sizes_mm: [],
      price_uah: null,
      publish: "button",
    },
    cardMessageId: null,
    awaiting: null,
  }
}

/**
 * Додає текст Дениса до чернетки й дозаповнює лише порожні поля:
 * те, що він уже вибрав кнопками, текст не перетирає.
 */
export function applyText(draft: Draft, text: string, catalog: CatalogLookup): Draft {
  const trimmed = text.trim()
  if (!trimmed) return draft
  const parsed = parseCaption(trimmed, new Set(catalog.categoryByHandle.keys()))
  const p = { ...draft.product, sizes_mm: [...draft.product.sizes_mm] }

  if (!p.category_handle && parsed.category_handle) p.category_handle = parsed.category_handle
  if (!p.kind && parsed.kind) p.kind = parsed.kind
  if (!p.kind) p.kind = kindFromCategory(p.category_handle)
  if (p.price_uah === null && parsed.price_uah !== null) p.price_uah = parsed.price_uah
  for (const size of parsed.sizes_mm) {
    if (!p.sizes_mm.some(([w, h]) => w === size[0] && h === size[1])) p.sizes_mm.push(size)
  }
  if (!p.title_uk && parsed.title_uk) p.title_uk = parsed.title_uk
  if (!p.text_on_stencil && parsed.text_on_stencil) p.text_on_stencil = parsed.text_on_stencil
  if (!p.material) {
    p.material = resolveMaterialCode(parsed.materialHint, p.kind, new Set(catalog.materialByCode.keys()))
  }

  return { ...draft, rawText: [...draft.rawText, trimmed], product: p }
}

/** Після зміни типу товару матеріал перевіряється заново (у заготовок свої коди "bl-*"). */
export function setKind(draft: Draft, kind: ProductKind, catalog: CatalogLookup): Draft {
  const p = { ...draft.product, kind }
  const material = p.material ? catalog.materialByCode.get(p.material) : undefined
  if (material && material.forBlanks !== (kind === "blank")) {
    const hint = parseMaterial(draft.rawText.join("\n"))
    p.material = resolveMaterialCode(hint, kind, new Set(catalog.materialByCode.keys()))
  }
  return { ...draft, product: p }
}

export function setCategory(draft: Draft, handle: string): Draft {
  const p = { ...draft.product, category_handle: handle }
  if (!p.kind) p.kind = kindFromCategory(handle)
  return { ...draft, product: p }
}

export function checkDraft(draft: Draft): DraftCheck {
  const blocking: string[] = []
  const optional: string[] = []
  const p = draft.product
  if (!draft.files.some((f) => f.kind === "photo") && !draft.files.some((f) => f.kind === "layout")) {
    blocking.push("фото або макет")
  }
  if (!p.category_handle) blocking.push("категорія")
  if (!p.kind) blocking.push("тип товару")
  if (!p.material) optional.push("матеріал")
  if (p.sizes_mm.length === 0) optional.push("розмір")
  if (p.price_uah === null) optional.push("ціна")
  if (p.kind === "custom" && !p.text_on_stencil) optional.push("текст на трафареті")
  return { blocking, optional }
}
