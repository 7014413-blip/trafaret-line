// Shared shapes of the plaque constructors (lib/plaques): text lines fitted into a zone.

/** Measures of one text line in layout units (lib/text/text-layout.ts, font size 100). */
export interface PlaqueLineMeasure {
  widthUnits: number;
  heightUnits: number;
  capUnits: number;
  /** Distance from the top of the text box to the baseline. */
  baselineUnits: number;
}

/** One text line the customer types: its own font and relative letter size. */
export interface PlaqueTextLine {
  text: string;
  fontId: string;
  /** Relative letter size: 0.6 … 1.6 (1 = normal). */
  size: number;
}

export interface PlaqueZone { left: number; right: number; top: number; bottom: number }

export interface PlaqueLineInput {
  index: number;
  /** Relative letter size, 0.6 … 1.6. */
  size: number;
  measure: PlaqueLineMeasure;
  /** Extra width the line reserves, per cap height (a direction arrow and its gap). */
  extraWidthPerCap?: number;
  /** Lowest row height, per cap height. */
  minRowPerCap?: number;
}

/** Where one fitted line sits, mm, origin of the zone's coordinates. */
export interface PlaqueLineSlot {
  index: number;
  capMm: number;
  /** Layout units → mm. */
  scale: number;
  rowTop: number;
  rowHeight: number;
  /** Left edge and width of the line with its extra width, centred in the zone. */
  groupLeft: number;
  groupWidth: number;
}
