import type { MaterialHint, ParsedCaption } from "../types/caption"
import type { ProductKind } from "../types/intake"

/**
 * Розбір вільного підпису Дениса («тірамісу Ø34 PET 350 грн», «сніжинка 15 см, пластик, 120 грн»).
 * Розбирає лише те, що впевнено впізнає; решту бот питає кнопками.
 */

const PRICE_RE = /(\d{1,6}(?:[.,]\d{1,2})?)\s*(?:грн\.?|гривен\w*|гривн\w*|₴|uah)(?![\p{L}\d])/giu
const PRICE_PREFIX_RE = /(?:ціна|цена|price)\s*[:=-]?\s*(\d{1,6}(?:[.,]\d{1,2})?)/giu
const PAIR_RE = /(\d{1,4}(?:[.,]\d{1,2})?)\s*[xхх×*]\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(мм|mm|см|cm|м(?![\p{L}]))?/giu
const DIAMETER_RE = /(?:[øØ⌀]|(?<![\p{L}])d\s*=?|діаметр\w*|диаметр\w*)\s*(\d{1,4}(?:[.,]\d{1,2})?)\s*(мм|mm|см|cm)?/giu
const LIST_RE = /(\d{1,4}(?:[.,]\d{1,2})?(?:\s*[,/;]\s*\d{1,4}(?:[.,]\d{1,2})?)*)\s*(мм|mm|см|cm)(?![\p{L}])/giu
const QUOTED_RE = /[«"„“]([^«»"„“”]{1,120})[»"“”]/u
const THICKNESS_RE = /(\d{1,2}(?:[.,]\d)?)\s*(?:мм|mm)/giu

function toNumber(raw: string): number {
  return Number(raw.replace(",", "."))
}

/** Одиниця не вказана: до 150 вважаємо сантиметрами, більше — міліметрами. */
function toMm(value: number, unit: string | undefined): number {
  const u = unit?.toLowerCase()
  if (u === "мм" || u === "mm") return Math.round(value)
  if (u === "м") return Math.round(value * 1000)
  if (u === "см" || u === "cm") return Math.round(value * 10)
  return value <= 150 ? Math.round(value * 10) : Math.round(value)
}

export function parsePrice(text: string): number | null {
  for (const re of [PRICE_RE, PRICE_PREFIX_RE]) {
    re.lastIndex = 0
    const match = re.exec(text)
    if (match?.[1]) {
      const value = Math.round(toNumber(match[1]))
      if (value > 0) return value
    }
  }
  return null
}

function stripPrices(text: string): string {
  return text.replace(PRICE_RE, " ").replace(PRICE_PREFIX_RE, " ")
}

export function parseSizes(text: string): Array<[number, number]> {
  const sizes: Array<[number, number]> = []
  const seen = new Set<string>()
  const push = (w: number, h: number): void => {
    // Менше 10 мм — це товщина листа, а не розмір виробу.
    if (w < 10 || h < 10 || w > 5000 || h > 5000) return
    const key = `${w}x${h}`
    if (seen.has(key)) return
    seen.add(key)
    sizes.push([w, h])
  }

  let rest = stripPrices(text)

  PAIR_RE.lastIndex = 0
  for (const m of rest.matchAll(PAIR_RE)) {
    if (!m[1] || !m[2]) continue
    push(toMm(toNumber(m[1]), m[3]), toMm(toNumber(m[2]), m[3]))
  }
  rest = rest.replace(PAIR_RE, " ")

  for (const m of rest.matchAll(DIAMETER_RE)) {
    if (!m[1]) continue
    const d = toMm(toNumber(m[1]), m[2])
    push(d, d)
  }
  rest = rest.replace(DIAMETER_RE, " ")

  for (const m of rest.matchAll(LIST_RE)) {
    if (!m[1] || !m[2]) continue
    const unit = m[2]
    // Товщина матеріалу («0,5 мм», «3 мм акрил») — не розмір товару.
    const after = rest.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 14).toLowerCase()
    const before = rest.slice(Math.max(0, (m.index ?? 0) - 14), m.index ?? 0).toLowerCase()
    const isThickness =
      (unit === "мм" || unit === "mm") &&
      /(акрил|acryl|pet|пет|пэт|полістирол|полистирол|пластик|(?<![\p{L}])ps(?![\p{L}])|дзеркал|зеркал|товщ|толщ)/u.test(before + " " + after)
    if (isThickness) continue
    for (const part of m[1].split(/[,/;]/)) {
      const v = toNumber(part.trim())
      if (!Number.isFinite(v)) continue
      const mm = toMm(v, unit)
      push(mm, mm)
    }
  }
  return sizes
}

