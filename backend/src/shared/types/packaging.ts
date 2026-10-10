// Parcel size and weight for Nova Poshta / Ukrposhta (rules of Денис, 2026-10-08).
// Sizes in mm, weight in kg. The customer sees cm and kg only, never m².

import type { MaterialType, Shape } from "./customizer";

export type PackKind = "flat" | "tube";

/** One cart line as the packer sees it. */
export interface ParcelItem {
  materialId: MaterialType;
  shape?: Shape;
  widthMm: number;
  heightMm: number;
  quantity: number;
}

export interface ParcelConfig {
  /** Pack length and width = largest piece + this, mm (40 = 2 cm on every side). */
  marginXYmm: number;
  /** Pack height = stack of pieces + this, mm (10). */
  paddingZmm: number;
  /** Tube diameter, mm (100). */
  tubeDiameterMm: number;
  /** Tube length added to the rolled side, mm (20). */
  tubeExtraMm: number;
  /** Sheets up to this thickness (PET) can be rolled, mm (0.8). */
  flexibleMaxMm: number;
  /** Flat pack: two sheets of 3-layer corrugated board, g/m² (450). */
  cardboardGm2: number;
  /** Board added on every side of the largest piece, mm (20). */
  cardboardMarginMm: number;
  /** Folds and tape on top of the board weight, share (0.1). */
  cardboardExtra: number;
  /** Lightest flat pack, g (30). */
  cardboardMinG: number;
  /** Lowest flat pack height, mm (20). */
  flatMinHeightMm: number;
  /** Cardboard tube wall with caps, g per cm² of surface (0.07). */
  tubeGcm2: number;
  /** Nova Poshta volumetric divisor, cm³ per kg (4000). */
  volumetricDivisor: number;
  /** Nova Poshta parcel locker cell limits, mm and kg. */
  postomatMaxMm: { length: number; width: number; height: number };
  postomatMaxKg: number;
}

/** Weight of one cart line. */
export interface WeightLine {
  materialId: MaterialType;
  quantity: number;
  /** Real material area of one piece, m² (circle and oval are not the bounding box). */
  pieceAreaM2: number;
  pieceWeightG: number;
  totalWeightG: number;
}

export interface WeightBreakdown {
  lines: WeightLine[];
  materialKg: number;
  tareKg: number;
  actualKg: number;
}

export interface Parcel {
  kind: PackKind;
  /** Box or tube, mm, longest side first. */
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  weight: WeightBreakdown;
  actualKg: number;
  volumetricKg: number;
  /** What the carrier bills: max(actual, volumetric), rounded up to 0.1 kg. */
  billingKg: number;
  /** Fits a Nova Poshta parcel locker. */
  fitsPostomat: boolean;
  /** Why the flat pack was chosen although the customer asked for a tube. */
  reason: "customer_choice" | "rigid_material" | "all_flexible";
}
