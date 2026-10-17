// «Простий кабінет»: saves the product form with Medusa workflows, in the same layout as the
// catalogue import (options «Розмір» × «Матеріал», one UAH price per variant, texts in
// metadata). Metadata the form does not show (Russian texts, blocks, files) is kept as is.

import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules, ProductStatus } from "@medusajs/framework/utils"
import {
  createProductsWorkflow, createProductVariantsWorkflow, deleteProductVariantsWorkflow,
  updateProductOptionsWorkflow, updateProductsWorkflow, updateProductVariantsWorkflow,
} from "@medusajs/medusa/core-flows"
import { randomUUID } from "node:crypto"
import type { KabinetPriceCell, KabinetProductInput } from "../../types/kabinet"
import { CURRENCY, MATERIAL_OPTION, readRawProduct, SIZE_OPTION, type Graph, type RawProductRow } from "./read"

const DEFAULT_SALES_CHANNEL = "Trafaret Line"

function variantFields(cell: KabinetPriceCell) {
  return {
    title: `${cell.size} · ${cell.material}`,
    options: { [SIZE_OPTION]: cell.size, [MATERIAL_OPTION]: cell.material },
    prices: [{ amount: cell.price, currency_code: CURRENCY }],
  }
}

/** SKU for a variant made in the cabinet: product handle plus a short random tail. */
function newSku(handle: string): string {
  return `${handle.slice(0, 40)}-${randomUUID().slice(0, 8)}`.toUpperCase()
}

/** Metadata after the form: edited keys replaced, everything else kept. */
function mergedMetadata(existing: Record<string, unknown> | null, input: KabinetProductInput): Record<string, unknown> {
  const base = { ...(existing ?? {}) }
  const withUk = (key: string, uk: unknown) => {
    const prev = base[key] && typeof base[key] === "object" ? (base[key] as Record<string, unknown>) : {}
    return { ...prev, uk }
  }
  const oldAlts = Array.isArray(base.image_alts) ? (base.image_alts as { url: string; kind?: string; ru?: string }[]) : []
  const prevSeo = (base.seo && typeof base.seo === "object" ? (base.seo as Record<string, unknown>).uk : undefined) as Record<string, unknown> | undefined
  return {
    ...base,
    hit: input.hit,
    is_new: input.isNew,
    availability: input.availability,
    min_price_uah: Math.min(...input.prices.map((p) => p.price)),
    features: withUk("features", input.features),
    faq: withUk("faq", input.faq),
    seo: withUk("seo", { ...(prevSeo ?? {}), title: input.seo.title, description: input.seo.description }),
    image_alts: input.images.map((img) => {
      const old = oldAlts.find((a) => a.url === img.url)
      return { url: img.url, kind: old?.kind ?? "photo", uk: img.alt || input.title, ru: old?.ru ?? "" }
    }),
    admin_edited_at: new Date().toISOString(),
  }
}

function productFields(input: KabinetProductInput) {
  return {
    title: input.title,
    subtitle: input.subtitle || null,
    description: input.descriptionHtml,
    status: input.status === "published" ? ProductStatus.PUBLISHED : ProductStatus.DRAFT,
    category_ids: input.categoryIds,
    images: input.images.map((img) => ({ url: img.url })),
    thumbnail: input.images[0]?.url ?? null,
  }
}

async function storeChannelAndProfile(container: MedusaContainer): Promise<{ salesChannelId: string; shippingProfileId: string }> {
  const salesChannels = container.resolve(Modules.SALES_CHANNEL)
  const fulfillment = container.resolve(Modules.FULFILLMENT)
  const name = (process.env.SALES_CHANNEL_NAME ?? DEFAULT_SALES_CHANNEL).trim()
  const channel = (await salesChannels.listSalesChannels({ name }))[0] ?? (await salesChannels.listSalesChannels({}))[0]
  const profile = (await fulfillment.listShippingProfiles({ type: "default" }))[0]
  if (!channel || !profile) throw new Error("Магазин не налаштований: немає каналу продажу або профілю доставки")
  return { salesChannelId: channel.id, shippingProfileId: profile.id }
}

/** New product; returns its id. */
export async function createKabinetProduct(container: MedusaContainer, input: KabinetProductInput): Promise<string> {
  const { salesChannelId, shippingProfileId } = await storeChannelAndProfile(container)
  const handle = input.handle as string
  const { result } = await createProductsWorkflow(container).run({
    input: {
      products: [{
        ...productFields(input),
        handle,
        shipping_profile_id: shippingProfileId,
        sales_channels: [{ id: salesChannelId }],
        options: [
          { title: SIZE_OPTION, values: input.sizes },
          { title: MATERIAL_OPTION, values: input.materials },
        ],
        variants: input.prices.map((cell) => ({
          ...variantFields(cell),
          sku: newSku(handle),
          manage_inventory: false,
          allow_backorder: true,
        })),
        metadata: { catalog_type: "ready", ...mergedMetadata(null, input) },
      }],
    },
  })
  return (result as { id: string }[])[0].id
}

/** Existing product: texts, photos, categories, options and the price table. */
export async function updateKabinetProduct(container: MedusaContainer, graph: Graph, existing: RawProductRow, input: KabinetProductInput): Promise<void> {
  await updateProductsWorkflow(container).run({
    input: { products: [{ id: existing.id, ...productFields(input), metadata: mergedMetadata(existing.metadata, input) }] },
  })

  const variants = existing.variants ?? []
  const keptIds = new Set(input.prices.map((p) => p.variantId).filter((id): id is string => !!id && variants.some((v) => v.id === id)))
  const obsolete = variants.filter((v) => !keptIds.has(v.id)).map((v) => v.id)
  if (obsolete.length) await deleteProductVariantsWorkflow(container).run({ input: { ids: obsolete } })

  // Option values: everything the table uses (removed values go only after their variants).
  const fresh = await readRawProduct(graph, existing.id)
  for (const [title, values] of [[SIZE_OPTION, input.sizes], [MATERIAL_OPTION, input.materials]] as const) {
    const option = fresh?.options?.find((o) => o.title === title)
    const current = option?.values?.map((v) => v.value) ?? []
    const same = current.length === values.length && current.every((v, i) => v === values[i])
    if (option?.id && !same) {
      await updateProductOptionsWorkflow(container).run({ input: { selector: { id: option.id }, update: { values: [...values] } } })
    }
  }

  const toUpdate = input.prices.filter((p) => p.variantId && keptIds.has(p.variantId))
  const toCreate = input.prices.filter((p) => !p.variantId || !keptIds.has(p.variantId))
  if (toUpdate.length) {
    await updateProductVariantsWorkflow(container).run({
      input: { product_variants: toUpdate.map((cell) => ({ id: cell.variantId as string, ...variantFields(cell) })) },
    })
  }
  if (toCreate.length) {
    await createProductVariantsWorkflow(container).run({
      input: {
        product_variants: toCreate.map((cell) => ({
          product_id: existing.id,
          ...variantFields(cell),
          sku: newSku(existing.handle),
          manage_inventory: false,
          allow_backorder: true,
        })),
      },
    })
  }
}
