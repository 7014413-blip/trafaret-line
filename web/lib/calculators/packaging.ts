// Parcel for Nova Poshta / Ukrposhta (rules of Денис, 2026-10-08).
//   Rigid sheets (acrylic, mirror, polystyrene, plywood, thick PET): flat pack,
//     length = longest side + 10 mm, width = shorter side + 10 mm,
//     height = Σ(thickness × quantity) + 20 mm.
//   Flexible sheets (PET up to 0.8 mm): tube by default,
//     length = shortest side of the largest sheet + 20 mm, Ø 100 mm;
//     the customer can switch to a flat pack.
//   Mixed cart (rigid + flexible): one flat pack with the largest dimensions.
//   Flat pack (agreed with the catalogue thread 2026-10-10): pieces lie flat between two
//     sheets of 3-layer corrugated board 450 g/m², 2 cm of board on every side, +10 % for
//     folds and tape, at least 30 g; size (longest + 4) × (shortest + 4) × max(2, stack + 1) cm.
//   Tube: cardboard wall 0.07 g/cm² of its surface with caps.
//   Weight: actual = material (lib/calculators/weight.ts) + packaging;
//     volumetric = L × W × H (cm) / 4000; billed = the larger, rounded up to 0.1 kg.

import type { MaterialType } from "../../types/customizer";
import type { PackKind, Parcel, ParcelConfig, ParcelItem } from "../../types/packaging";
import { MATERIALS } from "../materials";
import { round3, weightBreakdown } from "./weight";
import { cmText } from "../format";

export const DEFAULT_PARCEL: ParcelConfig = {
  marginXYmm: 40,
  paddingZmm: 10,
  tubeDiameterMm: 100,
  tubeExtraMm: 20,
  flexibleMaxMm: 0.8,
  cardboardGm2: 450,
  cardboardMarginMm: 20,
  cardboardExtra: 0.1,
  cardboardMinG: 30,
  flatMinHeightMm: 20,
  tubeGcm2: 0.07,
  volumetricDivisor: 4000,
  // Nova Poshta parcel locker, largest cell: 40 × 30 × 60 cm, up to 20 kg.
  postomatMaxMm: { length: 600, width: 400, height: 300 },
  postomatMaxKg: 20,
};

/** PET up to 0.8 mm can go rolled in a tube. */
export function isFlexible(materialId: MaterialType, cfg: ParcelConfig = DEFAULT_PARCEL): boolean {
  const material = MATERIALS[materialId];
  return material.id.startsWith("pet") && material.thicknessMm <= cfg.flexibleMaxMm;
}

/** Tube or flat pack for the cart, and the reason (shown next to the switch). */
export function choosePack(items: ParcelItem[], prefer: PackKind, cfg: ParcelConfig = DEFAULT_PARCEL): { kind: PackKind; reason: Parcel["reason"] } {
  const allFlexible = items.every((item) => isFlexible(item.materialId, cfg));
  if (!allFlexible) return { kind: "flat", reason: "rigid_material" };
  if (prefer === "flat") return { kind: "flat", reason: "customer_choice" };
  return { kind: "tube", reason: "all_flexible" };
}

/** Tube dimensions, mm: [length, diameter, diameter]. */
export function tubeDimensions(items: ParcelItem[], cfg: ParcelConfig = DEFAULT_PARCEL): [number, number, number] {
  const rolledSide = Math.max(...items.map((item) => Math.min(item.widthMm, item.heightMm)));
  return [rolledSide + cfg.tubeExtraMm, cfg.tubeDiameterMm, cfg.tubeDiameterMm];
}

/** Flat pack dimensions, mm: [length, width, stack height]. */
export function flatDimensions(items: ParcelItem[], cfg: ParcelConfig = DEFAULT_PARCEL): [number, number, number] {
  const length = Math.max(...items.map((item) => Math.max(item.widthMm, item.heightMm))) + cfg.marginXYmm;
  const width = Math.max(...items.map((item) => Math.min(item.widthMm, item.heightMm))) + cfg.marginXYmm;
  const stack = Math.max(cfg.flatMinHeightMm, items.reduce((sum, item) => sum + MATERIALS[item.materialId].thicknessMm * item.quantity, 0) + cfg.paddingZmm);
  return [length, width, stack];
}

