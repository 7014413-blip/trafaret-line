// What the production files need about catalogue lines: the product's master layouts and the
// sheet and picture of the ordered size (catalogue import: product metadata.design_files and
// size_details, variant metadata.size_code, sheet_mm, material_code; ТЗ §19).

import type { QueryGraph } from "../../types/order-files";
import type { CatalogLineSource } from "../../types/masters";

const SIZE_OPTION = "Розмір";

interface RawVariant {
  id: string;
  sku?: string | null;
  metadata?: Record<string, unknown> | null;
  options?: { value?: string; option?: { title?: string } | null }[] | null;
  product?: { handle?: string; metadata?: Record<string, unknown> | null } | null;
}

const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []);

/** Source of every variant that is a catalogue stencil; variants without sheet data are left out. */
export async function catalogLineSources(graph: QueryGraph, variantIds: string[]): Promise<Map<string, CatalogLineSource>> {
  const sources = new Map<string, CatalogLineSource>();
  if (!variantIds.length) return sources;
  const { data } = await graph({
    entity: "product_variant",
    fields: ["id", "sku", "metadata", "options.value", "options.option.title", "product.handle", "product.metadata"],
    filters: { id: [...new Set(variantIds)] },
  });
  for (const raw of data as RawVariant[]) {
    const meta = raw.metadata ?? {};
    const sheet = meta.sheet_mm;
    if (!Array.isArray(sheet) || sheet.length !== 2 || !sheet.every((v) => typeof v === "number" && v > 0) || !raw.product?.handle) continue;
    const productMeta = raw.product.metadata ?? {};
    const sizeLabel = raw.options?.find((o) => o.option?.title === SIZE_OPTION)?.value ?? String(meta.size_code ?? "");
    const details = (productMeta.size_details ?? {}) as Record<string, { uk?: string } | undefined>;
    sources.set(raw.id, {
      handle: raw.product.handle,
      sizeCode: String(meta.size_code ?? sizeLabel),
      sizeLabel,
      sheetMm: [sheet[0], sheet[1]],
      detail: details[sizeLabel]?.uk ?? "",
      designUrls: strings(productMeta.design_files),
      materialCode: String(meta.material_code ?? ""),
      sku: raw.sku ?? "",
    });
  }
  return sources;
}
