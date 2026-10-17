// Variant chosen by a link (?variant=<id>), as the product feed and ads open a product page:
// the size and material of that variant, or null when the link names no variant of this product.

import type { CatalogVariant } from "../../types/catalog";

export function variantFromSearch(search: string, variants: readonly CatalogVariant[]): CatalogVariant | null {
  const id = new URLSearchParams(search).get("variant");
  if (!id) return null;
  return variants.find((v) => v.id === id) ?? null;
}
