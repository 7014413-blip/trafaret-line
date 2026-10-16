// What the stencil cut is built from: the design contours placed on the sheet, and the cut
// options (bridge width by the letter height, thin places by the material). One code for the
// constructor «Свій напис» (store/customizer-store.ts) and for the production files on the
// server (lib/export/text-stencil-part.ts), so the machine cuts what the customer saw.

import type { MaterialType, SheetSize, VectorDesign } from "../../types/customizer";
import type { BridgeStrength, Polygon, StencilCutOptions, Vec2 } from "../../types/geometry";
import { designPlacement } from "../calculators/design-fit";
import { minMaterialMm } from "./config";
import { bridgeWidthFor, DEFAULT_LASER, laserFor } from "./laser-config";

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

/** Cut options of a stencil sheet: bridges follow the letter height, thin places the material. */
export function stencilCutOptions(sheet: SheetSize, capHeightMm: number, materialId: MaterialType, strength: BridgeStrength, stencilFont = false): StencilCutOptions {
  return {
    bridgeWidthMm: bridgeWidthFor(capHeightMm, DEFAULT_LASER, strength),
    skipBridges: stencilFont,
    sheet: [[0, 0], [sheet.widthMm, 0], [sheet.widthMm, sheet.heightMm], [0, sheet.heightMm]],
    // Thin places are judged by the material: PET 1.5, acrylic 2, mirror 3 mm.
    config: laserFor(minMaterialMm(materialId)),
  };
}
