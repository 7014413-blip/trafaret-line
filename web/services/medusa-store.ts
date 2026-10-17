// Medusa Store API for server components: categories and products with prices of the
// region «Україна» (UAH). Answers are cached by Next.js for 5 minutes, so the catalogue
// follows changes in the admin without a rebuild. Only published products are returned.

import "server-only";
import { unstable_cache } from "next/cache";
import type { CatalogCardLite, CatalogCategory, CatalogProduct, CatalogProductCard, RawCategory, RawProduct } from "../types/catalog";
import { mapCategory, mapProduct, mapProductCard } from "../lib/catalog/map-catalog";
import type { Locale } from "../types/customizer";
import { toCardLite } from "../lib/catalog/card-lite";
import { UpstreamError } from "./config";

const REVALIDATE_S = 300;
const PRODUCT_FIELDS = [
  "id", "title", "subtitle", "handle", "description", "thumbnail", "+metadata",
  "*images", "*categories", "*options", "*options.values",
  "*variants", "*variants.calculated_price", "*variants.options", "*variants.options.option",
].join(",");
/** Lighter set for product cards: no description HTML (cards never show it). */
const CARD_FIELDS = [
  "id", "title", "subtitle", "handle", "thumbnail", "+metadata",
  "*images", "*categories", "*options", "*options.values",
  "*variants", "*variants.calculated_price", "*variants.options", "*variants.options.option",
].join(",");

export function base(): { url: string; key: string } {
  const url = process.env.MEDUSA_INTERNAL_URL ?? process.env.NEXT_PUBLIC_MEDUSA_URL;
  const key = process.env.NEXT_PUBLIC_MEDUSA_PK;
  if (!url || !key) throw new UpstreamError("internal", "NEXT_PUBLIC_MEDUSA_URL and NEXT_PUBLIC_MEDUSA_PK must be set");
  return { url: url.replace(/\/$/, ""), key };
}

/**
 * GET from the Store API. "revalidate" keeps the raw answer in the Next.js data cache for
 * 5 minutes; "no-store" is for big product pages whose mapped result is cached instead
 * (the data cache refuses entries over 2 MB and would refetch on every request).
 */
export async function storeGet<T>(path: string, params: Record<string, string | string[] | number | undefined>, cache: "revalidate" | "no-store" = "revalidate"): Promise<T> {
  const { url, key } = base();
  const query = new URLSearchParams();
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) for (const v of value) query.append(`${name}[]`, v);
    else query.set(name, String(value));
  }
  const response = await fetch(`${url}${path}?${query}`, {
    headers: { "x-publishable-api-key": key, accept: "application/json" },
    ...(cache === "no-store" ? { cache: "no-store" as const } : { next: { revalidate: REVALIDATE_S, tags: ["catalog"] } }),
  });
  if (!response.ok) throw new UpstreamError("internal", `Medusa ${path}: HTTP ${response.status}`, response.status);
  return (await response.json()) as T;
}

let regionId: string | null = null;

/** Region with UAH prices (seed-trafaret.ts creates «Україна»). */
export async function uahRegionId(): Promise<string> {
  if (regionId) return regionId;
  const { regions } = await storeGet<{ regions: { id: string; currency_code: string }[] }>("/store/regions", { limit: 50 });
  const region = regions.find((r) => r.currency_code === "uah");
  if (!region) throw new UpstreamError("internal", "Medusa has no UAH region");
  regionId = region.id;
  return regionId;
}

/** Every category, mapped with children; roots sorted by rank. */
export async function listCategories(locale: Locale = "uk"): Promise<{ roots: CatalogCategory[]; all: CatalogCategory[] }> {
  const { product_categories: raw } = await storeGet<{ product_categories: RawCategory[] }>("/store/product-categories", {
    fields: "id,name,handle,description,rank,parent_category_id,+metadata", limit: 500,
  });
  const all = raw.map((c) => mapCategory(c, raw, locale));
  const roots = all.filter((c) => !c.parentHandle).sort((a, b) => a.rank - b.rank);
  return { roots, all };
}

/** Category by its path segments: ["food"] or ["food", "tort"]. */
export async function categoryByPath(segments: string[], locale: Locale = "uk"): Promise<CatalogCategory | null> {
  const path = `/${segments.join("/")}`;
  const { all } = await listCategories(locale);
  return all.find((c) => c.path === path) ?? null;
}

