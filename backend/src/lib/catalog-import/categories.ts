import type { ExecArgs, Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { createProductCategoriesWorkflow, updateProductCategoriesWorkflow } from "@medusajs/medusa/core-flows"
import type { CatalogCategory, ExistingCategory, ImportMode, ImportStats, UploadedFiles } from "../../types/catalog"
import { sortByDepth, stripHtml } from "./catalog-data"
import { FileUploader, knownFiles } from "./file-uploader"

/** Category fields shared by create and update. */
function categoryData(category: CatalogCategory, parentId: string | null, imageUrl: string, files: UploadedFiles) {
  return {
    name: category.uk.name,
    handle: category.handle,
    description: stripHtml(category.uk.intro),
    is_active: true,
    is_internal: false,
    rank: category.rank,
    parent_category_id: parentId,
    metadata: {
      path: category.path,
      image: imageUrl,
      seo: {
        uk: { title: category.uk.seo_title, description: category.uk.seo_description, h1: category.uk.h1 },
        ru: { title: category.ru.seo_title, description: category.ru.seo_description, h1: category.ru.h1 },
        ...(category.en ? { en: { title: category.en.seo_title, description: category.en.seo_description, h1: category.en.h1 } } : {}),
      },
      content: {
        uk: { intro: category.uk.intro, body_html: category.uk.body_html, faq: category.uk.faq },
        ru: { intro: category.ru.intro, body_html: category.ru.body_html, faq: category.ru.faq },
        ...(category.en ? { en: { intro: category.en.intro, body_html: category.en.body_html, faq: category.en.faq } } : {}),
      },
      i18n: { ru: { name: category.ru.name }, ...(category.en ? { en: { name: category.en.name, slug: category.en.slug } } : {}) },
      catalog_files: files,
    },
  }
}

/**
 * Creates missing categories and, in update mode, refreshes existing ones.
 * Returns handle → Medusa category id for every catalogue category.
 */
export async function syncCategories(
  container: ExecArgs["container"],
  categories: CatalogCategory[],
  mode: ImportMode,
  uploader: FileUploader,
  logger: Logger,
  stats: ImportStats
): Promise<Map<string, string>> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product_category",
    fields: ["id", "handle", "metadata"],
    filters: { handle: categories.map((c) => c.handle) },
  })
  const existing = new Map<string, ExistingCategory>((data as ExistingCategory[]).map((c) => [c.handle, c]))
  const categoryId = new Map<string, string>([...existing.values()].map((c) => [c.handle, c.id]))

  for (const category of sortByDepth(categories)) {
    const current = existing.get(category.handle)
    if (current && mode === "create") {
      stats.categoriesSkipped += 1
      logger.info(`Category exists, skipped: ${category.handle}`)
      continue
    }
    const parentId = category.parent ? categoryId.get(category.parent) ?? null : null
    if (category.parent && !parentId) {
      throw new Error(`Parent category ${category.parent} missing for ${category.handle}`)
    }
    const image = await uploader.upload(category.image, knownFiles(current?.metadata))
    const data = categoryData(category, parentId, image.url, { [category.image]: image })

    if (current) {
      await updateProductCategoriesWorkflow(container).run({
        input: { selector: { id: current.id }, update: data },
      })
      stats.categoriesUpdated += 1
      logger.info(`Category updated: ${category.handle}`)
      continue
    }
    const { result } = await createProductCategoriesWorkflow(container).run({
      input: { product_categories: [data] },
    })
    categoryId.set(category.handle, result[0].id)
    stats.categoriesCreated += 1
    logger.info(`Category created: ${category.handle}`)
  }
  return categoryId
}