export function parseMaterial(text: string): MaterialHint | null {
  const t = text.toLowerCase()
  // Товщина листа — до 15 мм; більші значення в мм є розмірами товару.
  let thickness: number | null = null
  for (const m of t.matchAll(THICKNESS_RE)) {
    const v = m[1] ? toNumber(m[1]) : NaN
    if (v > 0 && v <= 15) {
      thickness = v
      break
    }
  }

  let color: MaterialHint["color"] = null
  if (/золот|gold/u.test(t)) color = "gold"
  else if (/срібл|серебр|silver/u.test(t)) color = "silver"
  else if (/молочн|опал/u.test(t)) color = "milk"
  else if (/чорн|черн|black/u.test(t)) color = "black"
  else if (/біл|бел|white/u.test(t)) color = "white"
  else if (/червон|красн|red/u.test(t)) color = "red"
  else if (/рожев|розов|pink/u.test(t)) color = "pink"
  else if (/синій|синий|блакит|голуб|blue/u.test(t)) color = "blue"
  else if (/зелен|зелён|green/u.test(t)) color = "green"
  else if (/жовт|желт|yellow/u.test(t)) color = "yellow"
  else if (/прозор|clear/u.test(t)) color = "clear"

  const mirror = /дзеркал|зеркал|mirror/u.test(t)
  if (/акрил|acryl|оргскл|plexi|плекс/u.test(t)) {
    return { base: mirror ? "mirror-acr" : "acr", thicknessMm: thickness, color }
  }
  if (/полістирол|полистирол|(?<![\p{L}])(ps|пс)(?![\p{L}])/u.test(t)) {
    return { base: mirror ? "mirror-ps" : "ps", thicknessMm: thickness, color }
  }
  if (/(?<![\p{L}])(pet|пет|пэт)(?![\p{L}])|петг|petg|пластик/u.test(t)) {
    return { base: "pet", thicknessMm: thickness, color }
  }
  if (mirror) return { base: "mirror-acr", thicknessMm: thickness, color }
  return null
}

function formatThickness(mm: number): string {
  return Number.isInteger(mm) ? String(mm) : String(mm).replace(".", "")
}

/**
 * Прив'язує матеріал до коду з catalog/data/materials.json.
 * Повертає null, якщо такого матеріалу в каталозі немає (бот тоді запитає кнопкою).
 */
export function resolveMaterialCode(
  hint: MaterialHint | null,
  kind: ProductKind | null,
  knownCodes: ReadonlySet<string>,
): string | null {
  if (!hint) return null
  const blank = kind === "blank"
  const candidates: string[] = []
  switch (hint.base) {
    case "pet":
      candidates.push(blank ? "bl-pet-05" : "pet-05")
      break
    case "ps": {
      const color = hint.color === "black" ? "black" : "white"
      candidates.push(blank ? `bl-ps-1-${color}` : `ps-1-${color}`)
      break
    }
    case "mirror-ps": {
      const color = hint.color === "silver" ? "silver" : "gold"
      candidates.push(`bl-ps-1-${color}`)
      break
    }
    case "mirror-acr": {
      const color = hint.color === "silver" ? "silver" : "gold"
      const th = hint.thicknessMm === 2 ? "2" : "3"
      candidates.push(`bl-mir-${th}-${color}`)
      break
    }
    case "acr": {
      const th = hint.thicknessMm ? formatThickness(hint.thicknessMm) : "3"
      const colored = hint.color && hint.color !== "clear" && hint.color !== "white"
      if (blank) {
        if (colored) candidates.push(`bl-acr-${th}-${hint.color}`, `bl-acr-3-${hint.color}`)
        candidates.push(`bl-acr-${th}`, "bl-acr-3")
      } else {
        candidates.push(`acr-${th}`, "acr-3")
      }
      break
    }
  }
  return candidates.find((c) => knownCodes.has(c)) ?? null
}

