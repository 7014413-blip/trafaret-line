// Hanging hole that the buyer chooses on a blank (mirror acrylic circles with a hole, Денис
// 2026-10-10): where the hole sits and how wide it is. The price does not depend on the hole.
// web/types/hole.ts and backend/src/shared/types/hole.ts are the same file; the checkout re-checks the choice.

/** Where the hole sits on the piece. */
export type HolePosition = "top" | "bottom" | "left" | "right" | "center";

/** Limits of the hole choice for one product (product metadata `hole`). */
export interface HoleRules {
  /** Positions the buyer may pick, in the order they are shown. */
  positions: HolePosition[];
  /** Position picked when the page opens. */
  defaultPosition: HolePosition;
  /** Smallest hole diameter, mm. */
  minMm: number;
  /** Largest hole diameter, mm (the piece itself may allow less). */
  maxMm: number;
  /** Largest hole diameter as a share of the piece diameter (0.4 = 40 %). */
  maxShare: number;
  /** Narrowest acrylic left between the hole and the outer edge, mm. */
  edgeMm: number;
}

/** Hole rules as they are stored in the product metadata (catalog export, snake_case). */
export interface RawHoleRules {
  positions?: string[] | null;
  default_position?: string | null;
  min_mm?: number | null;
  max_mm?: number | null;
  max_share?: number | null;
  edge_mm?: number | null;
}

/** What the buyer typed or picked; the diameter is kept as typed until it is checked. */
export interface HoleInput {
  position: HolePosition;
  diameterMm: string;
}

/** A checked hole, ready for production: all sizes in mm from the centre of the piece. */
export interface HoleSpec {
  position: HolePosition;
  diameterMm: number;
  /** Piece diameter the hole was checked against. */
  pieceMm: number;
  /** Acrylic left between the hole and the nearest outer edge. */
  edgeMm: number;
  /** Hole centre, mm from the centre of the piece; x to the right, y down. */
  centreMm: [number, number];
}

export type HoleError = "diameter_not_number" | "diameter_too_small" | "diameter_too_large" | "position_not_allowed";

export interface HoleCheck {
  /** The checked hole; null while the input has an error. */
  spec: HoleSpec | null;
  error: HoleError | null;
  /** Largest diameter allowed on this piece, mm. */
  maxMm: number;
}
