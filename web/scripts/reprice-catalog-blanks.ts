// Prices the plain blank cards of the catalogue by the site's blank formula.
//   npm run catalog:blanks -- <catalog>/data/products.json          shows what would change
//   npm run catalog:blanks -- <catalog>/data/products.json --write  writes the new prices
// --write changes the variant prices, the lowest price and its «від N ₴» texts in products.json
// and the same in variants.csv next to it; every other field stays as it is. The shared
// catalogue files are written by one thread at a time (export lock of catalog/tools).

import fs from "node:fs";
import path from "node:path";
import { applyBlankPrices } from "../lib/catalog/apply-blank-prices";
import { applyBlankPricesCsv } from "../lib/catalog/apply-blank-prices-csv";
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
  const mins = applyBlankPrices(products, changes);
  fs.writeFileSync(file, JSON.stringify(products, null, 2));
  const csvFile = path.join(path.dirname(file), "variants.csv");
  if (fs.existsSync(csvFile)) fs.writeFileSync(csvFile, applyBlankPricesCsv(fs.readFileSync(csvFile, "utf8"), changes, mins));
  for (const [handle, min] of mins) console.log(`${handle}: від ${min.from} → ${min.to} ₴`);
  console.log(`Written: ${file}${fs.existsSync(csvFile) ? ` and ${csvFile}` : ""}`);
}
