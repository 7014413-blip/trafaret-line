// Production part of a «Вільне полотно» line: every text and shape element is rebuilt from the
// stored text, font, cap height and transform, and the canvas is analysed by the same code as
// in the editor (lib/geometry/canvas-analysis.ts): a stencil with bridges, or one solid piece.
// Problems the analysis finds go to the manager as warnings.

import type { CanvasElement, CanvasSettings } from "../../types/canvas";
import type { CanvasPartInput, ProductionPart } from "../../types/production";
import { analyzeCanvas } from "../geometry/canvas-analysis";
import { canvasTextOutline } from "../geometry/canvas-text";
import { CANVAS_SHAPE_SIZE_MM, shapeOutline } from "../geometry/shapes";
import { MATERIALS } from "../materials";
import { stencilThumbnailSvg } from "./cart-thumbnail";
import { pieceProductionPart } from "./piece-part";

export function canvasPart(input: CanvasPartInput): ProductionPart {
  const elements: CanvasElement[] = input.elements.map((element, i) => {
    if (element.kind === "text") {
      const outline = canvasTextOutline(element.font, element.text, element.capMm);
      return { id: `e${i}`, kind: "text", text: element.text, fontId: element.font.id, capMm: element.capMm, ...outline, transform: element.transform, locked: false };
    }
    const outline = shapeOutline(element.shape, CANVAS_SHAPE_SIZE_MM);
    return { id: `e${i}`, kind: "shape", shape: element.shape, ...outline, transform: element.transform, locked: false };
  });
  if (!elements.length) throw new Error("empty canvas");
  const settings: CanvasSettings = {
    sheetWidthMm: input.sheet.widthMm, sheetHeightMm: input.sheet.heightMm, marginMm: input.sheet.marginMm,
    gridMm: 5, snapToGrid: false, showGrid: false, materialId: input.materialId, result: input.result, autoJoin: input.autoJoin,
  };
  const analysis = analyzeCanvas(elements, settings);
  const warnings = [...new Set(analysis.issues.map((issue) => issue.message))];
  const material = MATERIALS[input.materialId];
  if (input.result === "piece") {
    if (!analysis.piece) throw new Error("canvas piece was not built");
    return pieceProductionPart(analysis.piece.shapes, "canvas-piece", material.colours[0]?.hex ?? material.look.face, warnings);
  }
  const sheet = { shape: "rect" as const, widthMm: input.sheet.widthMm, heightMm: input.sheet.heightMm };
  return {
    constructor: "canvas-stencil",
    part: { sheet, cutPaths: analysis.cut.cutPaths },
    previewSvg: stencilThumbnailSvg(sheet.widthMm, sheet.heightMm, analysis.cut.cutPaths, material.look.face),
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
    warnings,
  };
}
