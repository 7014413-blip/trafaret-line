import { InlineKeyboard } from "grammy"
import type { CatalogLookup } from "../types/catalog"
import type { IntakeStatusValue, ProductKind } from "../types/intake"
import type { Draft } from "../types/state"
import { childCategories, materialsForKind, topCategories } from "./catalog"
import { checkDraft } from "./draft"

/** Тексти й клавіатури бота. Callback data коротка: Telegram дозволяє до 64 байт. */

export const KIND_LABELS: Record<ProductKind, string> = {
  custom: "Індивідуальний (з текстом)",
  ready: "Готовий трафарет",
  blank: "Заготовка",
}

export const STATUS_LABELS: Record<IntakeStatusValue, string> = {
  new: "у черзі",
  brief: "складається бриф",
  render: "готуються фото й мокапи",
  qa: "перевірка якості",
  draft: "чернетка готова в адмінці",
  published: "опубліковано на сайті",
  rejected: "відхилено",
}

export function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
}

export function formatSize([w, h]: [number, number]): string {
  const cm = (mm: number): string => (mm % 10 === 0 ? String(mm / 10) : (mm / 10).toFixed(1).replace(".", ","))
  return w === h ? `${cm(w)} см` : `${cm(w)}×${cm(h)} см`
}

function categoryPath(catalog: CatalogLookup, handle: string | null): string {
  if (!handle) return "—"
  const cat = catalog.categoryByHandle.get(handle)
  if (!cat) return handle
  const parent = cat.parent ? catalog.categoryByHandle.get(cat.parent) : undefined
  return parent ? `${parent.nameUk} → ${cat.nameUk}` : cat.nameUk
}

export function draftCardText(draft: Draft, catalog: CatalogLookup): string {
  const p = draft.product
  const photos = draft.files.filter((f) => f.kind === "photo").length
  const layouts = draft.files.filter((f) => f.kind === "layout").length
  const material = p.material ? (catalog.materialByCode.get(p.material)?.nameUk ?? p.material) : "—"
  const check = checkDraft(draft)

  const lines = [
    "<b>Нова заявка на товар</b>",
    "",
    `Фото: ${photos}${layouts ? `, макетів: ${layouts}` : ""}`,
    `Назва: ${p.title_uk ? escapeHtml(p.title_uk) : "—"}`,
    `Категорія: ${escapeHtml(categoryPath(catalog, p.category_handle))}`,
    `Тип: ${p.kind ? KIND_LABELS[p.kind] : "—"}`,
    `Матеріал: ${escapeHtml(material)}`,
    `Розміри: ${p.sizes_mm.length ? p.sizes_mm.map(formatSize).join(", ") : "—"}`,
    `Ціна: ${p.price_uah !== null ? `${p.price_uah} грн` : "—"}`,
  ]
  if (p.kind === "custom" || p.text_on_stencil) {
    lines.push(`Текст на трафареті: ${p.text_on_stencil ? escapeHtml(p.text_on_stencil) : "—"}`)
  }
  lines.push("")
  if (check.blocking.length) {
    lines.push(`Щоб відправити, бракує: <b>${check.blocking.join(", ")}</b>.`)
  } else {
    lines.push("Можна відправляти в обробку.")
  }
  if (check.optional.length) {
    lines.push(`Не вказано: ${check.optional.join(", ")} (конвеєр підбере за правилами каталогу).`)
  }
  lines.push("", "Можна дослати ще фото або текст, картка оновиться.")
  return lines.join("\n")
}

export function draftKeyboard(draft: Draft): InlineKeyboard {
  const ready = checkDraft(draft).blocking.length === 0
  const kb = new InlineKeyboard()
    .text("Категорія", "cg")
    .text("Тип", "kg")
    .row()
    .text("Матеріал", "mg")
    .text("Розмір", "ask:size")
    .row()
    .text("Ціна", "ask:price")
    .text("Назва", "ask:title")
    .row()
  if (draft.product.kind === "custom") kb.text("Текст на трафареті", "ask:text").row()
  if (ready) kb.text("✅ Відправити в обробку", "sub").row()
  kb.text("✖ Скасувати", "cancel")
  return kb
}

export function kindKeyboard(): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const kind of Object.keys(KIND_LABELS) as ProductKind[]) kb.text(KIND_LABELS[kind], `k:${kind}`).row()
  return kb.text("← Назад", "back")
}

export function topCategoryKeyboard(catalog: CatalogLookup): InlineKeyboard {
  const kb = new InlineKeyboard()
  for (const cat of topCategories(catalog)) {
    const hasChildren = childCategories(catalog, cat.handle).length > 0
    kb.text(cat.nameUk, hasChildren ? `cp:${cat.handle}` : `c:${cat.handle}`).row()
  }
  return kb.text("← Назад", "back")
}

export function childCategoryKeyboard(catalog: CatalogLookup, parent: string): InlineKeyboard {
  const kb = new InlineKeyboard()
  const parentCat = catalog.categoryByHandle.get(parent)
  if (parentCat) kb.text(`Увесь розділ: ${parentCat.nameUk}`, `c:${parent}`).row()
  for (const cat of childCategories(catalog, parent)) kb.text(cat.nameUk, `c:${cat.handle}`).row()
  return kb.text("← До розділів", "cg")
}

export function materialKeyboard(catalog: CatalogLookup, kind: ProductKind | null): InlineKeyboard {
  const kb = new InlineKeyboard()
  const list = materialsForKind(catalog, kind)
  list.forEach((m, i) => {
    kb.text(m.nameUk, `ms:${m.code}`)
    if (i % 2 === 1) kb.row()
  })
  if (list.length % 2 === 1) kb.row()
  return kb.text("← Назад", "back")
}

export const ASK_PROMPTS: Record<NonNullable<Draft["awaiting"]>, string> = {
  price: "Напишіть ціну в гривнях, наприклад: 350",
  size: "Напишіть розміри, наприклад: 15 см, або 30x20 см, або Ø34 см. Кілька розмірів через кому.",
  title: "Напишіть назву товару одним рядком.",
  text_on_stencil: "Напишіть текст, який буде на трафареті.",
}

export function publishKeyboard(intakeId: string): InlineKeyboard {
  return new InlineKeyboard().text("🚀 Опублікувати на сайті", `pub:${intakeId}`)
}
