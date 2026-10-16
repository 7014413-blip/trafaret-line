// Reads data/knowledge_base/rules_logistics.json: packaging (tube or flat pack, cardboard
// weight), volumetric weight and the Nova Poshta parcel locker limits. Every number must be
// zero or more; a wrong file stops the build with the field name.

import raw from "../../data/knowledge_base/rules_logistics.json";
import type { ParcelConfig } from "../../types/packaging";
import type { LogisticsRules } from "../../types/shipping";

const FILE = "data/knowledge_base/rules_logistics.json";
const rules = raw as LogisticsRules;

function nonNegative(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error(`${FILE}: parcel.${where} must be a number ≥ 0`);
  return value;
}

const p = rules.parcel;

/** Parcel rules for lib/calculators/packaging.ts. */
export const PARCEL_RULES: ParcelConfig = {
  marginXYmm: nonNegative(p.marginXYmm, "marginXYmm"),
  paddingZmm: nonNegative(p.paddingZmm, "paddingZmm"),
  tubeDiameterMm: nonNegative(p.tubeDiameterMm, "tubeDiameterMm"),
  tubeExtraMm: nonNegative(p.tubeExtraMm, "tubeExtraMm"),
  flexibleMaxMm: nonNegative(p.flexibleMaxMm, "flexibleMaxMm"),
  cardboardGm2: nonNegative(p.cardboardGm2, "cardboardGm2"),
  cardboardMarginMm: nonNegative(p.cardboardMarginMm, "cardboardMarginMm"),
  cardboardExtra: nonNegative(p.cardboardExtra, "cardboardExtra"),
  cardboardMinG: nonNegative(p.cardboardMinG, "cardboardMinG"),
  flatMinHeightMm: nonNegative(p.flatMinHeightMm, "flatMinHeightMm"),
  tubeGcm2: nonNegative(p.tubeGcm2, "tubeGcm2"),
  volumetricDivisor: nonNegative(p.volumetricDivisor, "volumetricDivisor"),
  postomatMaxMm: {
    length: nonNegative(p.postomatMaxMm.length, "postomatMaxMm.length"),
    width: nonNegative(p.postomatMaxMm.width, "postomatMaxMm.width"),
    height: nonNegative(p.postomatMaxMm.height, "postomatMaxMm.height"),
  },
  postomatMaxKg: nonNegative(p.postomatMaxKg, "postomatMaxKg"),
};
