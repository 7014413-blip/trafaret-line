// Sheets for pointer signs: the acrylic and mirror acrylic palette of the sign constructor
// (lib/calculators/signage.ts) plus polystyrene from the materials catalogue (lib/materials.ts).
// Thicknesses [default, Claude 2026-10-10]: acrylic base 3 mm with a 2 mm overlay,
// polystyrene base 2 mm with a 1 mm overlay. All of them cost the same per sign.

import type { PointerMaterial } from "../../types/pointer-sign";
import { ACRYLIC_PALETTE } from "../calculators/signage";

const fromSignPalette: PointerMaterial[] = ACRYLIC_PALETTE.map((sheet) => ({
  id: sheet.id,
  group: sheet.finish === "mirror" ? "mirror" : "acrylic",
  name: sheet.name,
  hex: sheet.hex,
  mirror: sheet.finish === "mirror",
  baseThicknessMm: 3,
  overlayThicknessMm: 2,
  minLetterMm: sheet.minLetterMm,
  inStock: sheet.inStock,
}));

// Matte silver acrylic for the «Стрілка з обʼємними літерами» look (Денис's renders 2026-10-10) [default].
const silverMatte: PointerMaterial = {
  id: "silver-matte", group: "acrylic", name: { uk: "Сріблястий матовий", ru: "Серебристый матовый", en: "Matte silver" },
  hex: "#b9bdc2", mirror: false, baseThicknessMm: 3, overlayThicknessMm: 2, minLetterMm: 15, inStock: true,
};

const polystyrene: PointerMaterial[] = [
  {
    id: "ps-white", group: "polystyrene", name: { uk: "Полістирол білий", ru: "Полистирол белый", en: "White polystyrene" },
    hex: "#f2f2ee", mirror: false, baseThicknessMm: 2, overlayThicknessMm: 1, minLetterMm: 10, inStock: true,
  },
  {
    id: "ps-black", group: "polystyrene", name: { uk: "Полістирол чорний", ru: "Полистирол чёрный", en: "Black polystyrene" },
    hex: "#151515", mirror: false, baseThicknessMm: 2, overlayThicknessMm: 1, minLetterMm: 10, inStock: true,
  },
  {
    id: "ps-mirror-gold", group: "polystyrene", name: { uk: "Дзеркальний полістирол золото", ru: "Зеркальный полистирол золото", en: "Gold mirror polystyrene" },
    hex: "#d4af37", mirror: true, baseThicknessMm: 2, overlayThicknessMm: 1, minLetterMm: 12, inStock: true,
  },
  {
    id: "ps-mirror-silver", group: "polystyrene", name: { uk: "Дзеркальний полістирол срібло", ru: "Зеркальный полистирол серебро", en: "Silver mirror polystyrene" },
    hex: "#c9ccd0", mirror: true, baseThicknessMm: 2, overlayThicknessMm: 1, minLetterMm: 12, inStock: true,
  },
];

export const POINTER_MATERIALS: PointerMaterial[] = [...fromSignPalette, silverMatte, ...polystyrene];

export const POINTER_MATERIAL_GROUPS: { id: PointerMaterial["group"]; name: string }[] = [
  { id: "acrylic", name: "Акрил" },
  { id: "mirror", name: "Дзеркальний акрил" },
  { id: "polystyrene", name: "Полістирол" },
];
