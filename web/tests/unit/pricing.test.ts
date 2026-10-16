// Price rules approved by Денис (CLAUDE.md, ТЗ §0): price by sheet area rounded up to 10 ₴,
// minimum 150 ₴ (acrylic 250 ₴), one quantity discount 5/10/15 % rounded down, +5 % for a
// stencil larger than the machine sheet.

import { describe, expect, it } from "vitest";
import { applyDiscount, nextTierHint, priceStencil, roundUp } from "@/lib/calculators/pricing";
import { MATERIALS } from "@/lib/materials";

describe("stencil price", () => {
  it("never goes below the minimum price of the material", () => {
    const small = priceStencil({ shape: "rect", widthMm: 100, heightMm: 100 }, MATERIALS.pet_thin, 1);
    expect(small.unitPrice).toBe(150);
    const acrylic = priceStencil({ shape: "rect", widthMm: 100, heightMm: 100 }, MATERIALS.acrylic, 1);
    expect(acrylic.unitPrice).toBe(250);
  });

  it("charges the sheet area at the material rate, rounded up to 10 ₴", () => {
    // 0.4 × 0.3 m = 0.12 m² × 2200 ₴/m² = 264 ₴ → 270 ₴
    const price = priceStencil({ shape: "rect", widthMm: 400, heightMm: 300 }, MATERIALS.pet_thin, 1);
    expect(price.unitPrice).toBe(270);
    expect(price.total).toBe(270);
    expect(price.composite).toBe(false);
  });

  it("adds 5 % for a stencil made of several machine sheets", () => {
    const one = priceStencil({ shape: "rect", widthMm: 1400, heightMm: 2000 }, MATERIALS.pet_thin, 1);
    const split = priceStencil({ shape: "rect", widthMm: 1400, heightMm: 2010 }, MATERIALS.pet_thin, 1);
    expect(one.composite).toBe(false);
    expect(split.composite).toBe(true);
    // 2.81 m² also gets the large-format discount (−10 % from 1 m²), applied after the +5 %.
    const plain = roundUp(1.4 * 2.01 * 2200, 10);
    expect(split.discounts).toEqual([{ label: "Великий формат", percent: 10 }]);
    expect(split.unitPrice).toBe(applyDiscount(roundUp(plain * 1.05, 10), 0.1));
  });

  it("gives one quantity discount: 10+ −5 %, 50+ −10 %, 100+ −15 %", () => {
    const sheet = { shape: "rect" as const, widthMm: 100, heightMm: 100 };
    expect(priceStencil(sheet, MATERIALS.pet_thin, 9).unitPrice).toBe(150);
    expect(priceStencil(sheet, MATERIALS.pet_thin, 10).unitPrice).toBe(142);
    expect(priceStencil(sheet, MATERIALS.pet_thin, 50).unitPrice).toBe(135);
    expect(priceStencil(sheet, MATERIALS.pet_thin, 100).unitPrice).toBe(127);
    expect(priceStencil(sheet, MATERIALS.pet_thin, 100).total).toBe(12_700);
  });
});

describe("discount helpers", () => {
  it("rounds a discounted price down to whole hryvnias", () => {
    expect(applyDiscount(150, 0.05)).toBe(142);
    expect(applyDiscount(150, 0)).toBe(150);
  });

  it("tells how many pieces give the next discount", () => {
    expect(nextTierHint(7)).toMatchObject({ addQty: 3, nextDiscount: 0.05 });
    expect(nextTierHint(10)).toMatchObject({ addQty: 40, nextDiscount: 0.1 });
    expect(nextTierHint(100)).toBeNull();
  });
});
