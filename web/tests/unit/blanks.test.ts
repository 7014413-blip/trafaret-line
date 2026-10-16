import { describe, expect, it } from "vitest";
import { roundUp } from "@/lib/calculators/pricing";
import { priceBlankDesign } from "@/lib/blanks/price";
import { readBlankDesign } from "@/lib/blanks/read-design";
import { BLANK_SHEETS, blankSheetAt, blankSheetInGroup, blankSheetsAt, blankThicknesses } from "@/lib/blanks/sheets";
import { blankTitle } from "@/lib/blanks/title";
import { catalogBlankChanges, catalogBlankPrice } from "@/lib/catalog/blank-catalog-price";
import { materialForCode } from "@/lib/catalog/material-map";
import { MATERIALS } from "@/lib/materials";
import type { BlankDesign, CatalogBlankProduct } from "@/types/blank";

const circle = (diameterCm: number, quantity = 1): BlankDesign => ({
  shapeId: "circle", widthMm: diameterCm * 10, heightMm: diameterCm * 10, materialId: "acrylic_3", colourId: "clear", quantity,
});

describe("blank price", () => {
  it("is the cutting fee plus sheet area × rate, rounded up to 1 ₴", () => {
    // acrylic 3 mm: fee 3 ₴, 2990 ₴/m² (knowledge base)
    expect(priceBlankDesign(circle(5)).unitPrice).toBe(11);
    expect(priceBlankDesign(circle(10)).unitPrice).toBe(33);
    expect(priceBlankDesign(circle(30)).unitPrice).toBe(273);
  });

  it("keeps a whole result whole despite binary fractions", () => {
    expect(roundUp(0.01 * 2300, 1)).toBe(23);
    expect(roundUp(23.4, 1)).toBe(24);
  });

  it("shows the wholesale scale and the pack before ordering", () => {
    const price = priceBlankDesign(circle(10, 1));
    expect(price.tiers.map((t) => [t.minQty, t.unitPrice])).toEqual([[1, 33], [10, 31], [50, 29], [100, 28]]);
    expect(price.packQty).toBe(10);
    expect(price.packPrice).toBe(310);
    const fifty = priceBlankDesign(circle(10, 50));
    expect(fifty.unitPrice).toBe(29);
    expect(fifty.total).toBe(1450);
    expect(fifty.discount).toBeCloseTo(0.1);
  });

  it("prices one-number shapes by the square around them", () => {
    const heart: BlankDesign = { ...circle(10), shapeId: "heart" };
    expect(priceBlankDesign(heart).unitPrice).toBe(priceBlankDesign(circle(10)).unitPrice);
  });
});

describe("blank design from the browser", () => {
  it("keeps what the shop cuts and squares one-number shapes", () => {
    const design = readBlankDesign({ shapeId: "star", widthMm: 120, heightMm: 999, materialId: "acrylic_mirror_3", colourId: "rose", extra: 1 }, 3);
    expect(design).toEqual({ shapeId: "star", widthMm: 120, heightMm: 120, materialId: "acrylic_mirror_3", colourId: "rose", quantity: 3 });
  });

  it("keeps width and height of a rectangle", () => {
    expect(readBlankDesign({ ...circle(10), shapeId: "rect", widthMm: 200, heightMm: 300 }, 1)).toMatchObject({ widthMm: 200, heightMm: 300 });
  });

  it("refuses shapes, sheets and sizes the shop does not cut", () => {
    expect(() => readBlankDesign({ ...circle(10), shapeId: "unicorn" }, 1)).toThrow("unknown shape");
    expect(() => readBlankDesign({ ...circle(10), colourId: "red" }, 1)).toThrow("sheet not on sale");
    expect(() => readBlankDesign({ ...circle(10), materialId: "pet_thin" }, 1)).toThrow("sheet not on sale");
    expect(() => readBlankDesign({ ...circle(10), widthMm: 10 }, 1)).toThrow("out of range");
    expect(() => readBlankDesign({ ...circle(10), widthMm: 1001 }, 1)).toThrow("out of range");
    expect(() => readBlankDesign(null, 1)).toThrow("not an object");
  });
});