export function parseKind(text: string): ProductKind | null {
  const t = text.toLowerCase()
  if (/заготовк|підложк|подложк|брелок|blank/u.test(t)) return "blank"
  if (/на замовлення|на заказ|іменн|именн|з ім['’]ям|с именем|індивідуальн|индивидуальн|під логотип|под логотип/u.test(t)) {
    return "custom"
  }
  if (/готов/u.test(t)) return "ready"
  return null
}

/** Ключові слова → категорія. Порядок важливий: специфічніші правила вище. */
const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/брелок/u, "blanks-breloky"],
  [/підложк|подложк/u, "blanks-pet-pidlozhky"],
  [/заготовк.*(дзеркал|зеркал)|(дзеркал|зеркал).*заготовк/u, "blanks-dzerkalni"],
  [/заготовк.*(кольор|цветн)|(кольор|цветн).*заготовк/u, "blanks-kolorovyi"],
  [/заготовк/u, "blanks-akryl-prozoryi"],
  [/тірам|тирам/u, "food-tiramisu"],
  [/цифр.*торт|торт.*цифр/u, "food-cyfry"],
  [/пряник|печив|печень/u, "food-pryaniky"],
  [/кав[аиуі]|капуч|кофе|латте/u, "food-kava"],
  [/хліб|хлеб|піц|пицц|паск/u, "food-khlib"],
  [/логотип.*(кав|кондит)|(кав|кондит).*логотип/u, "food-horeca"],
  [/напис.*торт|торт.*напис|надпис.*торт|торт.*надпис/u, "food-napysy"],
  [/торт|десерт|кондит/u, "food-tort"],
  [/миколай|николай/u, "holidays-mykolai"],
  [/нов(ий|ый|ого|ор)\s*р|новоріч|новогод|сніжин|снежин|ялин|ёлк|елк|різдв|рожд/u, "holidays-novyi-rik"],
  [/весіл|свад/u, "holidays-vesillia"],
  [/день\s*(народж|рожд)/u, "holidays-den-narodzhennia"],
  [/великод|пасх/u, "holidays-velykden"],
  [/мандал.*штукат|штукат.*мандал/u, "plaster-mandaly"],
  [/панно/u, "plaster-panno"],
  [/цегл|кирпич|камін|камен/u, "plaster-kamin"],
  [/штукатур/u, "plaster"],
  [/мандал/u, "walls-mandaly"],
  [/дамаск/u, "walls-damask"],
  [/вишиван|вышиван|орнамент/u, "walls-vyshyvanka"],
  [/петрик/u, "walls-petrykivka"],
  [/бордюр/u, "walls-bordiury"],
  [/геометр/u, "walls-heometriia"],
  [/тварин|животн|птах|птиц/u, "walls-tvaryny"],
  [/лист|гілк|ветк|дерев/u, "walls-roslyny"],
  [/камуфляж|піксел|пиксел/u, "camo-pixel"],
  [/тризуб|герб/u, "camo-tryzub"],
  [/маркуван|маркиров/u, "camo-markuvannia"],
  [/осбб|під['’]?їзд|подъезд/u, "business-osbb"],
  [/паркув|парков|розміт|размет/u, "business-parkovka"],
  [/фасад|адрес|номер будин|номер дом/u, "business-fasad"],
  [/склад|виробн|производ/u, "business-sklad"],
  [/знак/u, "business-znaky"],
  [/алфав/u, "letters-alfavity"],
  [/логотип|картинк|за фото|по фото/u, "custom-po-kartyntsi"],
]

export function parseCategory(text: string, knownHandles: ReadonlySet<string>): string | null {
  const t = text.toLowerCase()
  for (const [re, handle] of CATEGORY_RULES) {
    if (re.test(t) && knownHandles.has(handle)) return handle
  }
  return null
}

/** Тип товару за категорією, якщо Денис не сказав явно. */
export function kindFromCategory(handle: string | null): ProductKind | null {
  if (!handle) return null
  if (handle === "blanks" || handle.startsWith("blanks-")) return "blank"
  if (handle === "custom" || handle.startsWith("custom-") || handle === "food-napysy" || handle === "letters-napys") {
    return "custom"
  }
  return "ready"
}

export function parseTextOnStencil(text: string): string | null {
  const m = QUOTED_RE.exec(text)
  const value = m?.[1]?.trim()
  return value ? value : null
}

/** Назва: перший рядок без ціни, розмірів, матеріалу й лапок. */
export function parseTitle(text: string): string | null {
  const firstLine = text.split(/\r?\n/).map((l) => l.trim()).find((l) => l.length > 0)
  if (!firstLine) return null
  const cleaned = stripPrices(firstLine)
    .replace(QUOTED_RE, " ")
    .replace(PAIR_RE, " ")
    .replace(DIAMETER_RE, " ")
    .replace(LIST_RE, " ")
    .replace(/(?<![\p{L}])(pet|пет|пэт|ps|пс)(?![\p{L}])/giu, " ")
    .replace(/\d+([.,]\d+)?\s*(мм|mm|см|cm)/giu, " ")
    .replace(/(дзеркальн\w*|зеркальн\w*|прозор\w*|акрил\w*|полістирол\w*|полистирол\w*|пластик\w*)/giu, " ")
    .replace(/(ціна|цена|price)\s*[:=-]?/giu, " ")
    .replace(/\s*[,;:–—-]\s*(?=[,;:–—-]|$)/gu, " ")
    .replace(/\s{2,}/gu, " ")
    .replace(/^[\s,;:–—-]+|[\s,;:–—-]+$/gu, "")
    .trim()
  if (cleaned.length < 3) return null
  const title = cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  return title.length > 120 ? `${title.slice(0, 117)}...` : title
}

export function parseCaption(text: string, knownCategoryHandles: ReadonlySet<string>): ParsedCaption {
  const category = parseCategory(text, knownCategoryHandles)
  return {
    price_uah: parsePrice(text),
    sizes_mm: parseSizes(text),
    materialHint: parseMaterial(text),
    kind: parseKind(text) ?? kindFromCategory(category),
    category_handle: category,
    title_uk: parseTitle(text),
    text_on_stencil: parseTextOnStencil(text),
  }
}
