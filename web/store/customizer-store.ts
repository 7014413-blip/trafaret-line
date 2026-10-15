"use client";
// Constructor state (Zustand) with saved layouts («Мої макети», research/lichnyi-kabinet.md §3).
// The browser keeps the draft and saved layouts in localStorage (works without login);
// after login the account API takes over and the same objects are stored in Medusa.
// Price here is the live preview only: the server recalculates it before the order
// (lib/calculators/pricing.ts runs on both sides), discounts come from the server too.
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { MATERIALS } from "../lib/materials";
import { sheetForDesign } from "../lib/calculators/geometry";
import { designPlacement } from "../lib/calculators/design-fit";
import { DEFAULT_PRICING, calculateStencilPrice, type StencilPriceResult } from "../lib/calculators/pricing";
import { computeMetrics } from "../lib/calculators/cut-metrics";
import { checkDesign } from "../lib/calculators/design-check";
import { bridgeWidthFor, DEFAULT_LASER, laserFor } from "../lib/geometry/laser-config";
import { minMaterialMm } from "../lib/geometry/config";
import type {
  ComplexityFactor, DesignCheck, MaterialType, SectionTheme, Shape, SheetSize, StencilVectorMetrics, SurfaceKind, VectorDesign,
} from "../types/customizer";
import type { BridgeStrength, Polygon, StencilCutOptions, StencilCutResult, Vec2 } from "../types/geometry";

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
  /** «Перемички: тонкі / звичайні / міцні»: bridge width multiplier (ТЗ v0.9 §3.1). */
  bridgeStrength: BridgeStrength;
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

/** Derived values plus cutKeyFor() of the input the cut belongs to. */
type Derived = DerivedValues & { cutKey: string | null };

interface DerivedValues {
  heightMm: number;
  sheet: SheetSize;
  /** Final cut in sheet millimetres (bridges applied), null while there is no design. */
  cut: StencilCutResult | null;
  metrics: StencilVectorMetrics;
  price: StencilPriceResult;
  checks: DesignCheck[];
}

export interface CustomizerStore extends CustomizerInput, Derived {
  layouts: SavedLayout[];
  activeLayoutId: string | null;
  set: (patch: Partial<CustomizerInput>) => void;
  setDesign: (design: VectorDesign, capHeightMm?: number) => void;
  /** Result from the geometry worker; ignored when the input changed meanwhile. */
  setCut: (key: string, cut: StencilCutResult) => void;
  saveLayout: (name?: string, previewSvg?: string) => string;
  loadLayout: (id: string) => void;
  renameLayout: (id: string, name: string) => void;
  removeLayout: (id: string) => void;
  reset: () => void;
}

const MAX_LOCAL_LAYOUTS = 50;

const EMPTY_DESIGN: VectorDesign = { source: "text", contours: [], bboxMm: { w: 1, h: 1 } };

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
  bridgeStrength: "normal",
};

/**
 * Design contours (layout units) grouped per glyph, scaled to the sheet and moved inside the
 * margin; on a square sheet the design is fitted and centred (lib/calculators/design-fit.ts).
 */
export function designGroupsMm(design: VectorDesign, widthMm: number, marginMm: number, square = false): Polygon[][] {
  const { scale, dx, dy } = designPlacement(design, widthMm, marginMm, square);
  const groups = new Map<number, Polygon[]>();
  // Contours without a group (uploaded files, layouts saved before groups existed) form one
  // even-odd group, so their holes still come out right.
  design.contours.forEach((contour) => {
    const key = contour.group ?? -1;
    const list = groups.get(key) ?? [];
    list.push(contour.points.map(([x, y]) => [x * scale + dx, y * scale + dy] as Vec2));
    groups.set(key, list);
  });
  return [...groups.values()];
}

/** Stable number per design object: the cut is recomputed only when the outline really changes. */
const designIds = new WeakMap<VectorDesign, number>();
let designSeq = 0;
function designKey(design: VectorDesign): number {
  let id = designIds.get(design);
  if (id == null) {
    id = ++designSeq;
    designIds.set(design, id);
  }
  return id;
}

/** Sheet of the current input. */
export function sheetFor(input: CustomizerInput): SheetSize {
  if (input.shape === "circle") return { shape: "circle", widthMm: input.widthMm, heightMm: input.widthMm };
  if (input.shape === "square") return { shape: "square", widthMm: input.widthMm, heightMm: input.widthMm };
  return sheetForDesign(input.design, input.widthMm, input.marginMm);
}

