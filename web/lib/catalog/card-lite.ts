// Catalogue shapes trimmed for the browser (QA 2026-10-10, M10): product cards of grids
// and rails, categories of menus. Only what is drawn travels in the page.

import type { CatalogCardLite, CatalogCategory, CatalogProductCard, CategoryLink } from "../../types/catalog";

export function toCardLite(card: CatalogProductCard): CatalogCardLite {
  const first = card.images[0] ?? null;
  return {
    handle: card.handle,
    title: card.title,
    // The card title is right under the photo: an alt that repeats it is dropped (decorative).
    image: first ? { url: first.url, alt: first.alt && first.alt !== card.title ? first.alt : "" } : null,
    minPrice: card.minPrice,
    sizeCount: card.sizeCount,
    hit: card.hit,
    kind: card.kind,
    materialLabels: card.materialLabels,
  };
}

export function toCategoryLink(category: CatalogCategory): CategoryLink {
  return {
    handle: category.handle,
    name: category.name,
    path: category.path,
    children: category.children.map((c) => ({ handle: c.handle, name: c.name, path: c.path })),
  };
}
