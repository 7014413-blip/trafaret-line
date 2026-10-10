// Medusa Store API answers → catalogue shapes of the storefront (types/catalog.ts).
// Pure functions, so pages and tests use the same mapping.

import type {
  CatalogCategory, CatalogImage, CatalogProduct, CatalogProductCard, CatalogVariant, RawCategory, RawProduct, RawVariant,
} from "../../types/catalog";
import { fixCountAgreement } from "../text/count-agreement";

const SIZE_OPTION = "Розмір";
const MATERIAL_OPTION = "Матеріал";

export function mapCategory(raw: RawCategory, all: RawCategory[] = []): CatalogCategory {
  const parent = raw.parent_category ?? all.find((c) => c.id === raw.parent_category_id) ?? null;
  const seo = raw.metadata?.seo?.uk;
  const content = raw.metadata?.content?.uk;
  const children = (raw.category_children ?? all.filter((c) => c.parent_category_id === raw.id))
    .map((child) => mapCategory({ ...child, parent_category: { id: raw.id, handle: raw.handle, name: raw.name } }, []))
    .sort((a, b) => a.rank - b.rank);
  return {
    id: raw.id,
    handle: raw.handle,
    name: raw.name,
    // Site URLs have no trailing slash (Next.js redirects "/food/" to "/food").
    path: (raw.metadata?.path ?? (parent ? `/${parent.handle}/${raw.handle.replace(`${parent.handle}-`, "")}` : `/${raw.handle}`)).replace(/\/+$/, "") || "/",
    parentHandle: parent?.handle ?? null,
    rank: raw.rank ?? 0,
    image: raw.metadata?.image ?? null,
    seo: {
      title: fixCountAgreement(seo?.title ?? raw.name),
      description: fixCountAgreement(seo?.description ?? raw.description ?? ""),
      h1: fixCountAgreement(seo?.h1 ?? raw.name),
    },
    intro: fixCountAgreement(content?.intro ?? raw.description ?? ""),
    bodyHtml: content?.body_html ?? "",
    faq: content?.faq ?? [],
    children,
  };
}

function optionValue(variant: RawVariant, title: string): string {
  return variant.options?.find((o) => o.option?.title === title)?.value ?? "";
}

export function mapVariant(raw: RawVariant): CatalogVariant {
  return {
    id: raw.id,
    sku: raw.sku ?? null,
    title: raw.title,
    sizeLabel: optionValue(raw, SIZE_OPTION) || raw.title.split(" · ")[0],
    materialLabel: optionValue(raw, MATERIAL_OPTION) || raw.title.split(" · ")[1] || "",
    sizeCode: raw.metadata?.size_code ?? null,
    materialCode: raw.metadata?.material_code ?? null,
    sheetMm: raw.metadata?.sheet_mm ?? null,
    price: Math.round(Number(raw.calculated_price?.calculated_amount ?? 0)),
  };
}

function images(raw: RawProduct): CatalogImage[] {
  const alts = raw.metadata?.image_alts ?? [];
  const list = raw.images?.length ? raw.images.map((i) => i.url) : raw.thumbnail ? [raw.thumbnail] : [];
  return list.map((url) => {
    const alt = alts.find((a) => a.url === url);
    return { url, alt: alt?.uk ?? raw.title, kind: alt?.kind ?? "photo" };
  });
}

export function mapProductCard(raw: RawProduct): CatalogProductCard {
  const variants = (raw.variants ?? []).map(mapVariant).filter((v) => v.price > 0);
  const sizes = raw.options?.find((o) => o.title === SIZE_OPTION)?.values?.length ?? new Set(variants.map((v) => v.sizeLabel)).size;
  const materials = raw.options?.find((o) => o.title === MATERIAL_OPTION)?.values?.map((v) => v.value) ?? [...new Set(variants.map((v) => v.materialLabel))];
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    subtitle: raw.subtitle ?? "",
    images: images(raw),
    minPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : raw.metadata?.min_price_uah ?? 0,
    sizeCount: sizes,
    hit: !!raw.metadata?.hit,
    kind: raw.metadata?.catalog_type ?? "ready",
    categoryHandles: (raw.categories ?? []).map((c) => c.handle),
    materialLabels: materials,
  };
}

export function mapProduct(raw: RawProduct): CatalogProduct {
  const card = mapProductCard(raw);
  const variants = (raw.variants ?? []).map(mapVariant).filter((v) => v.price > 0);
  const sizeOrder = raw.options?.find((o) => o.title === SIZE_OPTION)?.values?.map((v) => v.value) ?? [...new Set(variants.map((v) => v.sizeLabel))];
  const details = raw.metadata?.size_details ?? {};
  const blocks = raw.metadata?.blocks?.uk ?? {};
  return {
    ...card,
    descriptionHtml: raw.description ?? "",
    features: raw.metadata?.features?.uk ?? [],
    faq: raw.metadata?.faq?.uk ?? [],
    // Empty SEO fields from «Простий кабінет» fall back to the title and short text.
    seo: { title: raw.metadata?.seo?.uk?.title || raw.title, description: raw.metadata?.seo?.uk?.description || card.subtitle },
    sizes: sizeOrder.map((label) => ({ label, detail: details[label]?.uk ?? "" })),
    materials: card.materialLabels,
    variants,
    blocks: Object.entries(blocks).map(([slot, b]) => ({ slot, title: b.title, html: b.html })),
    relatedHandles: raw.metadata?.related_handles ?? [],
    fields: (raw.metadata?.fields ?? []).map((f) => ({ key: f.key, label: f.uk, placeholder: f.def })),
    availability: raw.metadata?.availability === "on_order" || raw.metadata?.availability === "out_of_stock" ? raw.metadata.availability : "in_stock",
  };
}
