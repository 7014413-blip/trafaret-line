// Strict types for the stencil constructor, catalogue and cart.
// Based on Денис's draft (2026-10-08), extended for the real material list.
// Units: sizes in millimetres, money in whole UAH. Runtime source of truth:
// Medusa (materials, prices) and Payload (fonts, mockups, theme).

/* ------------------------------------------------------------------ */
/* Modes                                                               */
/* ------------------------------------------------------------------ */

/** Who is buying (Денис's draft). B2B adds invoice (ФОП/ТОВ), mm spec sheets, dark theme. */
export type UserRoleMode = "b2c_artisan" | "b2b_industrial";

/** Visual theme of a catalogue section (data-role on <main>). Not the same as the buyer:
 *  a confectionery chain is b2b_industrial buyer inside the "sweet" section. */
export type SectionTheme = "sweet" | "interior" | "industrial";

export type Locale = "uk" | "ru" | "en";
export type LocalizedText = Record<Locale, string>;

/** Product type from ТЗ §3.2. */
export type ProductKind = "ready" | "named" | "blank";
export type DesignSource = "text" | "upload";
export type SurfaceKind = "cake" | "coffee" | "wall" | "plaster" | "wood" | "metal" | "concrete";

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

export type MaterialType =
  // stencils
  | "pet_thin"             // PET 0,5 мм
  | "pet_thick"            // thicker PET, thickness and price to confirm
  | "polystyrene"          // полістирол 1 мм, білий / чорний
  | "acrylic"              // акрил 3 мм для трафаретів
  | "magnetic"
  | "plywood"
  | "stainless_steel"
  // blanks (заготовки)
  | "acrylic_1_5" | "acrylic_3" | "acrylic_6" | "acrylic_8"
  | "acrylic_color"        // кольоровий акрил
  | "acrylic_mirror_2" | "acrylic_mirror_3"
  | "polystyrene_mirror_1"
  | "pet_food_board";      // PET 0,5 мм, підкладки під торти

export type MaterialUse = "stencil" | "blank";
export type Finish = "clear" | "matte" | "gloss" | "mirror";

export interface MaterialColour {
  id: string;              // "clear" | "white" | "black" | "gold" | "silver" | RAL…
  name: LocalizedText;
  hex: string;
}

export interface MaterialOption {
  id: MaterialType;
  use: MaterialUse;
  name: LocalizedText;
  thicknessMm: number;
  densityGcm3: number;
  /** UAH per m² of sheet. null = not priced yet ("ціна за запитом"). */
  baseSquareMeterPrice: number | null;
  /** Minimum price per stencil; blanks use the order minimum from PricingConfig. */
  minPrice: number;
  /** Owner's cost of sheet incl. waste, UAH/m². Admin only, never sent to the browser. null = unknown. */
  costPerM2: number | null;
  /**
   * Food-contact claim. Stays false until the supplier's documents are on file:
   * the site must not say "харчовий"/"food-safe" without them (ТЗ).
   */
  foodSafe: boolean;
  magnetic: boolean;
  finish: Finish;
  colours: MaterialColour[];
  /** Largest piece the laser cuts in one go; bigger stencils are split (composite). */
  maxDimensionsMm: { width: number; height: number };
  /** Smallest cap height that cuts cleanly, mm. */
  minLetterMm: number;
  look: { face: string; edge: string; opacity: number; gloss: number };
  note: LocalizedText;
  available: boolean;
}

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */

export type Shape = "rect" | "square" | "circle" | "oval" | "heart" | "custom";

export interface SheetSize {
  shape: Shape;
  widthMm: number;
  heightMm: number; // circle: diameter, same as width
}

export interface Contour {
  points: ReadonlyArray<readonly [x: number, y: number]>; // flattened, mm
  closed: boolean;
  isHole?: boolean; // inner loop of О, А, Р… that needs a bridge
}

export interface Bridge {
  contourIndex: number;
  at: readonly [x: number, y: number];
  widthMm: number;
}

export interface VectorDesign {
  source: DesignSource;
  upload?: { fileName: string; format: "svg" | "dxf"; storageKey: string };
  contours: Contour[];
  bridges: Bridge[];
  stencilFont?: boolean; // font already has bridges
  bboxMm: { w: number; h: number };
}

/** Денис's draft, plus pieces and thin-part count. */
export interface StencilVectorMetrics {
  widthMm: number;
  heightMm: number;
  pathLengthMeters: number;     // laser cut length incl. sheet outline
  areaSquareMeters: number;     // billing area (bounding rectangle)
  bridgeCount: number;
  isClosedLoopValid: boolean;   // all contours closed
  pieces: number;               // > 1 when larger than maxDimensionsMm
}

