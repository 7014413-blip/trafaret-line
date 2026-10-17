// Price of catalogue variants from the database (never from the browser), for the checkout and
// the «Повторити замовлення» of the cabinet.

import type { VariantPrice } from "../../types/order-pricing";

/**
 * Price of catalogue variants from the database (never from the browser); only published
 * products that are not marked «Немає в наявності» in «Простий кабінет».
 */
export async function variantPrices(query: { graph: (args: Record<string, unknown>) => Promise<{ data: unknown[] }> }, ids: string[]): Promise<Map<string, VariantPrice>> {
  const out = new Map<string, VariantPrice>();
  if (!ids.length) return out;
  const { data } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "sku", "metadata", "prices.amount", "prices.currency_code", "product.title", "product.status", "product.metadata"],
    filters: { id: ids },
  });
  for (const raw of data as { id: string; title: string; sku: string | null; metadata?: Record<string, unknown> | null; prices?: { amount: number; currency_code: string }[]; product?: { title: string; status: string; metadata?: Record<string, unknown> | null } }[]) {
    const price = raw.prices?.find((p) => p.currency_code === "uah");
    if (!price || raw.product?.status !== "published") continue;
    if (raw.product.metadata?.availability === "out_of_stock") continue;
    const sheet = raw.metadata?.sheet_mm;
    const sheetMm = Array.isArray(sheet) && sheet.length === 2 && sheet.every((v) => typeof v === "number" && v > 0) ? (sheet as [number, number]) : null;
    out.set(raw.id, { title: `${raw.product.title}, ${raw.title}`, sku: raw.sku, price: Number(price.amount), sheetMm, hole: raw.product.metadata?.hole ?? null });
  }
  return out;
}

