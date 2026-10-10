/**
 * Types of the Trafaret Line catalogue export (catalog/data/*.json) and of the
 * import bookkeeping stored in Medusa metadata.
 */

import type { RawHoleRules } from "../shared/types/hole"

export type Lang = "uk" | "ru"
export type Localized<T> = Record<Lang, T>

export interface FaqItem {
  q: string
  a: string
}

export interface CatalogCategoryText {
  name: string
  h1: string
  seo_title: string
  seo_description: string
  intro: string
  body_html: string
  faq: FaqItem[]
}

export interface CatalogCategory {
  handle: string
  path: string
  parent: string | null
  rank: number
  image: string
  product_count: number
  uk: CatalogCategoryText
  ru: CatalogCategoryText
}

export interface CatalogProductText {
  name: string
  title: string
  short: string
  description_html: string
  features: string[]
  seo_title: string
  seo_description: string
  alts: string[]
  faq: FaqItem[]
}

export interface CatalogSizeOption {
  code: string
  uk: string
  ru: string
  sheet_mm: [number, number]
  pieces: number
  detail: Localized<string>
}

export interface CatalogMaterialOption {
  code: string
  uk: string
  ru: string
}

export interface CatalogVariant {
  sku: string
  size: string
  material: string
  price_uah: number
  title: Localized<string>
}

export interface CatalogImage {
  file: string
  kind: string
  alt: Localized<string>
}

export interface CatalogProductBlocks {
  howto: string
  care: string
  delivery: string
  guarantee: string
}

export interface CatalogProduct {
  id: string
  handle: string
  path: string
  type: "ready" | "named" | "custom"
  status: "draft" | "published"
  hit: boolean
  categories: string[]
  primary_category: string
  mockup: string
  complexity: number
  min_price_uah: number
  uk: CatalogProductText
  ru: CatalogProductText
  options: { size: CatalogSizeOption[]; material: CatalogMaterialOption[] }
  variants: CatalogVariant[]
  fields: { key: string; uk: string; ru: string; def: string }[] | null
  /** Blanks with a hanging hole the buyer places and sizes (shared/types/hole.ts). */
  hole?: RawHoleRules | null
  images: CatalogImage[]
  video: string | null
  design_files: string[]
  sources: Record<string, unknown>
  blocks: CatalogProductBlocks
  faq_blocks: string[]
  related: string[]
  production: Record<string, unknown>
}

export interface SharedBlock {
  title: string
  html: string
}

export type SharedBlocks = Record<string, Localized<SharedBlock>>
export type SharedFaq = Record<string, Localized<FaqItem[]>>

/** Everything read from CATALOG_DIR/data. */
export interface CatalogData {
  catalogDir: string
  categories: CatalogCategory[]
  products: CatalogProduct[]
  sharedBlocks: SharedBlocks
  sharedFaq: SharedFaq
}

/** One uploaded catalogue file, remembered in metadata so unchanged files are not uploaded again. */
export interface UploadedFile {
  sha1: string
  url: string
}

/** metadata.catalog_files on products and categories: catalogue-relative path → uploaded file. */
export type UploadedFiles = Record<string, UploadedFile>

/**
 * create: add categories and products that do not exist yet, leave existing ones untouched.
 * update: also bring existing categories and products in line with the catalogue
 * (texts, photos, categories, options, variant prices); product status is kept.
 */
export type ImportMode = "create" | "update"

export interface ImportSettings {
  catalogDir: string
  mode: ImportMode
  salesChannelName: string
}

export interface ImportStats {
  categoriesCreated: number
  categoriesUpdated: number
  categoriesSkipped: number
  productsCreated: number
  productsUpdated: number
  productsSkipped: number
  variantsCreated: number
  variantsUpdated: number
  variantsDeleted: number
}

/** Existing Medusa product as read for the update mode. */
export interface ExistingProduct {
  id: string
  handle: string
  metadata: Record<string, unknown> | null
  options: { id: string; title: string; values: { value: string }[] }[]
  variants: { id: string; sku: string | null }[]
}

/** Existing Medusa category as read for the update mode. */
export interface ExistingCategory {
  id: string
  handle: string
  metadata: Record<string, unknown> | null
}
