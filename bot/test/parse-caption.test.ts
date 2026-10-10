import assert from "node:assert/strict"
import { readFileSync } from "node:fs"
import path from "node:path"
import { test } from "node:test"
import { buildCatalogLookup } from "../src/lib/catalog"
import { applyText, checkDraft, newDraft, setKind } from "../src/lib/draft"
import {
  parseCaption,
  parseCategory,
  parseKind,
  parseMaterial,
  parsePrice,
  parseSizes,
  parseTitle,
  resolveMaterialCode,
} from "../src/lib/parse-caption"
import type { RawCategory, RawMaterial } from "../src/types/catalog"

const DATA = path.resolve(__dirname, "..", "..", "data")
const catalog = buildCatalogLookup(
  JSON.parse(readFileSync(path.join(DATA, "categories.json"), "utf8")) as RawCategory[],
  JSON.parse(readFileSync(path.join(DATA, "materials.json"), "utf8")) as Record<string, RawMaterial>,
)
const handles = new Set(catalog.categoryByHandle.keys())
const codes = new Set(catalog.materialByCode.keys())

test("ціна: грн, ₴, «ціна 350», десяткові", () => {
  assert.equal(parsePrice("тірамісу Ø34 PET 350 грн"), 350)
  assert.equal(parsePrice("сніжинка 120₴"), 120)
  assert.equal(parsePrice("ціна: 99"), 99)
  assert.equal(parsePrice("цена 149,50 грн"), 150)
  assert.equal(parsePrice("без ціни 15 см"), null)
})

test("розміри: діаметр, пари, списки, одиниці", () => {
  assert.deepEqual(parseSizes("тірамісу Ø34 PET 350 грн"), [[340, 340]])
  assert.deepEqual(parseSizes("30x20 см"), [[300, 200]])
  assert.deepEqual(parseSizes("300х200 мм"), [[300, 200]])
  assert.deepEqual(parseSizes("сніжинка 15, 20, 25 см, пластик"), [[150, 150], [200, 200], [250, 250]])
  assert.deepEqual(parseSizes("діаметр 18 см"), [[180, 180]])
})

test("розміри: товщина листа й ціна не плутаються з розміром", () => {
  assert.deepEqual(parseSizes("PET 0,5 мм, 20 см, 150 грн"), [[200, 200]])
  assert.deepEqual(parseSizes("акрил 3 мм 40x30 см"), [[400, 300]])
  assert.deepEqual(parseSizes("350 грн"), [])
})

test("матеріал: розпізнавання й прив'язка до кодів каталогу", () => {
  assert.equal(resolveMaterialCode(parseMaterial("PET 0,5"), "ready", codes), "pet-05")
  assert.equal(resolveMaterialCode(parseMaterial("пластик"), "blank", codes), "bl-pet-05")
  assert.equal(resolveMaterialCode(parseMaterial("полістирол чорний"), "ready", codes), "ps-1-black")
  assert.equal(resolveMaterialCode(parseMaterial("акрил 3 мм"), "ready", codes), "acr-3")
  assert.equal(resolveMaterialCode(parseMaterial("акрил 6 мм"), "blank", codes), "bl-acr-6")
  assert.equal(resolveMaterialCode(parseMaterial("червоний акрил"), "blank", codes), "bl-acr-3-red")
  assert.equal(resolveMaterialCode(parseMaterial("дзеркальний акрил срібло 2 мм"), "blank", codes), "bl-mir-2-silver")
  assert.equal(resolveMaterialCode(parseMaterial("акрил 300 мм"), "ready", codes), "acr-3")
  assert.equal(parseMaterial("сніжинка 15 см"), null)
})

test("тип і категорія", () => {
  assert.equal(parseKind("заготовка коло 10 см"), "blank")
  assert.equal(parseKind("напис на замовлення"), "custom")
  assert.equal(parseKind("сніжинка"), null)
  assert.equal(parseCategory("тірамісу Ø34", handles), "food-tiramisu")
  assert.equal(parseCategory("сніжинка 15 см", handles), "holidays-novyi-rik")
  assert.equal(parseCategory("підложка під торт", handles), "blanks-pet-pidlozhky")
  assert.equal(parseCategory("цифри на торт", handles), "food-cyfry")
  assert.equal(parseCategory("щось незрозуміле", handles), null)
})

test("назва очищується від ціни, розміру й матеріалу", () => {
  assert.equal(parseTitle("тірамісу Ø34 PET 350 грн"), "Тірамісу")
  assert.equal(parseTitle("Сніжинка 15 см, пластик, 120 грн"), "Сніжинка")
  assert.equal(parseTitle("350 грн"), null)
})

test("повний підпис", () => {
  const parsed = parseCaption("тірамісу Ø34 PET 350 грн", handles)
  assert.equal(parsed.category_handle, "food-tiramisu")
  assert.equal(parsed.kind, "ready")
  assert.equal(parsed.price_uah, 350)
  assert.deepEqual(parsed.sizes_mm, [[340, 340]])
  assert.equal(parsed.title_uk, "Тірамісу")
  const custom = parseCaption("напис на торт «З днем народження» 20 см", handles)
  assert.equal(custom.kind, "custom")
  assert.equal(custom.text_on_stencil, "З днем народження")
})

test("чернетка: текст не перетирає вибране кнопками, перевірка готовності", () => {
  let draft = newDraft(1, 1)
  assert.deepEqual(checkDraft(draft).blocking, ["фото або макет", "категорія", "тип товару"])
  draft = { ...draft, product: { ...draft.product, category_handle: "food-tort" } }
  draft = applyText(draft, "тірамісу Ø34 PET 350 грн", catalog)
  assert.equal(draft.product.category_handle, "food-tort")
  assert.equal(draft.product.material, "pet-05")
  draft = { ...draft, files: [{ name: "01.jpg", kind: "photo", uniqueId: "u1" }] }
  assert.deepEqual(checkDraft(draft).blocking, [])
  draft = setKind(draft, "blank", catalog)
  assert.equal(draft.product.material, "bl-pet-05")
})
