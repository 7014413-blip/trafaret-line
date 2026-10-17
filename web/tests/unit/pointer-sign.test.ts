// Pointer sign prices (Денис 2026-10-10): 25×10 — 450 ₴, 30×12 — 600 ₴, 35×15 — 890 ₴ a piece;
// a custom size costs 18 000 ₴/m² of its box, kept between the fixed sizes around it.

import { describe, expect, it } from "vitest";
import { pricePointerSign } from "@/lib/pointer-sign/price";
import type { PointerSignDesign } from "@/types/pointer-sign";

const design = (patch: Partial<PointerSignDesign>): PointerSignDesign => ({
  sizeCode: "25x10", widthMm: 250, heightMm: 100, direction: -1, shape: "pointer",
  baseMaterialId: "black", overlayMaterialId: "white",
  lines: [{ text: "КАВʼЯРНЯ", fontId: "roboto-slab", size: 1 }],
  arrow: { placement: "start", lineIndex: 0 }, logo: null, quantity: 1,
  ...patch,
});

describe("pointer sign price", () => {
  it("uses the owner's prices for the fixed sizes", () => {
    expect(pricePointerSign(design({})).unitPrice).toBe(450);
    expect(pricePointerSign(design({ sizeCode: "30x12", widthMm: 300, heightMm: 120 })).unitPrice).toBe(600);
    expect(pricePointerSign(design({ sizeCode: "35x15", widthMm: 350, heightMm: 150 })).unitPrice).toBe(890);
  });

  it("keeps a custom size between the fixed sizes around it", () => {
    const between = pricePointerSign(design({ sizeCode: "custom", widthMm: 280, heightMm: 110 }));
    expect(between.unitPrice).toBeGreaterThanOrEqual(450);
    expect(between.unitPrice).toBeLessThanOrEqual(600);
    expect(between.unitPrice % 10).toBe(0);
  });

  it("applies the quantity discount to every piece", () => {
    const ten = pricePointerSign(design({ quantity: 10 }));
    expect(ten.unitPrice).toBe(427);
    expect(ten.total).toBe(4270);
  });

  it("never shows square metres to the customer", () => {
    const price = pricePointerSign(design({ sizeCode: "custom", widthMm: 400, heightMm: 150, quantity: 12 }));
    for (const line of price.lines) expect(line.label).not.toMatch(/м²|м2/);
  });

  it("writes the breakdown in the page language", () => {
    const uk = pricePointerSign(design({ quantity: 10 }));
    const ru = pricePointerSign(design({ quantity: 10 }), undefined, undefined, "ru");
    expect(ru.unitPrice).toBe(uk.unitPrice);
    expect(uk.lines.map((l) => l.label)).toContain("Опт за кількість: −5%");
    expect(ru.lines[0].label).toBe("Размер 25 × 10 см");
    expect(ru.lines.map((l) => l.label)).toContain("Опт по количеству: −5%");
  });
});
