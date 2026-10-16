// Production part of a «Свій напис» stencil: the text is laid out with the customer's fonts,
// placed on the paid sheet and cut with bridges by the same code as in the constructor
// (lib/geometry/stencil-request.ts, lib/geometry/bridges.ts).

import type { SheetSize } from "../../types/customizer";
import type { ProductionPart, TextStencilInput } from "../../types/production";
import { designPlacement } from "../calculators/design-fit";
import { sheetForDesign } from "../calculators/geometry";
import { buildStencilCut } from "../geometry/bridges";
import { designGroupsMm, stencilCutOptions } from "../geometry/stencil-request";
import { MATERIALS } from "../materials";
import { textToDesign } from "../text/text-layout";
import { stencilThumbnailSvg } from "./cart-thumbnail";

export function textStencilPart(input: TextStencilInput): ProductionPart {
  const layout = textToDesign(input.font, input.text, { align: input.align, upper: input.upper, lineFonts: input.lineFonts });
  if (!layout.design.contours.length) throw new Error("empty text");
  if (layout.missing.length) throw new Error(`font has no glyphs for: ${layout.missing.join(" ")}`);
  const sheet: SheetSize = input.square
    ? { shape: "square", widthMm: input.widthMm, heightMm: input.widthMm }
    : sheetForDesign(layout.design, input.widthMm, input.marginMm);
  const { scale } = designPlacement(layout.design, input.widthMm, input.marginMm, input.square);
  const options = stencilCutOptions(sheet, layout.capUnits * scale, input.materialId, input.bridgeStrength, layout.design.stencilFont);
  const cut = buildStencilCut(designGroupsMm(layout.design, input.widthMm, input.marginMm, input.square), options);
  const warnings: string[] = [];
  const loose = cut.islands.filter((island) => !island.connected).length;
  if (loose) warnings.push(`Внутрішніх деталей без перемички: ${loose}. Перевірте макет перед різанням`);
  const thin = cut.thinZones.filter((zone) => zone.kind === "material").length;
  if (thin) warnings.push(`Тонких місць матеріалу: ${thin} (покупець бачив попередження)`);
  return {
    constructor: input.square ? "square-stencil" : "stencil",
    part: { sheet, cutPaths: cut.cutPaths },
    previewSvg: stencilThumbnailSvg(sheet.widthMm, sheet.heightMm, cut.cutPaths, MATERIALS[input.materialId].look.face),
    widthMm: sheet.widthMm,
    heightMm: sheet.heightMm,
    warnings,
  };
}
