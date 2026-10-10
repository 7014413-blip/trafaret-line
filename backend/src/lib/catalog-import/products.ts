import type { Logger } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ExistingProduct, ImportMode, ImportStats } from "../../types/catalog"
import { createCatalogProduct, type CreateContext } from "./create-product"
import { updateCatalogProduct } from "./update-product"

/** Creates missing products and, in update mode, refreshes the existing ones. */
export async function syncProducts(ctx: CreateContext, mode: ImportMode, logger: Logger, stats: ImportStats): Promise<void> {
  const query = ctx.container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "product",
    fields: ["id", "handle", "metadata", "options.id", "options.title", "options.values.value", "variants.id", "variants.sku"],
    filters: { handle: ctx.catalog.products.map((p) => p.handle) },
  })
  const existing = new Map<string, ExistingProduct>((data as ExistingProduct[]).map((p) => [p.handle, p]))

  for (const product of ctx.catalog.products) {
    const current = existing.get(product.handle)
    if (!current) {
      const variants = await createCatalogProduct(product, ctx)
      stats.productsCreated += 1
      stats.variantsCreated += variants
      logger.info(`Product created: ${product.handle} (${variants} variants)`)
      continue
    }
    if (mode === "create") {
      stats.productsSkipped += 1
      logger.info(`Product exists, skipped: ${product.handle}`)
      continue
    }
    const changes = await updateCatalogProduct(product, current, ctx)
    stats.productsUpdated += 1
    stats.variantsCreated += changes.created
    stats.variantsUpdated += changes.updated
    stats.variantsDeleted += changes.deleted
    logger.info(`Product updated: ${product.handle} (${changes.updated} variants updated, ${changes.created} created, ${changes.deleted} deleted)`)
  }
}
