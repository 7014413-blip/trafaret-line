// «Простий кабінет»: a Prom.ua-like product editor inside the Medusa admin (Денис 10.10).
// Shapes of the admin API (src/api/admin/tl-products) shared with the admin pages
// (src/admin/routes/prostyi-kabinet). Money in whole UAH.

export type ProductAvailability = "in_stock" | "on_order" | "out_of_stock"
export type KabinetStatus = "published" | "draft"

export interface KabinetCategory {
  id: string
  name: string
  /** "Стіни › Мандали" for subcategories. */
  label: string
}

export interface KabinetListItem {
  id: string
  title: string
  handle: string
  thumbnail: string | null
  status: KabinetStatus
  minPrice: number | null
  categories: string[]
  variantCount: number
  hit: boolean
  /** «Новинка» badge on the catalogue card. */
  isNew: boolean
  availability: ProductAvailability
  updatedAt: string
}

export interface KabinetListQuery {
  q?: string
  categoryId?: string
  status?: KabinetStatus
  offset?: number
  limit?: number
}

export interface KabinetListResponse {
  items: KabinetListItem[]
  count: number
  offset: number
  limit: number
  categories: KabinetCategory[]
}

export interface KabinetImage {
  url: string
  /** Alt text in Ukrainian (what a screen reader says). */
  alt: string
}

/** One price cell of the size × material table; variantId null for a new combination. */
export interface KabinetPriceCell {
  variantId: string | null
  size: string
  material: string
  price: number
}

export interface KabinetSeo {
  title: string
  description: string
}

export interface KabinetFaq {
  q: string
  a: string
}

export interface KabinetProduct {
  id: string
  title: string
  handle: string
  subtitle: string
  descriptionHtml: string
  status: KabinetStatus
  availability: ProductAvailability
  hit: boolean
  /** «Новинка» badge on the catalogue card. */
  isNew: boolean
  categoryIds: string[]
  images: KabinetImage[]
  sizes: string[]
  materials: string[]
  prices: KabinetPriceCell[]
  features: string[]
  faq: KabinetFaq[]
  seo: KabinetSeo
  storefrontUrl: string
}

/** Body of POST /admin/tl-products (new) and POST /admin/tl-products/:id (save). */
export interface KabinetProductInput {
  title: string
  handle?: string
  subtitle: string
  descriptionHtml: string
  status: KabinetStatus
  availability: ProductAvailability
  hit: boolean
  /** «Новинка» badge on the catalogue card. */
  isNew: boolean
  categoryIds: string[]
  images: KabinetImage[]
  sizes: string[]
  materials: string[]
  prices: KabinetPriceCell[]
  features: string[]
  faq: KabinetFaq[]
  seo: KabinetSeo
}

export interface KabinetSaveResponse {
  product: KabinetProduct
}

/** One problem found in an uploaded table; `row` is the line number Excel shows (header = 1). */
export interface KabinetImportIssue {
  row: number
  message: string
}

/** Result of POST /admin/tl-products/import; with dryRun nothing is saved. */
export interface KabinetImportReport {
  dryRun: boolean
  rows: number
  productsUpdated: number
  productsCreated: number
  pricesChanged: number
  variantsAdded: number
  variantsRemoved: number
  issues: KabinetImportIssue[]
  /** First changes in words, for the preview before applying. */
  preview: string[]
}

export interface KabinetImportRequest {
  csv: string
  dryRun: boolean
}

export interface KabinetError {
  message: string
  field?: string
}
