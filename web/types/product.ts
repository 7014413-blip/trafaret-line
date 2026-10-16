// Products and materials in one place. Catalogue shapes live in catalog.ts and the material
// card in customizer.ts; this file adds the shape of data/knowledge_base/materials.json
// (rates and physics of every sheet) and re-exports the rest, so product code can import
// everything it needs from "@/types/product".

import type { AcrylicWeightConfig, MaterialType, MaterialUse } from "./customizer";

export type {
  CatalogCardLite, CatalogCategory, CatalogImage, CatalogProduct, CatalogProductCard, CatalogVariant, CategoryLink, ProductAvailability,
  RawCategory, RawPrice, RawProduct, RawVariant,
} from "./catalog";
export type {
  AcrylicWeightConfig, Finish, MaterialColour, MaterialOption, MaterialType, MaterialUse, ProductKind, Shape, SheetSize,
} from "./customizer";

/** Numbers of one material as data/knowledge_base/materials.json keeps them. */
export interface MaterialFacts {
  use: MaterialUse;
  thicknessMm: number;
  densityGcm3: number;
  /** UAH per m² of sheet; null = price on request. */
  retailPerM2: number | null;
  /** Rate for approved wholesalers, UAH per m²; null = the retail rate. */
  wholesalePerM2: number | null;
  /** Minimum price of one stencil, UAH (0 for blanks: they use the order minimum). */
  minPrice: number;
  /** Owner's cost incl. waste, UAH per m²; null = unknown. */
  costPerM2: number | null;
  available: boolean;
}

/** data/knowledge_base/materials.json */
export interface MaterialsKnowledge {
  about: string;
  updated: string;
  sources: Record<string, string>;
  currency: "UAH";
  /** Laser bed, mm; bigger pieces are cut from several sheets. */
  machineSheetMm: { width: number; height: number };
  acrylicWeight: AcrylicWeightConfig;
  materials: Record<MaterialType, MaterialFacts>;
}
