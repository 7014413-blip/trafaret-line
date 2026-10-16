// Weight of sheets. Acrylic uses the owner's measured weights per cm² (Денис 2026-10-10:
// 3 mm Ø24 159 g, Ø25 172 g, Ø30 248 g → 0.351 g/cm²; 1.5 mm Ø20 65 g, Ø30 145 g, Ø40 255 g
// → 0.205 g/cm²; real sheets are thicker than nominal). Other thicknesses: straight line
// through the two measured points, and from 4 mm up never less than nominal thickness ×
// 1.19 g/cm³ (the line under-estimates thick sheets). Other materials: area × thickness × density.
// Circles and ovals use their real area, not the bounding box.

import type { AcrylicWeightConfig, MaterialOption, SheetSize } from "../../types/customizer";
import type { ParcelItem, WeightBreakdown, WeightLine } from "../../types/packaging";
import { ACRYLIC_WEIGHT } from "../knowledge-base/materials-knowledge";
import { MATERIALS } from "../materials";
import { shapeAreaM2 } from "./geometry";

const CM2_PER_M2 = 10_000;
const MM_PER_CM = 10;

/** Measured acrylic weights, from data/knowledge_base/materials.json (Денис can refine the points there). */
export const DEFAULT_ACRYLIC_WEIGHT: AcrylicWeightConfig = ACRYLIC_WEIGHT;

/** Acrylic sheet weight per cm² for any thickness, see the top of the file. */
export function acrylicGramsPerCm2(thicknessMm: number, cfg: AcrylicWeightConfig = DEFAULT_ACRYLIC_WEIGHT): number {
  const exact = cfg.points.find((p) => p.thicknessMm === thicknessMm);
  if (exact) return exact.gramsPerCm2;
  const [a, b] = [...cfg.points].sort((x, y) => x.thicknessMm - y.thicknessMm);
  const slope = (b.gramsPerCm2 - a.gramsPerCm2) / (b.thicknessMm - a.thicknessMm);
  const line = a.gramsPerCm2 + slope * (thicknessMm - a.thicknessMm);
  const nominal = (thicknessMm / MM_PER_CM) * cfg.nominalDensityGcm3;
  return thicknessMm >= cfg.nominalFromMm ? Math.max(line, nominal) : line;
}

/** Acrylic and mirror acrylic sheets (density 1.19) use the measured weights. */
export function isAcrylic(material: MaterialOption): boolean {
  return material.id.startsWith("acrylic");
}

/** Weight of a flat piece with a known area, grams. */
export function weightByAreaG(areaM2: number, material: MaterialOption, cfg: AcrylicWeightConfig = DEFAULT_ACRYLIC_WEIGHT): number {
  const areaCm2 = areaM2 * CM2_PER_M2;
  if (isAcrylic(material)) return areaCm2 * acrylicGramsPerCm2(material.thicknessMm, cfg);
  const thicknessCm = material.thicknessMm / MM_PER_CM;
  return areaCm2 * thicknessCm * material.densityGcm3;
}

/** Weight of one sheet in grams. */
export function weightG(sheet: SheetSize, material: MaterialOption): number {
  return weightByAreaG(shapeAreaM2(sheet), material);
}

/** Weight of one cart line. */
export function weightLine(item: ParcelItem): WeightLine {
  const material = MATERIALS[item.materialId];
  const sheet: SheetSize = { shape: item.shape ?? "rect", widthMm: item.widthMm, heightMm: item.heightMm };
  const pieceAreaM2 = shapeAreaM2(sheet);
  const pieceWeightG = weightByAreaG(pieceAreaM2, material);
  return {
    materialId: item.materialId,
    quantity: item.quantity,
    pieceAreaM2,
    pieceWeightG,
    totalWeightG: pieceWeightG * item.quantity,
  };
}

/** Material weight of the whole cart plus the packaging tare, kg (3 decimals). */
export function weightBreakdown(items: ParcelItem[], tareKg: number): WeightBreakdown {
  const lines = items.filter((i) => i.quantity > 0).map(weightLine);
  const materialKg = lines.reduce((sum, l) => sum + l.totalWeightG, 0) / 1000;
  return {
    lines,
    materialKg: round3(materialKg),
    tareKg,
    actualKg: round3(materialKg + tareKg),
  };
}

export function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}
