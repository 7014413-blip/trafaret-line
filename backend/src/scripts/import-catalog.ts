/**
 * Imports the Trafaret Line catalogue (categories, products, variants, photos,
 * video, cut files, uk/ru texts) into Medusa v2.
 *
 * Run from the Medusa backend:
 *   CATALOG_DIR="/path/to/catalog" npx medusa exec ./src/scripts/import-catalog.ts
 *   CATALOG_DIR="/path/to/catalog" IMPORT_MODE=update npx medusa exec ./src/scripts/import-catalog.ts
 *
 * IMPORT_MODE=create (default): adds categories and products whose handle does not exist yet.
 * IMPORT_MODE=update: also updates existing ones in place — texts, photos, categories,
 *   option values and variant prices (matched by SKU); the product status is kept.
 *   Files whose content did not change are not uploaded again (hashes in metadata.catalog_files).
 * SALES_CHANNEL_NAME: storefront sales channel, default "Trafaret Line".
 * New products are created with the status from products.json (drafts until approved).
 */
import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import type { ImportStats } from "../types/catalog"
import { loadCatalog, readSettings } from "../lib/catalog-import/catalog-data"
import { syncCategories } from "../lib/catalog-import/categories"
import { FileUploader } from "../lib/catalog-import/file-uploader"
import { syncProducts } from "../lib/catalog-import/products"
import { resolveStoreSetup } from "../lib/catalog-import/store-setup"

export default async function importCatalog({ container }: ExecArgs): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const settings = readSettings(process.env)
  const catalog = loadCatalog(settings.catalogDir)
  const uploader = new FileUploader(container, settings.catalogDir, logger)
  const { salesChannelId, shippingProfileId } = await resolveStoreSetup(container, settings.salesChannelName)
  const stats: ImportStats = {
    categoriesCreated: 0,
    categoriesUpdated: 0,
    categoriesSkipped: 0,
    productsCreated: 0,
    productsUpdated: 0,
    productsSkipped: 0,
    variantsCreated: 0,
    variantsUpdated: 0,
    variantsDeleted: 0,
  }
  logger.info(`Catalogue import (${settings.mode}): ${catalog.categories.length} categories, ${catalog.products.length} products`)

  const categoryId = await syncCategories(container, catalog.categories, settings.mode, uploader, logger, stats)
  await syncProducts({ container, catalog, uploader, categoryId, salesChannelId, shippingProfileId }, settings.mode, logger, stats)

  logger.info(
    `Catalogue import finished. Categories: ${stats.categoriesCreated} created, ${stats.categoriesUpdated} updated, ${stats.categoriesSkipped} skipped. ` +
      `Products: ${stats.productsCreated} created, ${stats.productsUpdated} updated, ${stats.productsSkipped} skipped. ` +
      `Variants: ${stats.variantsCreated} created, ${stats.variantsUpdated} updated, ${stats.variantsDeleted} deleted.`
  )
}
