import fs from "node:fs"
import path from "node:path"
import type {
  CatalogCategory,
  CatalogData,
  CatalogProduct,
  FaqItem,
  ImportMode,
  ImportSettings,
  Localized,
  SharedBlock,
  SharedBlocks,
  SharedFaq,
  Lang,
} from "../../types/catalog"

const DEFAULT_SALES_CHANNEL = "Trafaret Line"

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T
}

/** Reads CATALOG_DIR, IMPORT_MODE and SALES_CHANNEL_NAME from the environment. */
export function readSettings(env: NodeJS.ProcessEnv): ImportSettings {
  const catalogDir = env.CATALOG_DIR
  if (!catalogDir || !fs.existsSync(path.join(catalogDir, "data", "products.json"))) {
    throw new Error("Set CATALOG_DIR to the catalog folder (it must contain data/products.json)")
  }
  const rawMode = (env.IMPORT_MODE ?? "create").trim().toLowerCase()
  if (rawMode !== "create" && rawMode !== "update") {
    throw new Error(`IMPORT_MODE must be "create" or "update", got "${env.IMPORT_MODE}"`)
  }
  const mode: ImportMode = rawMode
  const salesChannelName = (env.SALES_CHANNEL_NAME ?? DEFAULT_SALES_CHANNEL).trim()
  return { catalogDir, mode, salesChannelName }
}

/** Loads the catalogue JSON files. */
export function loadCatalog(catalogDir: string): CatalogData {
  const dataDir = path.join(catalogDir, "data")
  return {
    catalogDir,
    categories: readJson<CatalogCategory[]>(path.join(dataDir, "categories.json")),
    products: readJson<CatalogProduct[]>(path.join(dataDir, "products.json")),
    sharedBlocks: readJson<SharedBlocks>(path.join(dataDir, "shared-blocks.json")),
    sharedFaq: readJson<SharedFaq>(path.join(dataDir, "shared-faq.json")),
  }
}

/** Turns paragraph HTML into plain text with blank lines between paragraphs. */
export function stripHtml(html: string): string {
  return html.replace(/<\/p>\s*<p>/g, "\n\n").replace(/<[^>]+>/g, "").trim()
}

/** Orders categories so every parent comes before its children, then by rank. */
export function sortByDepth(categories: CatalogCategory[]): CatalogCategory[] {
  const byHandle = new Map(categories.map((c) => [c.handle, c]))
  const depth = (category: CatalogCategory): number => {
    if (!category.parent) {
      return 0
    }
    const parent = byHandle.get(category.parent)
    if (!parent) {
      throw new Error(`Parent category ${category.parent} of ${category.handle} is not in categories.json`)
    }
    return 1 + depth(parent)
  }
  return [...categories].sort((a, b) => depth(a) - depth(b) || a.rank - b.rank)
}

/** The product's own two questions followed by the shared FAQ blocks it refers to. */
export function resolveFaq(product: CatalogProduct, sharedFaq: SharedFaq): Localized<FaqItem[]> {
  const pick = (lang: Lang): FaqItem[] => {
    const shared = product.faq_blocks.flatMap((key) => {
      const block = sharedFaq[key]
      if (!block) {
        throw new Error(`Shared FAQ "${key}" is missing in shared-faq.json`)
      }
      return block[lang]
    })
    return [...product[lang].faq, ...shared]
  }
  return { uk: pick("uk"), ru: pick("ru") }
}

/** The shared tabs (how-to, care, delivery, guarantee) resolved to their texts. */
export function resolveBlocks(product: CatalogProduct, sharedBlocks: SharedBlocks): Localized<Record<string, SharedBlock>> {
  const pick = (lang: Lang): Record<string, SharedBlock> =>
    Object.fromEntries(
      Object.entries(product.blocks).map(([slot, key]) => {
        const block = sharedBlocks[key]
        if (!block) {
          throw new Error(`Shared block "${key}" is missing in shared-blocks.json`)
        }
        return [slot, block[lang]]
      })
    )
  return { uk: pick("uk"), ru: pick("ru") }
}
