"use client";
// Constructor state (Zustand) with saved layouts («Мої макети», research/lichnyi-kabinet.md §3).
// The browser keeps the draft and saved layouts in localStorage (works without login);
// after login the account API takes over and the same objects are stored in Medusa.
// Price here is the live preview only: the server recalculates it before the order
// (verifyClientPrice in lib/stencil-math.ts), discounts come from the server too.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  DEFAULT_PRICING, MATERIALS, calculateStencilPrice, checkDesign, computeMetrics, generateBridges, sheetForDesign,
  type StencilPriceResult,
} from "../lib/stencil-math";
import type {
  ComplexityFactor, DesignCheck, MaterialType, SectionTheme, Shape, StencilVectorMetrics, SurfaceKind, VectorDesign,
} from "../types/customizer";

/** What the customer chose: everything needed to rebuild the stencil exactly. */
export interface CustomizerInput {
  section: SectionTheme;
  source: VectorDesign["source"];
  text: string;
  fontFamily: string;
  materialId: MaterialType;
  colourId?: string;
  shape: Shape;
  widthMm: number;
  marginMm: number;
  quantity: number;
  surface: SurfaceKind;
  complexity: ComplexityFactor;
  /** Contours in mm (from the font outline or the uploaded SVG/DXF), bridges included. */
  design: VectorDesign;
  capHeightMm?: number;
}

/** A saved layout: the input plus a small preview for the list. */
export interface SavedLayout {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  input: CustomizerInput;
  previewSvg?: string; // small, watermarked; never the cut file
  /** Set once the layout has been paid in an order: then the cut file can be downloaded. */
  paidOrderId?: string;
}

interface Derived {
  heightMm: number;
  metrics: StencilVectorMetrics;
  price: StencilPriceResult;
  checks: DesignCheck[];
}

export interface CustomizerStore extends CustomizerInput, Derived {
  layouts: SavedLayout[];
  activeLayoutId: string | null;
  set: (patch: Partial<CustomizerInput>) => void;
  setDesign: (design: VectorDesign, capHeightMm?: number) => void;
  saveLayout: (name?: string, previewSvg?: string) => string;
  loadLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  removeLayout: (id: string) => void;
  reset: () => void;
}

const MAX_LOCAL_LAYOUTS = 50;

const EMPTY_DESIGN: VectorDesign = { source: "text", contours: [], bridges: [], bboxMm: { w: 1, h: 1 } };

const DEFAULT_INPUT: CustomizerInput = {
  section: "sweet",
  source: "text",
  text: "",
  fontFamily: "Caveat",
  materialId: "pet_thin",
  shape: "rect",
  widthMm: 300,
  marginMm: 15,
  quantity: 1,
  surface: "cake",
  complexity: 1,
  design: EMPTY_DESIGN,
};

/** Recomputes size, metrics, checks and the preview price from the input. Pure. */
export function derive(input: CustomizerInput): Derived {
  const m = MATERIALS[input.materialId];
  const sheet = input.shape === "circle"
    ? { shape: "circle" as const, widthMm: input.widthMm, heightMm: input.widthMm }
    : sheetForDesign(input.design, input.widthMm, input.marginMm);
  const design = input.design.bridges.length || input.design.stencilFont
    ? input.design
    : { ...input.design, bridges: generateBridges(input.design, DEFAULT_PRICING) };
  const metrics = computeMetrics(design, sheet, m);
  return {
    heightMm: sheet.heightMm,
    metrics,
    price: calculateStencilPrice(metrics, m, input.quantity, input.complexity, DEFAULT_PRICING),
    checks: checkDesign(design, sheet, m, input.capHeightMm, DEFAULT_PRICING),
  };
}

const pickInput = (s: CustomizerInput): CustomizerInput => ({
  section: s.section, source: s.source, text: s.text, fontFamily: s.fontFamily, materialId: s.materialId, colourId: s.colourId,
  shape: s.shape, widthMm: s.widthMm, marginMm: s.marginMm, quantity: s.quantity, surface: s.surface, complexity: s.complexity,
  design: s.design, capHeightMm: s.capHeightMm,
});

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

export const useCustomizer = create<CustomizerStore>()(
  persist(
    (setState, get) => ({
      ...DEFAULT_INPUT,
      ...derive(DEFAULT_INPUT),
      layouts: [],
      activeLayoutId: null,

      set: (patch) => {
        const input = { ...pickInput(get()), ...patch };
        input.quantity = Math.max(1, Math.min(9999, Math.round(input.quantity)));
        setState({ ...patch, quantity: input.quantity, ...derive(input) });
      },

      setDesign: (design, capHeightMm) => {
        const input = { ...pickInput(get()), design, capHeightMm, source: design.source };
        setState({ design, capHeightMm, source: design.source, ...derive(input) });
      },

      saveLayout: (name, previewSvg) => {
        const s = get(), now = new Date().toISOString(), input = pickInput(s);
        const existing = s.activeLayoutId ? s.layouts.find((l) => l.id === s.activeLayoutId) : undefined;
        if (existing) {
          setState({ layouts: s.layouts.map((l) => (l.id === existing.id ? { ...l, name: name ?? l.name, input, previewSvg: previewSvg ?? l.previewSvg, updatedAt: now } : l)) });
          return existing.id;
        }
        const id = newId();
        const layout: SavedLayout = {
          id, createdAt: now, updatedAt: now, input, previewSvg,
          name: name ?? (`${input.text || "Макет"}, ${Math.round(input.widthMm / 10)} см`),
        };
        setState({ layouts: [layout, ...s.layouts].slice(0, MAX_LOCAL_LAYOUTS), activeLayoutId: id });
        return id;
      },

      loadLayout: (id) => {
        const l = get().layouts.find((x) => x.id === id);
        if (!l) return;
        // A material that was removed or is "on request" now: keep the layout, the checks will say so.
        setState({ ...l.input, activeLayoutId: id, ...derive(l.input) });
      },

      renameLayout: (id, name) =>
        setState({ layouts: get().layouts.map((l) => (l.id === id ? { ...l, name: name.trim().slice(0, 80) || l.name, updatedAt: new Date().toISOString() } : l)) }),

      removeLayout: (id) => {
        const s = get();
        setState({ layouts: s.layouts.filter((l) => l.id !== id), activeLayoutId: s.activeLayoutId === id ? null : s.activeLayoutId });
      },

      reset: () => setState({ ...DEFAULT_INPUT, ...derive(DEFAULT_INPUT), activeLayoutId: null }),
    }),
    {
      name: "tl-customizer",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // Only the input and the layouts are stored; metrics and price are recalculated on load,
      // so a price change in the admin is never hidden behind an old stored price.
      partialize: (s) => ({ ...pickInput(s), layouts: s.layouts, activeLayoutId: s.activeLayoutId }),
      merge: (stored, current) => {
        const s = { ...current, ...(stored as Partial<CustomizerStore>) };
        return { ...s, ...derive(pickInput(s)) };
      },
    },
  ),
);
