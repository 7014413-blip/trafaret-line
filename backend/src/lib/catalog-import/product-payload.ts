import type { CatalogData, CatalogProduct, CatalogVariant, UploadedFiles } from "../../types/catalog"
import { resolveBlocks, resolveFaq } from "./catalog-data"
import { FileUploader } from "./file-uploader"

export const SIZE_OPTION = "Розмір"
export const MATERIAL_OPTION = "Матеріал"
export const CURRENCY = "uah"

/** Uploaded media of one product plus the bookkeeping map stored in metadata.catalog_files. */
export interface ProductMedia {
  images: { url: string; kind: string; uk: string; ru: string }[]
  videoUrl: string | null
  designUrls: string[]
  files: UploadedFiles
}

/** Uploads photos, video (optional) and cut files; unchanged files are reused from `known`. */
export async function uploadProductMedia(product: CatalogProduct, uploader: FileUploader, known: UploadedFiles): Promise<ProductMedia> {
  const files: UploadedFiles = {}
  const images: ProductMedia["images"] = []
  for (const image of product.images) {
    const uploaded = await uploader.upload(image.file, known)
    files[image.file] = uploaded
    images.push({ url: uploaded.url, kind: image.kind, uk: image.alt.uk, ru: image.alt.ru })
  }
  const video = await uploader.uploadOptional(product.video, known)
  if (video) {
    files[video.path] = video.file
  }
  const designUrls: string[] = []
  for (const file of product.design_files) {
    const uploaded = await uploader.upload(file, known)
    files[file] = uploaded
    designUrls.push(uploaded.url)
  }
  if (!images.length) {
    throw new Error(`Product ${product.handle} has no images`)
  }
  return { images, videoUrl: video?.file.url ?? null, designUrls, files }
}

/** Maps catalogue category handles to Medusa ids. */
export function categoryIdsOf(product: CatalogProduct, categoryId: Map<string, string>): string[] {
  return product.categories.map((handle) => {
    const id = categoryId.get(handle)
    if (!id) {
      throw new Error(`Category ${handle} missing for product ${product.handle}`)
    }
    return id
  })
}

/** Option values in catalogue order, keyed by option title. */
export function optionValues(product: CatalogProduct): Record<string, string[]> {
  return {
    [SIZE_OPTION]: product.options.size.map((s) => s.uk),
    [MATERIAL_OPTION]: product.options.material.map((m) => m.uk),
  }
}

/** Variant fields shared by create and update. */
export function variantData(product: CatalogProduct, variant: CatalogVariant) {
  const size = product.options.size.find((s) => s.code === variant.size)
  const material = product.options.material.find((m) => m.code === variant.material)
  if (!size || !material) {
    throw new Error(`Variant ${variant.sku} refers to an unknown size or material`)
  }
  return {
    title: variant.title.uk,
    sku: variant.sku,
    manage_inventory: false,
    allow_backorder: true,
    options: { [SIZE_OPTION]: size.uk, [MATERIAL_OPTION]: material.uk },
    prices: [{ amount: variant.price_uah, currency_code: CURRENCY }],
    metadata: { size_code: size.code, material_code: material.code, sheet_mm: size.sheet_mm, pieces: size.pieces, title_ru: variant.title.ru },
  }
}

/** Product-level fields shared by create and update (no status, options or variants). */
export function productData(product: CatalogProduct, media: ProductMedia, categoryIds: string[], catalog: CatalogData) {
  return {
    title: product.uk.title,
    subtitle: product.uk.short,
    handle: product.handle,
    description: product.uk.description_html,
    thumbnail: media.images[0].url,
    images: media.images.map((i) => ({ url: i.url })),
    category_ids: categoryIds,
    metadata: {
      catalog_type: product.type,
      path: product.path,
      hit: product.hit,
      mockup: product.mockup,
      complexity: product.complexity,
      min_price_uah: product.min_price_uah,
      primary_category: product.primary_category,
      video: media.videoUrl,
      design_files: media.designUrls,
      image_alts: media.images.map((i) => ({ url: i.url, kind: i.kind, uk: i.uk, ru: i.ru })),
      fields: product.fields,
      hole: product.hole ?? null,
      monogram: product.monogram ?? null,
      constructor_path: product.constructor_path ?? null,
      features: { uk: product.uk.features, ru: product.ru.features },
      faq: resolveFaq(product, catalog.sharedFaq),
      related_handles: product.related,
      seo: {
        uk: { title: product.uk.seo_title, description: product.uk.seo_description },
        ru: { title: product.ru.seo_title, description: product.ru.seo_description },
      },
      size_details: Object.fromEntries(product.options.size.map((s) => [s.uk, s.detail])),
      i18n: {
        ru: {
          title: product.ru.title,
          subtitle: product.ru.short,
          description: product.ru.description_html,
          options: {
            [SIZE_OPTION]: Object.fromEntries(product.options.size.map((s) => [s.uk, s.ru])),
            [MATERIAL_OPTION]: Object.fromEntries(product.options.material.map((m) => [m.uk, m.ru])),
          },
        },
      },
      sources: product.sources,
      blocks: resolveBlocks(product, catalog.sharedBlocks),
      production: product.production,
      catalog_files: media.files,
    },
  }
}
