// Draft of a constructor kept in the page address (?draft=…), so a link opens the same layout
// on another device (plan step 8.5). Only what the customer chose goes in: the shop rebuilds
// everything else. Files (a sign logo) and the customer's own fonts stay on their device.

import type { MaterialType } from "./customizer";
import type { BridgeStrength, TextAlign } from "./geometry";
import type { SignShape } from "./signage";
import type { BusinessSignLine } from "./business-sign";

/** «Свій напис» (/konstruktor). */
export interface KonstruktorDraft {
  mode: "stencil" | "weld";
  text: string;
  fontId: string;
  widthMm: number;
  marginMm: number;
  shape: "rect" | "square";
  materialId: MaterialType;
  bridgeStrength: BridgeStrength;
  align: TextAlign;
  upper: boolean;
  /** A font per line; "" = the main font. Empty when every line uses the main font. */
  lineFontIds: string[];
  byLetter: boolean;
  letterMm: number;
  weld: {
    widthMm: number;
    materialId: MaterialType;
    colourId: string;
    overlapShare: number;
    baseline: boolean;
    outline: boolean;
    skewers: 0 | 1 | 2;
    skewerLengthMm: number;
  };
}

/** «3D акрилова бізнес-вивіска» (/vyvisky) without the logo file. */
export interface BusinessSignDraft {
  shape: SignShape;
  widthMm: number;
  heightMm: number;
  direction: -1 | 1;
  baseMaterialId: string;
  baseThicknessMm: number;
  lines: BusinessSignLine[];
  arc: { top: string; bottom: string; fontId: string; materialId: string } | null;
  frameMaterialId: string | null;
  holes: 0 | 2 | 4;
  selfAdhesive: boolean;
  positioningStencil: boolean;
  logoDevelopment: boolean;
  logoBrief: string;
  quantity: number;
}