/** Two sheets of corrugated board around the largest piece, grams. */
export function flatPackagingG(items: ParcelItem[], cfg: ParcelConfig = DEFAULT_PARCEL): number {
  const long = Math.max(...items.map((item) => Math.max(item.widthMm, item.heightMm))) + 2 * cfg.cardboardMarginMm;
  const short = Math.max(...items.map((item) => Math.min(item.widthMm, item.heightMm))) + 2 * cfg.cardboardMarginMm;
  const boardM2 = 2 * (long / 1000) * (short / 1000);
  return Math.max(cfg.cardboardMinG, boardM2 * cfg.cardboardGm2 * (1 + cfg.cardboardExtra));
}

/** Cardboard tube (wall and two caps), grams; length and diameter in mm. */
export function tubePackagingG(lengthMm: number, diameterMm: number, cfg: ParcelConfig = DEFAULT_PARCEL): number {
  const d = diameterMm / 10;
  const surfaceCm2 = Math.PI * d * (lengthMm / 10) + 2 * Math.PI * (d / 2) ** 2;
  return surfaceCm2 * cfg.tubeGcm2;
}

/** Nova Poshta volumetric weight, kg. */
export function volumetricKg(lengthMm: number, widthMm: number, heightMm: number, cfg: ParcelConfig = DEFAULT_PARCEL): number {
  return ((lengthMm / 10) * (widthMm / 10) * (heightMm / 10)) / cfg.volumetricDivisor;
}

/** Does a box (any orientation) fit the parcel locker cell? */
export function fitsPostomat(dims: [number, number, number], billingKg: number, cfg: ParcelConfig = DEFAULT_PARCEL): boolean {
  const box = [...dims].sort((a, b) => b - a);
  const cell = [cfg.postomatMaxMm.length, cfg.postomatMaxMm.width, cfg.postomatMaxMm.height].sort((a, b) => b - a);
  return billingKg <= cfg.postomatMaxKg && box.every((side, i) => side <= cell[i]);
}

/**
 * One parcel for the cart. `prefer` is the customer's choice for flexible items;
 * any rigid item forces a flat pack. Returns null for an empty cart.
 */
export function parcelFor(items: ParcelItem[], prefer: PackKind = "tube", cfg: ParcelConfig = DEFAULT_PARCEL): Parcel | null {
  const list = items.filter((item) => item.quantity > 0);
  if (!list.length) return null;

  const { kind, reason } = choosePack(list, prefer, cfg);
  const raw = kind === "tube" ? tubeDimensions(list, cfg) : flatDimensions(list, cfg);
  const [lengthMm, widthMm, heightMm] = raw.map((v) => Math.ceil(v)).sort((a, b) => b - a) as [number, number, number];

  const weight = weightBreakdown(list, (kind === "tube" ? tubePackagingG(lengthMm, widthMm, cfg) : flatPackagingG(list, cfg)) / 1000);
  const volumetric = volumetricKg(lengthMm, widthMm, heightMm, cfg);
  const billingKg = Math.ceil(Math.max(weight.actualKg, volumetric) * 10) / 10;

  return {
    kind,
    lengthMm,
    widthMm,
    heightMm,
    weight,
    actualKg: weight.actualKg,
    volumetricKg: round3(volumetric),
    billingKg,
    fitsPostomat: fitsPostomat([lengthMm, widthMm, heightMm], billingKg, cfg),
    reason,
  };
}

/** "Коробка 52 × 32 × 3 см, 0,9 кг" for the cart and checkout. */
export function describeParcel(parcel: Parcel): string {
  const kg = parcel.billingKg.toLocaleString("uk-UA", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  // The carrier bills the larger of actual and volumetric weight; say which one it is (QA m12).
  const weight = parcel.volumetricKg > parcel.actualKg ? `${kg} кг обʼємної ваги` : `${kg} кг`;
  if (parcel.kind === "tube") return `Тубус ${cmText(parcel.lengthMm)} см, Ø ${cmText(parcel.widthMm)} см, ${weight}`;
  return `Коробка ${cmText(parcel.lengthMm)} × ${cmText(parcel.widthMm)} × ${cmText(parcel.heightMm)} см, ${weight}`;
}
