// Writes new blank prices into catalog/data/variants.csv (one row per variant, every field
// quoted): the price column of each repriced SKU and the «від N ₴» SEO titles of its product.

import type { BlankMinPriceChange, BlankRepriceChange } from "../../types/blank";

/** Fields of one CSV row with every field in double quotes ("" inside a field is a quote). */
function readRow(line: string): string[] {
  const fields: string[] = [];
  const pattern = /"((?:[^"]|"")*)"(?:,|$)/g;
  for (const match of line.matchAll(pattern)) fields.push(match[1].replace(/""/g, "\""));
  return fields;
}

const writeRow = (fields: string[]) => fields.map((f) => `"${f.replace(/"/g, "\"\"")}"`).join(",");

export function applyBlankPricesCsv(csv: string, changes: readonly BlankRepriceChange[], mins: ReadonlyMap<string, BlankMinPriceChange>): string {
  const lines = csv.split("\n");
  const header = lines[0].replace(/^﻿/, "").split(",");
  const col = (name: string) => {
    const index = header.indexOf(name);
    if (index < 0) throw new Error(`variants.csv has no column ${name}`);
    return index;
  };
  const handleCol = col("handle");
  const skuCol = col("sku");
  const priceCol = col("price_uah");
  const price = new Map(changes.map((c) => [c.sku, c.to]));
  return lines.map((line, i) => {
    if (i === 0 || !line) return line;
    const fields = readRow(line);
    const next = price.get(fields[skuCol]);
    const min = mins.get(fields[handleCol]);
    if (next == null && !min) return line;
    if (next != null) fields[priceCol] = String(next);
    const pattern = min ? new RegExp(`(від|от) ${min.from} ₴`, "g") : null;
    return writeRow(pattern && min ? fields.map((f) => f.replace(pattern, `$1 ${min.to} ₴`)) : fields);
  }).join("\n");
}
