// Parcel size and weight for Nova Poshta / Ukrposhta (Денис, 2026-10-08).
//   Rigid (acrylic, mirror, polystyrene, wood, thick PET): flat pack,
//     X = max width + 10 mm, Y = max height + 10 mm, Z = Σ(thickness × qty) + 20 mm.
//   Flexible (PET ≤ 0.8 mm): tube by default, (min side + 20) × 100 × 100 mm;
//     the customer can switch to a flat pack.
//   Mixed cart (rigid + flexible): one flat pack with the largest dimensions.
//   Weight: actual = material + tare (0.4 kg flat, 0.25 kg tube);
//   volumetric = L × W × H (cm) / 4000; billed = the larger of the two.
// The customer sees the result in cm and kg only (no m², rule of 2026-10-08).
import { MATERIALS, weightG } from "./stencil-math";
import type { MaterialType, Shape } from "../types/customizer";

export type PackKind = "flat" | "tube";

export interface ParcelItem {
  materialId: MaterialType;
  shape?: Shape;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export interface ParcelConfig {
  marginXYmm: number;       // 10
  paddingZmm: number;       // 20 (padding + document envelope)
  tubeDiameterMm: number;   // 100
  tubeExtraMm: number;      // 20
  flexibleMaxMm: number;    // 0.8: thinner PET can be rolled
  tareFlatKg: number;       // 0.4
  tareTubeKg: number;       // 0.25
  volumetricDivisor: number; // 4000 (Nova Poshta, cm³ per kg)
}

export const DEFAULT_PARCEL: ParcelConfig = {
  marginXYmm: 10, paddingZmm: 20, tubeDiameterMm: 100, tubeExtraMm: 20,
  flexibleMaxMm: 0.8, tareFlatKg: 0.4, tareTubeKg: 0.25, volumetricDivisor: 4000,
};

export interface Parcel {
  kind: PackKind;
  /** Box or tube, mm, longest side first. */
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  actualKg: number;
  volumetricKg: number;
  /** What the carrier bills: max(actual, volumetric), rounded up to 0.1 kg. */
  billingKg: number;
}

/** PET up to 0.8 mm can go rolled in a tube. */
export function isFlexible(materialId: MaterialType, cfg: ParcelConfig = DEFAULT_PARCEL): boolean {
  const m = MATERIALS[materialId];
  return m.id.startsWith("pet") && m.thicknessMm <= cfg.flexibleMaxMm;
}

/**
 * One parcel for the cart. `prefer` is the customer's choice for flexible items;
 * any rigid item forces a flat pack.
 */
export function parcelFor(items: ParcelItem[], prefer: PackKind = "tube", cfg: ParcelConfig = DEFAULT_PARCEL): Parcel | null {
  const list = items.filter((i) => i.quantity > 0);
  if (!list.length) return null;

  const materialKg = list.reduce((s, i) => s + (weightG({ shape: i.shape ?? "rect", widthMm: i.widthMm, heightMm: i.heightMm }, MATERIALS[i.materialId]) * i.quantity) / 1000, 0);
  const allFlexible = list.every((i) => isFlexible(i.materialId, cfg));
  const kind: PackKind = allFlexible && prefer === "tube" ? "tube" : "flat";

  let dims: [number, number, number];
  if (kind === "tube") {
    // rolled along the long side, so the tube is as long as the shortest side of the largest sheet
    const len = Math.max(...list.map((i) => Math.min(i.widthMm, i.heightMm))) + cfg.tubeExtraMm;
    dims = [len, cfg.tubeDiameterMm, cfg.tubeDiameterMm];
  } else {
    const x = Math.max(...list.map((i) => Math.max(i.widthMm, i.heightMm))) + cfg.marginXYmm;
    const y = Math.max(...list.map((i) => Math.min(i.widthMm, i.heightMm))) + cfg.marginXYmm;
    const z = list.reduce((s, i) => s + MATERIALS[i.materialId].thicknessMm * i.quantity, 0) + cfg.paddingZmm;
    dims = [x, y, z];
  }
  const [l, w, h] = dims.map((v) => Math.ceil(v)).sort((a, b) => b - a) as [number, number, number];

  const actualKg = materialKg + (kind === "tube" ? cfg.tareTubeKg : cfg.tareFlatKg);
  const volumetricKg = ((l / 10) * (w / 10) * (h / 10)) / cfg.volumetricDivisor;
  const billingKg = Math.ceil(Math.max(actualKg, volumetricKg) * 10) / 10;
  return { kind, lengthMm: l, widthMm: w, heightMm: h, actualKg: round3(actualKg), volumetricKg: round3(volumetricKg), billingKg };
}

const round3 = (v: number) => Math.round(v * 1000) / 1000;
