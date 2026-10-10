import {
  createProductVariantsWorkflow,
  deleteProductVariantsWorkflow,
  updateProductOptionsWorkflow,
  updateProductsWorkflow,
  updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import type { CatalogProduct, ExistingProduct } from "../../types/catalog"
import type { CreateContext } from "./create-product"
import { knownFiles } from "./file-uploader"
import { categoryIdsOf, optionValues, productData, uploadProductMedia, variantData } from "./product-payload"

export interface VariantChanges {
  created: number
  updated: number
  deleted: number
}

function sameValues(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}

/**
 * Brings an existing product in line with the catalogue without recreating it:
 * texts, photos, categories and metadata; option values; variants matched by SKU
 * (prices updated, new SKUs created, SKUs no longer in the catalogue deleted).
 * The product status is kept, so a published product stays published.
 */
export async function updateCatalogProduct(product: CatalogProduct, existing: ExistingProduct, ctx: CreateContext): Promise<VariantChanges> {
  const media = await uploadProductMedia(product, ctx.uploader, knownFiles(existing.metadata))
  const { handle: _handle, ...fields } = productData(product, media, categoryIdsOf(product, ctx.categoryId), ctx.catalog)
  await updateProductsWorkflow(ctx.container).run({
    input: { products: [{ id: existing.id, ...fields }] },
  })

  const wantedSkus = new Set(product.variants.map((v) => v.sku))
  const obsolete = existing.variants.filter((v) => !v.sku || !wantedSkus.has(v.sku)).map((v) => v.id)
  if (obsolete.length) {
    await deleteProductVariantsWorkflow(ctx.container).run({ input: { ids: obsolete } })
  }

  for (const [title, values] of Object.entries(optionValues(product))) {
    const option = existing.options.find((o) => o.title === title)
    if (!option) {
      throw new Error(`Product ${product.handle} has no option "${title}"; delete it and import again in create mode`)
    }
    if (!sameValues(option.values.map((v) => v.value), values)) {
      await updateProductOptionsWorkflow(ctx.container).run({
        input: { selector: { id: option.id }, update: { values } },
      })
    }
  }

  const variantIdBySku = new Map(existing.variants.filter((v) => v.sku).map((v) => [v.sku as string, v.id]))
  const toUpdate = product.variants.filter((v) => variantIdBySku.has(v.sku))
  const toCreate = product.variants.filter((v) => !variantIdBySku.has(v.sku))
  if (toUpdate.length) {
    await updateProductVariantsWorkflow(ctx.container).run({
      input: {
        product_variants: toUpdate.map((variant) => ({ id: variantIdBySku.get(variant.sku) as string, ...variantData(product, variant) })),
      },
    })
  }
  if (toCreate.length) {
    await createProductVariantsWorkflow(ctx.container).run({
      input: {
        product_variants: toCreate.map((variant) => ({ product_id: existing.id, ...variantData(product, variant) })),
      },
    })
  }
  return { created: toCreate.length, updated: toUpdate.length, deleted: obsolete.length }
}
