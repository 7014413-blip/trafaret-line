import type { ExecArgs } from "@medusajs/framework/types"
import { ProductStatus } from "@medusajs/framework/utils"
import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import type { CatalogData, CatalogProduct } from "../../types/catalog"
import { FileUploader } from "./file-uploader"
import { categoryIdsOf, optionValues, productData, uploadProductMedia, variantData } from "./product-payload"

export interface CreateContext {
  container: ExecArgs["container"]
  catalog: CatalogData
  uploader: FileUploader
  categoryId: Map<string, string>
  salesChannelId: string
  shippingProfileId: string
}

/** Creates one product with its options, variants, prices and media. Returns the number of variants. */
export async function createCatalogProduct(product: CatalogProduct, ctx: CreateContext): Promise<number> {
  const media = await uploadProductMedia(product, ctx.uploader, {})
  const values = optionValues(product)
  await createProductsWorkflow(ctx.container).run({
    input: {
      products: [
        {
          ...productData(product, media, categoryIdsOf(product, ctx.categoryId), ctx.catalog),
          status: product.status === "published" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
          shipping_profile_id: ctx.shippingProfileId,
          sales_channels: [{ id: ctx.salesChannelId }],
          options: Object.entries(values).map(([title, optionValueList]) => ({ title, values: optionValueList })),
          variants: product.variants.map((variant) => variantData(product, variant)),
        },
      ],
    },
  })
  return product.variants.length
}
