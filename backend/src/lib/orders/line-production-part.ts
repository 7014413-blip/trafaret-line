// Machine part of one order line, rebuilt on the server from the stored spec and the
// customer's fonts with the same code as the constructors (shared/lib/export). Lines of other
// products (catalogue, blanks, signs, plaques, letters) and stencils made from the customer's
// own file have no part here: null. A line that cannot be rebuilt throws with the reason.

import type { MaterialType } from "../../shared/types/customizer";
import type { CanvasShapeKind, CanvasTransform } from "../../shared/types/canvas";
import type { BridgeStrength } from "../../shared/types/geometry";
import type { ProductionCanvasElement, ProductionPart, ProductionText } from "../../shared/types/production";
import type { LoadedFont } from "../../shared/types/text";
import { canvasPart } from "../../shared/lib/export/canvas-part";
import { textStencilPart } from "../../shared/lib/export/text-stencil-part";
import { weldedWordPart } from "../../shared/lib/export/welded-word-part";
import { MATERIALS } from "../../shared/lib/materials";
import { loadFontById } from "../text/node-fonts";
import { readMarginMm, readTextSpec, readWeldOptions, SpecError } from "../validation/constructor-size";

const STRENGTHS: BridgeStrength[] = ["thin", "normal", "strong"];
const SHAPES: CanvasShapeKind[] = ["circle", "rect", "star", "heart", "frame"];
/** Sheet assumed for «Цілим шматком» lines ordered before the canvas sheet was stored. */
const OPEN_SHEET = { widthMm: 4000, heightMm: 4000, marginMm: 0 };

type Spec = Record<string, unknown>;

function fontOf(id: string): LoadedFont {
  const font = loadFontById(id);
  if (!font) throw new SpecError(`шрифт ${id} не знайдено на сервері`);
  return font;
}

function productionText(spec: Spec): ProductionText {
  const text = readTextSpec(spec);
  return {
    text: text.text, font: fontOf(text.fontId), lineFonts: text.lineFontIds.map((id) => (id ? fontOf(id) : null)),
    align: text.align, upper: text.upper,
  };
}

const finite = (value: unknown, fallback: number) => (typeof value === "number" && Number.isFinite(value) ? value : fallback);

function readTransform(raw: unknown): CanvasTransform {
  const t = (raw && typeof raw === "object" ? raw : {}) as Partial<CanvasTransform>;
  return { x: finite(t.x, 0), y: finite(t.y, 0), scale: Math.min(100, Math.max(0.01, finite(t.scale, 1))), angle: finite(t.angle, 0) };
}

function canvasElements(spec: Spec): ProductionCanvasElement[] {
  const raw = Array.isArray(spec.elements) ? (spec.elements as Spec[]) : [];
  if (!raw.length || raw.length > 100) throw new SpecError("на полотні немає елементів");
  return raw.map((element) => {
    const transform = readTransform(element.transform);
    if (element.kind === "text" && typeof element.text === "string" && typeof element.fontId === "string") {
      return { kind: "text", transform, text: element.text.slice(0, 200), font: fontOf(element.fontId), capMm: Math.min(500, Math.max(1, finite(element.capMm, 30))) };
    }
    if (element.kind === "shape" && SHAPES.includes(element.shape as CanvasShapeKind)) {
      return { kind: "shape", transform, shape: element.shape as CanvasShapeKind };
    }
    throw new SpecError("на полотні є завантажений файл клієнта: ріжемо з його файлу");
  });
}

function canvasSheet(spec: Spec): { widthMm: number; heightMm: number; marginMm: number } {
  const sheet = spec.sheet as Partial<typeof OPEN_SHEET> | undefined;
  if (!sheet) return OPEN_SHEET;
  return { widthMm: finite(sheet.widthMm, OPEN_SHEET.widthMm), heightMm: finite(sheet.heightMm, OPEN_SHEET.heightMm), marginMm: finite(sheet.marginMm, 15) };
}

export function lineProductionPart(metadata: Record<string, unknown>): ProductionPart | null {
  const kind = metadata.kind;
  const spec = metadata.spec as Spec | null;
  if ((kind !== "stencil" && kind !== "welded") || !spec || spec.truncated) return null;
  const materialId = metadata.materialId as MaterialType;
  const material = MATERIALS[materialId];
  if (!material) throw new SpecError(`невідомий матеріал ${String(materialId)}`);
  if (spec.source === "free-canvas") {
    return canvasPart({
      sheet: canvasSheet(spec), elements: canvasElements(spec), materialId,
      result: kind === "welded" ? "piece" : "stencil", autoJoin: spec.autoJoin === true,
    });
  }
  if (typeof spec.text !== "string") return null;
  const widthMm = Math.round(finite(metadata.widthCm, 0) * 10);
  if (kind === "welded") {
    const colourHex = material.colours.find((c) => c.id === spec.colourId)?.hex ?? material.colours[0]?.hex ?? material.look.face;
    return weldedWordPart({ ...productionText(spec), widthMm, options: readWeldOptions(spec.weld), materialId, colourHex });
  }
  return textStencilPart({
    ...productionText(spec), widthMm, marginMm: readMarginMm(spec), square: spec.square === true,
    bridgeStrength: STRENGTHS.includes(spec.bridgeStrength as BridgeStrength) ? (spec.bridgeStrength as BridgeStrength) : "normal",
    materialId,
  });
}