export type CheckLevel = "error" | "warning";
export interface DesignCheck {
  code: "empty" | "glyph_missing" | "letter_too_small" | "thin_part" | "sheet_too_big" | "open_contour";
  level: CheckLevel;
  message: LocalizedText;
  at?: readonly [x: number, y: number];
}

/* ------------------------------------------------------------------ */
/* Constructor state                                                   */
/* ------------------------------------------------------------------ */

/** ТЗ §3.2: manual cutting complexity factor per product. */
export type ComplexityFactor = 1 | 1.2 | 1.5;

/**
 * Денис's draft with two changes: the material is stored by id (the state goes into
 * the URL and the cart, and prices must come from the server, not from the client),
 * and calculatedPriceUah is display-only: the server recomputes it before the order.
 */
export interface CustomizerState {
  roleMode: UserRoleMode;
  section: SectionTheme;
  source: DesignSource;
  text: string;
  fontFamily: string;
  materialId: MaterialType;
  colourId?: string;
  shape: Shape;
  widthMm: number;
  heightMm: number;
  marginMm: number;          // default 15
  quantity: number;
  surface: SurfaceKind;
  complexity: ComplexityFactor;
  design: VectorDesign;
  metrics: StencilVectorMetrics;
  calculatedPriceUah: number;
}

/* ------------------------------------------------------------------ */
/* Pricing                                                             */
/* ------------------------------------------------------------------ */

/** Wholesale programme (Денис 2026-10-08): registered wholesalers, special price for monthly turnover. */
export interface WholesaleProgram {
  enabled: boolean;
  discount: number;               // 0.2 = −20 %, admin setting
  monthlyThresholdUah: number;    // 10 000 UAH paid per calendar month, admin setting
  /** Months a newly approved wholesaler gets the price before turnover is checked. */
  graceMonths: number;            // default 1 [proposal]
  /** A single order at or above the threshold gets the price immediately. */
  singleOrderQualifies: boolean;  // default true [proposal]
}

export type WholesaleStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

/** Buyer context for pricing; built on the server from the Medusa customer, never trusted from the client. */
export interface BuyerContext {
  wholesaleStatus: WholesaleStatus;
  approvedAt?: string;                 // ISO date
  previousMonthPaidUah: number;        // paid orders, previous calendar month (Kyiv time)
  currentOrderUah?: number;            // cart total before discounts
  /** Retail loyalty level already resolved on the server from lifetime paid orders. */
  loyaltyDiscount?: number;
  /** First paid order of a customer who subscribed (email / Viber). */
  firstOrder?: boolean;
  /** Validated promo code. */
  promo?: { code: string; discount: number; label?: string };
}

export interface PriceTier { minQty: number; discount: number } // 0.1 = −10 %

export interface PricingConfig {
  roundStencilTo: number;
  roundBlankTo: number;
  blankOrderMin: number;
  blankTiers: PriceTier[];
  stencilTiers: PriceTier[];        // admin setting; default 10+ −5 %, 50+ −10 %, 100+ −15 %
  /** Hard cap for any wholesale discount (Денис: max 15 %). Admin cannot save more. */
  maxWholesaleDiscount: number;
  /** Registered-wholesaler level; does not stack with the quantity scale, the larger wins. */
  wholesaleProgram: WholesaleProgram;
  /** Retail loyalty by lifetime paid orders, e.g. 3 000 ₴ → 3 %. */
  loyaltyTiers: { minLifetimeUah: number; discount: number }[];
  firstOrderDiscount: number;
  /** No single discount above this, except the wholesale programme (approved 20 %). */
  maxRetailDiscount: number;
  /** Price after discount never below cost × (1 + minMarkup) when costPerM2 is known. */
  minMarkup: number;
  largeAreaTiers: { minM2: number; discount: number }[];
  machineSheetMm: { width: number; height: number };
  compositeSurcharge: number;
  minBridgeMm: number;
  minPartMm: number;
}

export interface PriceBreakdown {
  areaM2: number;
  unitPrice: number;
  quantity: number;
  discounts: { label: string; percent: number }[];
  total: number;
  composite: boolean;
  pieces: number;
  priceOnRequest: boolean;
}

/* ------------------------------------------------------------------ */
/* Catalogue and cart                                                  */
/* ------------------------------------------------------------------ */

export interface ProductHit {
  id: string;
  handle: string;
  title: string;
  sku: string;
  standards?: string[];
  section: SectionTheme;
  categoryTitle: string;
  priceFrom: number;
  thumbnail: string;
}

export interface CartLine {
  id: string;
  title: string;
  materialId: MaterialType;
  colourId?: string;
  widthCm: number;
  heightCm: number;
  quantity: number;
  unitPrice: number;
  vectorSvg?: string;
  thumbnail?: string;
  section: SectionTheme;
  cutLengthMeters?: number;
}

export interface Upsell {
  id: string;
  title: string;
  reason: string;
  price: number;
  thumbnail?: string;
}