describe("blank sheets", () => {
  it("are all priced blank materials", () => {
    for (const sheet of BLANK_SHEETS) {
      expect(MATERIALS[sheet.materialId].use).toBe("blank");
      expect(MATERIALS[sheet.materialId].baseSquareMeterPrice).toBeGreaterThan(0);
    }
  });

  it("keep the thickness and the colour when the group changes, if they exist there", () => {
    expect(blankSheetInGroup("coloured", blankSheetAt("clear", 3, "clear"))).toEqual({ group: "coloured", materialId: "acrylic_black_3", colourId: "black" });
    expect(blankSheetInGroup("mirror", blankSheetAt("mirror", 2, "silver"))).toMatchObject({ materialId: "acrylic_mirror_2", colourId: "silver" });
    expect(blankSheetInGroup("board", blankSheetAt("clear", 3, "clear"))).toMatchObject({ materialId: "pet_food_board", colourId: "clear" });
  });

  it("offer each thickness once with all its colours", () => {
    expect(blankThicknesses("coloured")).toEqual([2, 3, 5, 10]);
    expect(blankSheetsAt("coloured", 3).map((s) => s.colourId)).toEqual(["black", "milk", "red", "pink", "blue", "green", "yellow"]);
    expect(blankSheetAt("coloured", 3, "pink").materialId).toBe("acrylic_color");
  });

  it("name the line without food-contact claims", () => {
    const title = blankTitle({ ...circle(20), materialId: "pet_food_board" });
    expect(title).toBe("Заготовка «Коло» Ø20 см, PET 0,5 мм, підкладка під торт, прозорий");
    expect(title.toLowerCase()).not.toMatch(/харчов|сертиф/);
    expect(blankTitle({ ...circle(10), shapeId: "rect", widthMm: 200, heightMm: 300 })).toBe("Заготовка «Прямокутник» 20×30 см, акрил 3 мм, прозорий");
  });
});

describe("catalogue blank cards", () => {
  const product = (over: Partial<CatalogBlankProduct>): CatalogBlankProduct => ({
    handle: "zahotovka-kolo-akryl-prozoryi", type: "ready", primary_category: "blanks-akryl-prozoryi",
    options: { size: [{ code: "d10", sheet_mm: [100, 100], pieces: 1 }] },
    variants: [{ sku: "A", size: "d10", material: "bl-acr-3", price_uah: 33 }],
    ...over,
  });

  it("cost the same as the configurator", () => {
    expect(catalogBlankPrice([100, 100], 1, "bl-acr-3")).toBe(priceBlankDesign(circle(10)).unitPrice);
    expect(catalogBlankChanges([product({})])).toEqual([]);
  });

  it("list the variants whose price differs", () => {
    const old = product({ variants: [{ sku: "A", size: "d10", material: "bl-acr-3", price_uah: 30 }] });
    expect(catalogBlankChanges([old])).toEqual([{ handle: "zahotovka-kolo-akryl-prozoryi", sku: "A", from: 30, to: 33 }]);
  });

  it("leave products with their own work alone", () => {
    const old = { sku: "A", size: "d10", material: "bl-acr-3", price_uah: 1 };
    expect(catalogBlankChanges([product({ hole: { min: 3 }, variants: [old] })])).toEqual([]);
    expect(catalogBlankChanges([product({ primary_category: "blanks-perforovanyi", variants: [old] })])).toEqual([]);
  });

  it("price white polystyrene cake boards as a blank sheet, not as a stencil", () => {
    expect(materialForCode("bl-ps-1-white")).toBe("polystyrene_white_1");
    expect(catalogBlankPrice([200, 200], 1, "bl-ps-1-white")).toBe(5 + 72);
  });
});
