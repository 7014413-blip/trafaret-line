// Prices the plain blank cards of the catalogue by the site's blank formula.
//   npm run catalog:blanks -- <catalog>/data/products.json          shows what would change
//   npm run catalog:blanks -- <catalog>/data/products.json --write  writes the new prices
// Only price_uah of the plain blank variants changes; every other field stays as it is.
// The shared catalogue file is written by one thread at a time (export lock of catalog/tools).

import fs from "node:fs";
import { catalogBlankChanges } from "../lib/catalog/blank-catalog-price";
import type { CatalogBlankProduct } from "../types/blank";

const [file, flag] = process.argv.slice(2);
if (!file || (flag && flag !== "--write")) {
  console.error("Usage: npm run catalog:blanks -- <products.json> [--write]");
  process.exit(2);
}

const products = JSON.parse(fs.readFileSync(file, "utf8")) as CatalogBlankProduct[];
const changes = catalogBlankChanges(products);
const byHandle = new Map<string, number>();
for (const c of changes) byHandle.set(c.handle, (byHandle.get(c.handle) ?? 0) + 1);
for (const [handle, count] of byHandle) console.log(`${handle}: ${count} variants`);
console.log(`${changes.length} variant prices differ from the blank formula.`);

if (flag === "--write" && changes.length) {
  const price = new Map(changes.map((c) => [c.sku, c.to]));
  for (const product of products) {
    for (const variant of product.variants) {
      const next = price.get(variant.sku);
      if (next != null) variant.price_uah = next;
    }
  }
  fs.writeFileSync(file, JSON.stringify(products, null, 2));
  console.log(`Written: ${file}`);
}
