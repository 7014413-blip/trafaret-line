// Medusa Store API answers → catalogue shapes of the storefront (types/catalog.ts), in the page
// language. Medusa keeps the Ukrainian texts in its own fields and the translations in metadata
// (seo.ru, content.en, i18n.ru …); a missing translation falls back to Ukrainian. Size and
// material labels are translated the same way everywhere, so variants still match by label.
// Pure functions, so pages and tests use the same mapping.

import type {
  CatalogCategory, CatalogImage, CatalogProduct, CatalogProductCard, CatalogVariant, InLanguages, RawCategory, RawProduct, RawVariant,
} from "../../types/catalog";
import type { Locale } from "../../types/customizer";
import { fixCountAgreement } from "../text/count-agreement";
import { readHoleRules } from "./hole-rules";

const SIZE_OPTION = "Розмір";
const MATERIAL_OPTION = "Матеріал";

/** The Ukrainian text, or its translation for another language when there is one. */
const pick = <T>(uk: T, translated: T | undefined | null, locale: Locale): T => (locale !== "uk" && translated ? translated : uk);

/** The entry of the page language from per-language metadata, else the Ukrainian one. */
const inLanguage = <T>(texts: InLanguages<T> | undefined, locale: Locale): T | undefined => (locale !== "uk" ? texts?.[locale] : undefined) || texts?.uk;

