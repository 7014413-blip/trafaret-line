// Writes new blank prices into the catalogue products (catalog/data/products.json): the variant
// prices, the product's lowest price and every «від N ₴» / «от N ₴» text that names it (titles,
// descriptions, SEO). Returns the lowest-price change of each product for variants.csv.

import type { BlankMinPriceChange, BlankRepriceChange, CatalogBlankProduct } from "../../types/blank";

/** «від 10 ₴» → «від 8 ₴» in every string of a JSON value. */
export function replaceFromPrice<T>(value: T, change: BlankMinPriceChange): T {
  const pattern = new RegExp(`(від|от) ${change.from} ₴`, "g");
  const walk = (v: unknown): unknown => {
    if (typeof v === "string") return v.replace(pattern, `$1 ${change.to} ₴`);
    if (Array.isArray(v)) return v.map(walk);
    if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, item]) => [k, walk(item)]));
    return v;
  };
  return walk(value) as T;
}

export function applyBlankPrices(products: CatalogBlankProduct[], changes: readonly BlankRepriceChange[]): Map<string, BlankMinPriceChange> {
  const price = new Map(changes.map((c) => [c.sku, c.to]));
  const touched = new Set(changes.map((c) => c.handle));
  const mins = new Map<string, BlankMinPriceChange>();
  products.forEach((product, index) => {
    if (!touched.has(product.handle)) return;
    const before = Math.min(...product.variants.map((v) => v.price_uah));
    for (const variant of product.variants) variant.price_uah = price.get(variant.sku) ?? variant.price_uah;
    const after = Math.min(...product.variants.map((v) => v.price_uah));
    if (before === after) return;
    const change = { from: before, to: after };
    mins.set(product.handle, change);
    const updated = replaceFromPrice(product, change);
    if (updated.min_price_uah === before) updated.min_price_uah = after;
    products[index] = updated;
  });
  return mins;
}
