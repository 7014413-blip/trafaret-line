// The knowledge base (data/knowledge_base) holds Денис's numbers, and the code reads them
// from there: rates, minimum prices, densities, packaging, parcel locker limits, the seller.

import { describe, expect, it } from "vitest";
import materials from "@/data/knowledge_base/materials.json";
import logistics from "@/data/knowledge_base/rules_logistics.json";
import fop from "@/data/knowledge_base/rules_fop.json";
import { MATERIALS, MACHINE_SHEET_MM } from "@/lib/materials";
import { DEFAULT_PARCEL, parcelFor } from "@/lib/calculators/packaging";
import { DEFAULT_ACRYLIC_WEIGHT } from "@/lib/calculators/weight";
import { SITE } from "@/data/site";

describe("knowledge base", () => {
  it("keeps the approved stencil and blank rates, UAH per m²", () => {
    const rate = (id: keyof typeof MATERIALS) => [MATERIALS[id].baseSquareMeterPrice, MATERIALS[id].wholesaleSquareMeterPrice];
    expect(rate("pet_thin")).toEqual([2200, null]);
    expect(rate("polystyrene")).toEqual([2300, null]);
    expect(rate("acrylic")).toEqual([4000, null]);
    expect(rate("acrylic_3")).toEqual([2990, 2830]);
    expect(rate("acrylic_15")).toEqual([20000, 18400]);
    expect(rate("acrylic_black_10")).toEqual([14000, 12890]);
    expect(rate("acrylic_mirror_3")).toEqual([8200, null]);
    expect(rate("pet_food_board")).toEqual([1800, null]);
    expect([MATERIALS.pet_thin.minPrice, MATERIALS.acrylic.minPrice]).toEqual([150, 250]);
  });

  it("the code reads every material and the weights from the file", () => {
    expect(Object.keys(materials.materials).sort()).toEqual(Object.keys(MATERIALS).sort());
    for (const [id, facts] of Object.entries(materials.materials)) {
      const option = MATERIALS[id as keyof typeof MATERIALS];
      expect({ t: option.thicknessMm, d: option.densityGcm3, r: option.baseSquareMeterPrice }).toEqual({ t: facts.thicknessMm, d: facts.densityGcm3, r: facts.retailPerM2 });
    }
    expect(MACHINE_SHEET_MM).toEqual({ width: 1400, height: 2000 });
    expect(DEFAULT_ACRYLIC_WEIGHT).toEqual(materials.acrylicWeight);
    expect([MATERIALS.acrylic_3.densityGcm3, MATERIALS.pet_thin.densityGcm3]).toEqual([1.19, 1.38]);
  });

  it("packs by the logistics rules and keeps big parcels out of parcel lockers", () => {
    expect(DEFAULT_PARCEL).toEqual(logistics.parcel);
    expect(DEFAULT_PARCEL.postomatMaxMm).toEqual({ length: 600, width: 400, height: 300 });
    const small = parcelFor([{ materialId: "acrylic_3", widthMm: 200, heightMm: 200, quantity: 1 }]);
    const large = parcelFor([{ materialId: "acrylic_3", widthMm: 700, heightMm: 300, quantity: 1 }]);
    expect(small?.kind).toBe("flat");
    expect(small?.fitsPostomat).toBe(true);
    expect(large?.fitsPostomat).toBe(false);
  });

  it("names one seller, 2nd group without VAT", () => {
    expect(fop.seller.legalName).toBe("ФОП Берчук Наталя Леонідівна");
    expect(SITE.legal).toBe(fop.seller.legalName);
    expect(SITE.tax).toBe("2 група, без ПДВ");
    expect(fop.seller.vatPayer).toBe(false);
  });
});