export function mapCategory(raw: RawCategory, all: RawCategory[] = [], locale: Locale = "uk"): CatalogCategory {
  const parent = raw.parent_category ?? all.find((c) => c.id === raw.parent_category_id) ?? null;
  const seo = inLanguage(raw.metadata?.seo, locale);
  const content = inLanguage(raw.metadata?.content, locale);
  const name = pick(raw.name, locale !== "uk" ? raw.metadata?.i18n?.[locale]?.name : null, locale);
  const children = (raw.category_children ?? all.filter((c) => c.parent_category_id === raw.id))
    .map((child) => mapCategory({ ...child, parent_category: { id: raw.id, handle: raw.handle, name: raw.name } }, [], locale))
    .sort((a, b) => a.rank - b.rank);
  return {
    id: raw.id,
    handle: raw.handle,
    name,
    // Site URLs have no trailing slash (Next.js redirects "/food/" to "/food").
    path: (raw.metadata?.path ?? (parent ? `/${parent.handle}/${raw.handle.replace(`${parent.handle}-`, "")}` : `/${raw.handle}`)).replace(/\/+$/, "") || "/",
    parentHandle: parent?.handle ?? null,
    rank: raw.rank ?? 0,
    image: raw.metadata?.image ?? null,
    seo: {
      title: fixCountAgreement(seo?.title ?? name),
      description: fixCountAgreement(seo?.description ?? raw.description ?? ""),
      h1: fixCountAgreement(seo?.h1 ?? name),
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

/** Option title → Ukrainian value → value in the page language (identity for Ukrainian). */
type OptionLabels = (option: string, value: string) => string;

function optionLabels(raw: RawProduct | null, locale: Locale): OptionLabels {
  const maps = locale !== "uk" ? raw?.metadata?.i18n?.[locale]?.options ?? {} : {};
  return (option, value) => maps[option]?.[value] || value;
}

export function mapVariant(raw: RawVariant, label: OptionLabels = (_, value) => value, locale: Locale = "uk"): CatalogVariant {
  const size = optionValue(raw, SIZE_OPTION) || raw.title.split(" · ")[0];
  const material = optionValue(raw, MATERIAL_OPTION) || raw.title.split(" · ")[1] || "";
  return {
    id: raw.id,
    sku: raw.sku ?? null,
    title: pick(raw.title, locale === "ru" ? raw.metadata?.title_ru : locale === "en" ? raw.metadata?.title_en : null, locale),
    sizeLabel: label(SIZE_OPTION, size),
    materialLabel: label(MATERIAL_OPTION, material),
    sizeCode: raw.metadata?.size_code ?? null,
    materialCode: raw.metadata?.material_code ?? null,
    sheetMm: raw.metadata?.sheet_mm ?? null,
    price: Math.round(Number(raw.calculated_price?.calculated_amount ?? 0)),
  };
}

function images(raw: RawProduct, title: string, locale: Locale): CatalogImage[] {
  const alts = raw.metadata?.image_alts ?? [];
  const list = raw.images?.length ? raw.images.map((i) => i.url) : raw.thumbnail ? [raw.thumbnail] : [];
  return list.map((url) => {
    const alt = alts.find((a) => a.url === url);
    return { url, alt: (alt ? pick(alt.uk, locale === "uk" ? null : alt[locale], locale) : "") || title, kind: alt?.kind ?? "photo" };
  });
}

function variantsOf(raw: RawProduct, locale: Locale): CatalogVariant[] {
  const label = optionLabels(raw, locale);
  return (raw.variants ?? []).map((v) => mapVariant(v, label, locale)).filter((v) => v.price > 0);
}

export function mapProductCard(raw: RawProduct, locale: Locale = "uk"): CatalogProductCard {
  const translation = locale !== "uk" ? raw.metadata?.i18n?.[locale] : undefined;
  const label = optionLabels(raw, locale);
  const title = translation?.title || raw.title;
  const variants = variantsOf(raw, locale);
  const sizes = raw.options?.find((o) => o.title === SIZE_OPTION)?.values?.length ?? new Set(variants.map((v) => v.sizeLabel)).size;
  const materials = raw.options?.find((o) => o.title === MATERIAL_OPTION)?.values?.map((v) => label(MATERIAL_OPTION, v.value)) ?? [...new Set(variants.map((v) => v.materialLabel))];
  return {
    id: raw.id,
    handle: raw.handle,
    title,
    subtitle: translation?.subtitle || (raw.subtitle ?? ""),
    images: images(raw, title, locale),
    minPrice: variants.length ? Math.min(...variants.map((v) => v.price)) : raw.metadata?.min_price_uah ?? 0,
    sizeCount: sizes,
    hit: !!raw.metadata?.hit,
    isNew: raw.metadata?.is_new === true,
    kind: raw.metadata?.catalog_type ?? "ready",
    categoryHandles: (raw.categories ?? []).map((c) => c.handle),
    materialLabels: materials,
  };
}

/** Only a path on this site ("/vyvisky/vkazivnyky"): a constructor link never leaves the site. */
function sitePath(value: string | null | undefined): string | null {
  return value && /^\/[a-z0-9/-]+$/.test(value) ? value : null;
}

export function mapProduct(raw: RawProduct, locale: Locale = "uk"): CatalogProduct {
  const card = mapProductCard(raw, locale);
  const meta = raw.metadata;
  const translation = locale !== "uk" ? meta?.i18n?.[locale] : undefined;
  const label = optionLabels(raw, locale);
  const variants = variantsOf(raw, locale);
  const ukSizes = raw.options?.find((o) => o.title === SIZE_OPTION)?.values?.map((v) => v.value);
  const details = meta?.size_details ?? {};
  const blocks = inLanguage(meta?.blocks, locale) || {};
  const seo = inLanguage(meta?.seo, locale);
  return {
    ...card,
    descriptionHtml: translation?.description || (raw.description ?? ""),
    features: inLanguage(meta?.features, locale) || [],
    faq: inLanguage(meta?.faq, locale) || [],
    // Empty SEO fields from «Простий кабінет» fall back to the title and short text.
    seo: { title: seo?.title || card.title, description: seo?.description || card.subtitle },
    sizes: ukSizes
      ? ukSizes.map((uk) => ({ label: label(SIZE_OPTION, uk), detail: pick(details[uk]?.uk ?? "", locale === "uk" ? null : details[uk]?.[locale], locale) }))
      : [...new Set(variants.map((v) => v.sizeLabel))].map((size) => ({ label: size, detail: "" })),
    materials: card.materialLabels,
    variants,
    blocks: Object.entries(blocks).map(([slot, b]) => ({ slot, title: b.title, html: b.html })),
    relatedHandles: raw.metadata?.related_handles ?? [],
    fields: (raw.metadata?.fields ?? []).map((f) => ({ key: f.key, label: pick(f.uk, locale === "uk" ? null : f[locale], locale), placeholder: (locale === "en" && f.def_en) || f.def })),
    availability: raw.metadata?.availability === "on_order" || raw.metadata?.availability === "out_of_stock" ? raw.metadata.availability : "in_stock",
    hole: readHoleRules(raw.metadata?.hole),
    monogram: raw.metadata?.monogram?.styles?.length ? { styles: raw.metadata.monogram.styles } : null,
    constructorPath: sitePath(raw.metadata?.constructor_path),
  };
}
