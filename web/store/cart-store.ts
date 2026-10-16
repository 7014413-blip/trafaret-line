"use client";
// Cart (Zustand + localStorage). Each line keeps what is needed to recompute the
// price (sheet size, material, quantity), so quantity changes re-apply the
// wholesale tiers. The server recomputes everything again before payment.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MATERIALS } from "../lib/materials";
import { priceCatalogVariant, priceStencil, priceWelded } from "../lib/calculators/pricing";
import { pricePointerSign } from "../lib/pointer-sign/price";
import { priceOfficePlaque } from "../lib/office-plaque/price";
import type { CartLine, MaterialType, SectionTheme } from "../types/customizer";
import type { OrderLineKind } from "../types/order";
import type { PointerSignDesign } from "../types/pointer-sign";
import type { OfficePlaqueDesign } from "../types/office-plaque";
import type { JoinedWordsDesign } from "../types/joined-words";
import type { LayeredPlaqueDesign } from "../types/layered-plaque";
import type { InitialsDesign } from "../types/initials";
import type { StickLettersDesign } from "../types/stick-letters";
import type { BlankDesign } from "../types/blank";
import { priceBlankDesign } from "../lib/blanks/price";
import { LAYERED_PLAQUE_CONFIGS } from "../lib/layered-plaque/configs";
import { priceLayeredPlaque } from "../lib/layered-plaque/price";

export type NewLine = {
  key: string;            // same key = same item, quantities add up
  title: string;
  materialId: MaterialType;
  widthCm: number;
  heightCm: number;
  quantity: number;
  thumbnail?: string;
  section?: SectionTheme;
  vectorSvg?: string;
  /** Accessories (roller, glue): fixed price, not priced by area. */
  fixedPrice?: number;
  /** What the server prices: stencil by size × material, welded word by its size, sign by design, accessory by key. */
  kind?: OrderLineKind;
  sign?: unknown;
  /** Pointer sign design (kind "pointer"): the price follows the quantity, the server recomputes it. */
  pointer?: PointerSignDesign;
  /** Office plaque design (kind "plaque"), priced like pointer signs. */
  plaque?: OfficePlaqueDesign;
  /**
   * «Написи на планці» design (kind "words"). Its price needs the fonts to measure the pieces,
   * so the cart keeps the 1-set price it was added with (basePrice) and applies the quantity scale.
   */
  words?: JoinedWordsDesign;
  /** Two-layer plaque (kind "layered": floor, door, number); unit = one set of the series. */
  layered?: LayeredPlaqueDesign;
  /** Wedding cake initials (kind "initials"); priced like "words" from the stored base price. */
  initials?: InitialsDesign;
  /** Self-adhesive letters (kind "letters"); priced like "words" from the stored base price. */
  letters?: StickLettersDesign;
  /** Blank of the «/zahotovky» configurator (kind "blank"): priced by shape, size and sheet at the line quantity. */
  blank?: BlankDesign;
  /** Customer layout file key (tl-upload). */
  uploadKey?: string;
  /** Catalogue product: Medusa variant id and its 1-piece price (the server re-reads it from the database). */
  variantId?: string;
  basePrice?: number;
  /** Everything production needs to rebuild the item (text, font, sizes, weld options). Stored in the order line metadata. */
  spec?: Record<string, unknown>;
};

type Stored = NewLine & { id: string };

const unit = (l: Pick<NewLine, "widthCm" | "heightCm" | "materialId" | "quantity" | "fixedPrice" | "kind" | "basePrice" | "pointer" | "plaque" | "layered" | "blank">) => {
  if (l.fixedPrice != null) return l.fixedPrice;
  if (l.kind === "pointer" && l.pointer) {
    try {
      return pricePointerSign({ ...l.pointer, quantity: l.quantity }).unitPrice;
    } catch {
      // A design saved before the size list changed: keep the price it was added with;
      // the server refuses the line at checkout and the customer rebuilds it.
      return priceCatalogVariant(l.basePrice ?? 0, l.quantity);
    }
  }
  if (l.kind === "plaque" && l.plaque) {
    try {
      return priceOfficePlaque({ ...l.plaque, quantity: l.quantity }).unitPrice;
    } catch {
      // Saved before the size list changed: keep the price it was added with (see above).
      return priceCatalogVariant(l.basePrice ?? 0, l.quantity);
    }
  }
  if (l.kind === "layered" && l.layered) {
    try {
      return priceLayeredPlaque({ ...l.layered, quantity: l.quantity }, LAYERED_PLAQUE_CONFIGS[l.layered.kind]).unitPrice;
    } catch {
      // Saved before the size list changed: keep the price it was added with (see above).
      return priceCatalogVariant(l.basePrice ?? 0, l.quantity);
    }
  }
  if (l.kind === "blank" && l.blank) {
    try {
      return priceBlankDesign({ ...l.blank, quantity: l.quantity }).unitPrice;
    } catch {
      // A sheet taken off sale after the line was added: keep the price it was added with (see above).
      return priceCatalogVariant(l.basePrice ?? 0, l.quantity);
    }
  }
  if ((l.kind === "words" || l.kind === "initials" || l.kind === "letters") && l.basePrice != null) return priceCatalogVariant(l.basePrice, l.quantity);
  if (l.kind === "catalog" && l.basePrice != null) return priceCatalogVariant(l.basePrice, l.quantity);
  if (l.kind === "welded") return priceWelded(l.widthCm * 10, l.heightCm * 10, MATERIALS[l.materialId], l.quantity).unitPrice;
  return priceStencil({ shape: "rect", widthMm: l.widthCm * 10, heightMm: l.heightCm * 10 }, MATERIALS[l.materialId], l.quantity).unitPrice;
};

export const toCartLine = (l: Stored): CartLine => ({
  id: l.id, title: l.title, materialId: l.materialId, widthCm: l.widthCm, heightCm: l.heightCm, quantity: l.quantity,
  unitPrice: unit(l), thumbnail: l.thumbnail, section: l.section ?? "interior", vectorSvg: l.vectorSvg,
});

interface CartState {
  items: Stored[];
  open: boolean;
  add: (l: NewLine) => void;
  setQty: (id: string, q: number) => void;
  remove: (id: string) => void;
  clear: () => void;
  setOpen: (o: boolean) => void;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      open: false,
      add: (l) => {
        const ex = get().items.find((i) => i.key === l.key);
        set({
          items: ex ? get().items.map((i) => (i.key === l.key ? { ...i, quantity: i.quantity + l.quantity } : i)) : [...get().items, { ...l, id: l.key }],
          open: true,
        });
      },
      setQty: (id, q) => set({ items: get().items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, Math.min(9999, Math.round(q))) } : i)) }),
      remove: (id) => set({ items: get().items.filter((i) => i.id !== id) }),
      clear: () => set({ items: [] }),
      setOpen: (open) => set({ open }),
    }),
    { name: "tl-cart", version: 1, storage: createJSONStorage(() => localStorage), partialize: (s) => ({ items: s.items }) },
  ),
);

export const cartTotals = (items: Stored[]) => {
  const lines = items.map(toCartLine);
  return { lines, count: lines.reduce((s, l) => s + l.quantity, 0), total: lines.reduce((s, l) => s + l.unitPrice * l.quantity, 0) };
};
