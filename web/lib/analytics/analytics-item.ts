// GA4 items of the cart and of a product page. Cart lines carry the unit price after the
// quantity discount; catalogue products are identified by their variant id (the same id
// the product feed uses as the group of variants), other products by their kind.

import type { AnalyticsItem } from "../../types/analytics";
import type { CatalogProduct, CatalogVariant } from "../../types/catalog";

export interface AnalyticsCartLine {
  key: string;
  title: string;
  kind?: string;
  variantId?: string;
  unitPrice: number;
  quantity: number;
}

const round2 = (n: number) => Math.round(n * 100) / 100;

export function cartLineItem(line: AnalyticsCartLine, index: number): AnalyticsItem {
  const kind = line.kind ?? "stencil";
  return {
    item_id: line.variantId ?? `${kind}:${line.key.slice(0, 60)}`,
    item_name: line.title.slice(0, 100),
    item_category: kind,
    price: round2(line.unitPrice),
    quantity: line.quantity,
    index,
  };
}

export function variantItem(product: Pick<CatalogProduct, "title">, variant: Pick<CatalogVariant, "id" | "sku" | "sizeLabel" | "materialLabel" | "price">, quantity = 1): AnalyticsItem {
  return {
    item_id: variant.sku || variant.id,
    item_name: product.title.slice(0, 100),
    item_category: "catalog",
    item_variant: `${variant.sizeLabel}, ${variant.materialLabel}`,
    price: round2(variant.price),
    quantity,
  };
}

/** Sum of the items, the «value» of an e-commerce event. */
export function itemsValue(items: readonly AnalyticsItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
}

/** The first products of a catalogue list (view_item_list), identified by their handle. */
export function listItems(cards: readonly { handle: string; title: string; minPrice: number }[], listName: string, count = 20): AnalyticsItem[] {
  return cards.slice(0, count).map((card, index) => ({
    item_id: card.handle,
    item_name: card.title.slice(0, 100),
    item_category: "catalog",
    item_list_name: listName,
    price: round2(card.minPrice),
    quantity: 1,
    index,
  }));
}