/** Published products of the given categories (all pages). */
export async function listProducts(categoryIds: string[], locale: Locale = "uk"): Promise<CatalogProductCard[]> {
  const region = await uahRegionId();
  const cards: CatalogProductCard[] = [];
  const limit = 100;
  for (let offset = 0; offset < 5000; offset += limit) {
    const page = await storeGet<{ products: RawProduct[]; count: number }>("/store/products", {
      fields: CARD_FIELDS, region_id: region, category_id: categoryIds, limit, offset,
    }, "no-store");
    cards.push(...page.products.map((p) => mapProductCard(p, locale)));
    if (offset + limit >= page.count) break;
  }
  return cards;
}

/**
 * Light cards of the given categories for the category grid, cached for 5 minutes as the
 * mapped result (tens of KB instead of megabytes of raw Medusa JSON).
 */
export const listCategoryCards = unstable_cache(
  async (categoryIds: string[], locale: Locale = "uk"): Promise<CatalogCardLite[]> => (await listProducts(categoryIds, locale)).map(toCardLite),
  ["category-cards-v2"],
  { revalidate: REVALIDATE_S, tags: ["catalog"] },
);

/** First published products of the given categories, one request (home page rails), cached mapped. */
export const listFirstProducts = unstable_cache(
  async (categoryIds: string[], count: number, locale: Locale = "uk"): Promise<CatalogProductCard[]> => {
    const region = await uahRegionId();
    const { products } = await storeGet<{ products: RawProduct[] }>("/store/products", {
      fields: CARD_FIELDS, region_id: region, category_id: categoryIds, limit: count, offset: 0,
    }, "no-store");
    return products.map((p) => mapProductCard(p, locale));
  },
  ["first-products-v2"],
  { revalidate: REVALIDATE_S, tags: ["catalog"] },
);

/** Full-text search over published products (title, description, handle), up to `count` light cards. */
export async function searchProducts(text: string, count = 60, locale: Locale = "uk"): Promise<CatalogCardLite[]> {
  const q = text.trim().slice(0, 100);
  if (q.length < 2) return [];
  const region = await uahRegionId();
  const { products } = await storeGet<{ products: RawProduct[] }>("/store/products", {
    fields: CARD_FIELDS, region_id: region, q, limit: count, offset: 0,
  }, "no-store");
  return products.map((p) => toCardLite(mapProductCard(p, locale)));
}

/** Handles and update dates of every published product (sitemap). */
export async function listProductHandles(): Promise<{ handle: string; updatedAt: string | null }[]> {
  const out: { handle: string; updatedAt: string | null }[] = [];
  const limit = 500;
  for (let offset = 0; offset < 20_000; offset += limit) {
    const page = await storeGet<{ products: { handle: string; updated_at?: string | null }[]; count: number }>("/store/products", {
      fields: "handle,updated_at", limit, offset,
    });
    out.push(...page.products.map((p) => ({ handle: p.handle, updatedAt: p.updated_at ?? null })));
    if (offset + limit >= page.count) break;
  }
  return out;
}

/** Every published product with its variants and prices (product feed), read 100 at a time. */
export async function listAllProducts(locale: Locale = "uk"): Promise<CatalogProduct[]> {
  const region = await uahRegionId();
  const out: CatalogProduct[] = [];
  const limit = 100;
  for (let offset = 0; offset < 20_000; offset += limit) {
    const page = await storeGet<{ products: RawProduct[]; count: number }>("/store/products", {
      fields: PRODUCT_FIELDS, region_id: region, limit, offset,
    });
    out.push(...page.products.map((p) => mapProduct(p, locale)));
    if (offset + limit >= page.count) break;
  }
  return out;
}

/** One published product by handle, null when it does not exist or is a draft. */
export async function productByHandle(handle: string, locale: Locale = "uk"): Promise<CatalogProduct | null> {
  const region = await uahRegionId();
  const { products } = await storeGet<{ products: RawProduct[] }>("/store/products", { fields: PRODUCT_FIELDS, region_id: region, handle, limit: 1 });
  return products[0] ? mapProduct(products[0], locale) : null;
}

/** Published products by handles (related products), in the given order. */
export async function productsByHandles(handles: string[], locale: Locale = "uk"): Promise<CatalogProductCard[]> {
  if (!handles.length) return [];
  const region = await uahRegionId();
  const { products } = await storeGet<{ products: RawProduct[] }>("/store/products", {
    fields: CARD_FIELDS, region_id: region, handle: handles, limit: handles.length,
  });
  const cards = products.map((p) => mapProductCard(p, locale));
  return handles.map((h) => cards.find((c) => c.handle === h)).filter((c): c is CatalogProductCard => !!c);
}
