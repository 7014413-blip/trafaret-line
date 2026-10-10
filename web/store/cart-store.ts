"use client";
// Cart (Zustand + localStorage). Each line keeps what is needed to recompute the
// price (sheet size, material, quantity), so quantity changes re-apply the
// wholesale tiers. The server recomputes everything again before payment.

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MATERIALS } from "../lib/materials";
import { priceCatalogVariant, priceStencil, priceWelded } from "../lib/calculators/pricing";
import type { CartLine, MaterialType, SectionTheme } from "../types/customizer";
import type { OrderLineKind } from "../types/order";

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
  /** Customer layout file key (tl-upload). */
  uploadKey?: string;
  /** Catalogue product: Medusa variant id and its 1-piece price (the server re-reads it from the database). */
  variantId?: string;
  basePrice?: number;
  /** Everything production needs to rebuild the item (text, font, sizes, weld options). Stored in the order line metadata. */
  spec?: Record<string, unknown>;
};

type Stored = NewLine & { id: string };

const unit = (l: Pick<NewLine, "widthCm" | "heightCm" | "materialId" | "quantity" | "fixedPrice" | "kind" | "basePrice">) => {
  if (l.fixedPrice != null) return l.fixedPrice;
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