/** Identifies the geometry a cut was computed for (outline, width, margin, cap height). */
export function cutKeyFor(input: CustomizerInput): string {
  return `${designKey(input.design)}|${input.shape}|${input.widthMm}|${input.marginMm}|${(input.capHeightMm ?? 0).toFixed(2)}|${input.bridgeStrength}|${minMaterialMm(input.materialId)}`;
}

/** What the geometry worker needs to build the cut of this input; null without a design. */
export function cutRequestFor(input: CustomizerInput): { key: string; groups: Polygon[][]; options: StencilCutOptions } | null {
  if (!input.design.contours.length) return null;
  const sheet = sheetFor(input);
  const outline: Polygon = [[0, 0], [sheet.widthMm, 0], [sheet.widthMm, sheet.heightMm], [0, sheet.heightMm]];
  return {
    key: cutKeyFor(input),
    groups: designGroupsMm(input.design, input.widthMm, input.marginMm, input.shape === "square"),
    options: {
      bridgeWidthMm: bridgeWidthFor(input.capHeightMm ?? 0, DEFAULT_LASER, input.bridgeStrength ?? "normal"),
      skipBridges: input.design.stencilFont,
      sheet: outline,
      // Thin places are judged by the material: PET 1.5, acrylic 2, mirror 3 mm.
      config: laserFor(minMaterialMm(input.materialId)),
    },
  };
}

/** Recomputes size, metrics, checks and the preview price; `cut` is the worker result for this input or null. */
export function derive(input: CustomizerInput, cut: StencilCutResult | null): DerivedValues {
  const material = MATERIALS[input.materialId];
  const sheet = sheetFor(input);
  const metrics = computeMetrics(cut, input.design, sheet, material);
  return {
    heightMm: sheet.heightMm,
    sheet,
    cut,
    metrics,
    price: calculateStencilPrice(metrics, material, input.quantity, input.complexity, DEFAULT_PRICING),
    checks: checkDesign(input.design, sheet, material, input.capHeightMm, cut, DEFAULT_PRICING),
  };
}
const pickInput = (s: CustomizerInput): CustomizerInput => ({
  section: s.section, source: s.source, text: s.text, fontFamily: s.fontFamily, materialId: s.materialId, colourId: s.colourId,
  shape: s.shape, widthMm: s.widthMm, marginMm: s.marginMm, quantity: s.quantity, surface: s.surface, complexity: s.complexity,
  design: s.design, capHeightMm: s.capHeightMm, bridgeStrength: s.bridgeStrength ?? "normal",
});

/** Keeps the current cut when the geometry did not change (quantity, material), drops it otherwise. */
function withCut(input: CustomizerInput, state: Derived): Derived {
  const key = cutKeyFor(input);
  const cut = state.cutKey === key ? state.cut : null;
  return { ...derive(input, cut), cutKey: cut ? key : null };
}

const newId = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `l${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`);

export const useCustomizer = create<CustomizerStore>()(
  persist(
    (setState, get) => ({
      ...DEFAULT_INPUT,
      ...derive(DEFAULT_INPUT, null),
      cutKey: null,
      layouts: [],
      activeLayoutId: null,

      set: (patch) => {
        const input = { ...pickInput(get()), ...patch };
        input.quantity = Math.max(1, Math.min(9999, Math.round(input.quantity)));
        setState({ ...patch, quantity: input.quantity, ...withCut(input, get()) });
      },

      setDesign: (design, capHeightMm) => {
        const input = { ...pickInput(get()), design, capHeightMm, source: design.source };
        setState({ design, capHeightMm, source: design.source, ...withCut(input, get()) });
      },

      setCut: (key, cut) => {
        const input = pickInput(get());
        if (cutKeyFor(input) !== key) return;
        setState({ ...derive(input, cut), cutKey: key });
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
        setState({ ...l.input, activeLayoutId: id, ...derive(l.input, null), cutKey: null });
      },

      renameLayout: (id, name) =>
        setState({ layouts: get().layouts.map((l) => (l.id === id ? { ...l, name: name.trim().slice(0, 80) || l.name, updatedAt: new Date().toISOString() } : l)) }),

      removeLayout: (id) => {
        const s = get();
        setState({ layouts: s.layouts.filter((l) => l.id !== id), activeLayoutId: s.activeLayoutId === id ? null : s.activeLayoutId });
      },

      reset: () => setState({ ...DEFAULT_INPUT, ...derive(DEFAULT_INPUT, null), cutKey: null, activeLayoutId: null }),
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
        return { ...s, ...derive(pickInput(s), null), cutKey: null };
      },
    },
  ),
);
