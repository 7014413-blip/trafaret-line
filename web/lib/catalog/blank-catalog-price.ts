// Catalogue blank cards priced by the site's blank formula (lib/calculators/pricing.ts), so a
// card and the «/zahotovky» configurator never show two prices for one blank. Repriced: the
// plain shapes of the blank sections. Products with their own work stay as they are: holes
// chosen by the customer, perforated plates, templates, decor (their price has more than a cut).

import type { BlankRepriceChange, CatalogBlankProduct } from "../../types/blank";
import { DEFAULT_PRICING, blankUnitPrice } from "../calculators/pricing";
import { MATERIALS } from "../materials";
import { materialForCode } from "./material-map";

/** Sections whose products are plain cut blanks. */
export const PLAIN_BLANK_SECTIONS: ReadonlySet<string> = new Set([
  "blanks-akryl-prozoryi", "blanks-kolorovyi", "blanks-dzerkalni", "blanks-pet-pidlozhky", "blanks-breloky",
]);

/** Is this catalogue product a plain blank priced by the formula? */
export function isPlainCatalogBlank(product: CatalogBlankProduct): boolean {
  return product.type === "ready" && PLAIN_BLANK_SECTIONS.has(product.primary_category) && !product.hole;
}

/** Price of one piece of a catalogue blank: sheet in mm, number of pieces in the set, catalogue material code. */
export function catalogBlankPrice(sheetMm: readonly [number, number], pieces: number, code: string): number {
  const material = MATERIALS[materialForCode(code)];
  if (material.use !== "blank" || material.baseSquareMeterPrice == null) throw new Error(`catalogue code ${code} is not a priced blank sheet`);
  const areaM2 = (sheetMm[0] * sheetMm[1] * pieces) / 1_000_000;
  const one = blankUnitPrice(areaM2, material, material.baseSquareMeterPrice, DEFAULT_PRICING);
  // A set of several pieces pays the cutting fee for each piece.
  return one + material.cutFeeUah * (pieces - 1);
}

/** Variants of plain blanks whose catalogue price differs from the formula. */
export function catalogBlankChanges(products: readonly CatalogBlankProduct[]): BlankRepriceChange[] {
  const changes: BlankRepriceChange[] = [];
  for (const product of products.filter(isPlainCatalogBlank)) {
    const sizes = new Map((product.options.size ?? []).map((s) => [s.code, s]));
    for (const variant of product.variants) {
      const size = sizes.get(variant.size);
      if (!size) throw new Error(`${product.handle}: variant ${variant.sku} has no size ${variant.size}`);
      const price = catalogBlankPrice(size.sheet_mm, size.pieces ?? 1, variant.material);
      if (price !== variant.price_uah) changes.push({ handle: product.handle, sku: variant.sku, from: variant.price_uah, to: price });
    }
  }
  return changes;
}
