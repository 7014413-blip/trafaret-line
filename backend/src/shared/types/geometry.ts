// Geometry types shared by the stencil cutter (bridges), the letter welder (toppers,
// acrylic words) and the free canvas. All coordinates are millimetres, y grows down
// (SVG and Fabric.js convention).

export type Vec2 = readonly [x: number, y: number];

/** Closed polygon, last point is NOT repeated. */
export type Polygon = ReadonlyArray<Vec2>;

export interface BBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** «Перемички: тонкі / звичайні / міцні» in the stencil constructor. */
export type BridgeStrength = "thin" | "normal" | "strong";

/** All constructor numbers (lib/geometry/config.ts; ТЗ prompt-konstruktory table 2). */
export interface ConstructorConfig {
  curveToleranceMm: number;
  bridgeWidthRatio: number;
  bridgeWidthMinMm: number;
  bridgeWidthMaxMm: number;
  bridgeStrength: Record<BridgeStrength, number>;
  islandOneBridgeMaxHeightMm: number;
  islandLongPerimeterMm: number;
  bridgesPerIslandMax: number;
  jointThicknessFactor: number;
  /** Bridges may move within this middle share of the island width. */
  bridgeZoneShare: number;
  bridgeLongWarnMm: number;
  minSlotMm: number;
  weldOverlapRatio: number;
  weldOverlapMinMm: number;
  weldOverlapMaxOfNarrow: number;
  weldPunctOverlapMax: number;
  /** A letter is checked against this many previous letters of the word. */
  weldLookback: number;
  /** Letters stop moving when they would cover more than this share of the narrower one. */
  weldMergeAreaShare: number;
  dotConnectorMaxOfDot: number;
  connectorWidthRatio: number;
  connectorWidthMinMm: number;
  baseBarHeightRatio: number;
  outlineOffsetMm: number;
  stickWidthMm: number;
  stickLengthMm: number;
  /** Toppers up to this width get one skewer, wider ones two. */
  stickSingleMaxWidthMm: number;
  sheetMarginMm: number;
  sheetMaxMm: { width: number; height: number };
}

/** Laser production limits (admin setting, defaults in lib/geometry/laser-config.ts). */
export interface LaserConfig {
  /** Narrowest bridge that survives washing and bending, mm. */
  minBridgeMm: number;
  /** Widest automatic bridge, mm (bridges grow with letter height up to this value). */
  maxBridgeMm: number;
  /** Bridge width as a share of the cap height (0.05 = 5 %). */
  bridgeShareOfCap: number;
  /** A bridge longer than this is weak: the customer gets a warning, mm. */
  maxBridgeLengthMm: number;
  /** Narrowest strip of material between two cuts, mm. */
  minPartMm: number;
  /** Narrowest cut slot that paint still passes through, mm. */
  minSlotMm: number;
  /** An island taller than this gets a second bridge, mm. */
  secondBridgeFromMm: number;
  /** One extra bridge for every this many mm of island perimeter. */
  bridgePerPerimeterMm: number;
  /** Upper limit of bridges per island. */
  maxBridgesPerIsland: number;
  /** How far a bridge goes into the material on both ends, mm. */
  bridgeOverlapMm: number;
  /** Step for sampling an island outline when looking for the thinnest stroke, mm. */
  sampleStepMm: number;
  /** Clipper works in integers: coordinates are multiplied by this factor. */
  clipperScale: number;
  /** Thin zones smaller than this area are ignored (noise of curve flattening), mm². */
  minReportAreaMm2: number;
}

/** A piece of material inside a cut (the counter of О, А, Р…) that would fall out without bridges. */
export interface IslandInfo {
  id: number;
  outline: Polygon;
  areaMm2: number;
  bbox: BBox;
  bridgeCount: number;
  /** True when bridges connect the island (directly or through other islands) to the sheet. */
  connected: boolean;
}

export type BridgeTarget = "sheet" | "island";

export interface BridgePlacement {
  islandId: number;
  /** Point on the island outline. */
  from: Vec2;
  /** Nearest point on the opposite edge of the stroke. */
  to: Vec2;
  widthMm: number;
  /** Length across the stroke (= stroke width at this point), mm. */
  lengthMm: number;
  target: BridgeTarget;
  /** Island id on the other side when target = "island". */
  targetIslandId?: number;
  /** Rectangle removed from the cut, 4 points. */
  quad: Polygon;
}

export type ThinZoneKind = "material" | "slot";

export interface ThinZone {
  kind: ThinZoneKind;
  at: Vec2;
  areaMm2: number;
}

/** Result of turning raw contours into a cut file with bridges. */
export interface StencilCutResult {
  /** Final cut regions after bridges, outer contours counter-clockwise, holes clockwise. */
  cutPaths: Polygon[];
  islands: IslandInfo[];
  bridges: BridgePlacement[];
  thinZones: ThinZone[];
  /** Total laser path of the cut regions (sheet outline not included), mm. */
  cutLengthMm: number;
  /** Area that paint goes through, mm². */
  openAreaMm2: number;
  bbox: BBox;
}

export interface StencilCutOptions {
  /** Bridge width, mm (see bridgeWidthFor in lib/geometry/laser-config.ts). */
  bridgeWidthMm: number;
  /** Font or file already has bridges: islands are reported but no bridges are added. */
  skipBridges?: boolean;
  /** Stencil outline for the thin-material check; without it the check uses the bounding box + 15 mm. */
  sheet?: Polygon;
  config?: LaserConfig;
}

/** Options of the welded mode: letters become one piece of material (toppers, acrylic words). */
export interface WeldOptions {
  /** How much neighbouring letters overlap, as a share of the cap height. */
  overlapShare: number;
  /** Width of the connector that joins loose parts (dots of і, ї, й; separate letters), mm. */
  connectorMm: number;
  baseline: {
    enabled: boolean;
    /** Bar height below the letters, mm. */
    heightMm: number;
    /** How far the bar goes up into the letters, mm. */
    overlapMm: number;
    /** Extra length on both sides of the line, mm. */
    extendMm: number;
  };
  outline: {
    enabled: boolean;
    /** Offset of the outline around the welded word, mm. */
    offsetMm: number;
  };
  skewers: {
    count: 0 | 1 | 2;
    widthMm: number;
    lengthMm: number;
    /** Pointed end for cakes. */
    pointed: boolean;
  };
}

/** Glyph outline placed in the layout, used by the welder to move letters together. */
export interface PlacedGlyph {
  char: string;
  line: number;
  /** y of the text baseline of this line, mm. */
  baselineY: number;
  contours: Polygon[];
}

export type TextAlign = "left" | "center" | "right";

export interface WeldResult {
  /** Outline of the material piece(s): outer contours CCW, holes CW. */
  shapes: Polygon[];
  /** Number of separate pieces after welding (1 = everything is joined). */
  pieces: number;
  bbox: BBox;
  areaMm2: number;
  cutLengthMm: number;
}
