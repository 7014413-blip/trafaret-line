// Catalogue as the storefront shows it, read from Medusa (Store API). The raw shapes are
// what /store/product-categories and /store/products return with our metadata
// (backend/src/scripts/import-catalog.ts); the normalised shapes are what pages use.

import type { MonogramProductConfig } from "./monogram";

export interface FaqEntry {
  q: string;
  a: string;
}

export interface SeoText {
  title: string;
  description: string;
  h1?: string;
}

/* ------------------------------------------------------------------ */
/* Raw Medusa Store API                                                */
/* ------------------------------------------------------------------ */

export interface RawCategory {
  id: string;
  name: string;
  handle: string;
  description?: string | null;
  rank?: number | null;
  parent_category_id?: string | null;
  parent_category?: { id: string; handle: string; name: string } | null;
  category_children?: RawCategory[];
  metadata?: {
    path?: string;
    image?: string;
    seo?: { uk?: SeoText; ru?: SeoText };
    content?: { uk?: { intro?: string; body_html?: string; faq?: FaqEntry[] } };
  } | null;
}

export interface RawPrice {
  calculated_amount?: number | null;
  original_amount?: number | null;
  currency_code?: string;
}

export interface RawVariant {
  id: string;
  title: string;
  sku?: string | null;
  calculated_price?: RawPrice | null;
  options?: { value: string; option?: { title: string } | null; option_id?: string }[];
  metadata?: { size_code?: string; material_code?: string; sheet_mm?: [number, number]; pieces?: number } | null;
}

export interface RawProduct {
  id: string;
  title: string;
  subtitle?: string | null;
  handle: string;
  description?: string | null;
  thumbnail?: string | null;
  images?: { id: string; url: string }[];
  categories?: { id: string; handle: string; name: string }[];
  options?: { id: string; title: string; values?: { value: string }[] }[];
  variants?: RawVariant[];
  metadata?: {
    catalog_type?: "ready" | "named" | "custom";
    hit?: boolean;
    min_price_uah?: number;
    primary_category?: string;
    image_alts?: { url: string; kind: string; uk: string; ru: string }[];
    features?: { uk?: string[] };
    faq?: { uk?: FaqEntry[] };
    seo?: { uk?: SeoText };
    size_details?: Record<string, { uk: string; ru: string }>;
    blocks?: { uk?: Record<string, { title: string; html: string }> };
    related_handles?: string[];
    fields?: { key: string; uk: string; ru: string; def: string }[] | null;
    /** Set in «Простий кабінет»; missing means in stock. */
    availability?: ProductAvailability;
    /** Wedding monogram products: designs with a live preview (types/monogram.ts). */
    monogram?: MonogramProductConfig | null;
  } | null;
}

/** Availability set by the owner in the admin cabinet. */
export type ProductAvailability = "in_stock" | "on_order" | "out_of_stock";

/* ------------------------------------------------------------------ */
/* Normalised                                                          */
/* ------------------------------------------------------------------ */

export interface CatalogCategory {
  id: string;
  handle: string;
  name: string;
  /** "/food/" or "/food/tort/" */
  path: string;
  parentHandle: string | null;
  rank: number;
  image: string | null;
  seo: SeoText;
  intro: string;
  bodyHtml: string;
  faq: FaqEntry[];
  children: CatalogCategory[];
}

export interface CatalogImage {
  url: string;
  alt: string;
  kind: string;
}

export interface CatalogVariant {
  id: string;
  sku: string | null;
  title: string;
  sizeLabel: string;
  materialLabel: string;
  sizeCode: string | null;
  materialCode: string | null;
  sheetMm: [number, number] | null;
  /** Price of one piece, UAH. */
  price: number;
}

export interface CatalogProductCard {
  id: string;
  handle: string;
  title: string;
  subtitle: string;
  images: CatalogImage[];
  minPrice: number;
  sizeCount: number;
  hit: boolean;
  kind: "ready" | "named" | "custom";
  categoryHandles: string[];
  materialLabels: string[];
}

/**
 * Smallest card for category grids and search (QA 2026-10-10, M10): everything the grid and
 * its filters need, nothing else, so a section with hundreds of products stays light.
 */
export interface CatalogCardLite {
  handle: string;
  title: string;
  /** First photo; its alt is empty when it only repeats the title. */
  image: { url: string; alt: string } | null;
  minPrice: number;
  sizeCount: number;
  hit: boolean;
  kind: CatalogProductCard["kind"];
  materialLabels: string[];
}

/** Category as a link in menus and rails: no texts, SEO or FAQ (home page weight, QA M10). */
export interface CategoryLink {
  handle: string;
  name: string;
  path: string;
  children: { handle: string; name: string; path: string }[];
}

export interface CatalogProduct extends CatalogProductCard {
  descriptionHtml: string;
  features: string[];
  faq: FaqEntry[];
  seo: SeoText;
  sizes: { label: string; detail: string }[];
  materials: string[];
  variants: CatalogVariant[];
  blocks: { slot: string; title: string; html: string }[];
  relatedHandles: string[];
  /** Fields the customer fills in for named products (word, date …). */
  fields: { key: string; label: string; placeholder: string }[];
  availability: ProductAvailability;
  /** Designs of a wedding monogram product; null for every other product. */
  monogram: MonogramProductConfig | null;
}
