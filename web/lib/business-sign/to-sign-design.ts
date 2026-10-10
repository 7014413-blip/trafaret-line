// Turns a business sign and its layout into the common sign design (types/signage.ts): the base,
// one overlay layer per text line, the edge texts, the logo and the frame. The server prices it
// with priceSign (17 000 UAH/m² of the overall box); production rebuilds the cut from the layers,
// the logo comes from the uploaded file.

import type { BusinessSignDesign, BusinessSignLayout } from "../../types/business-sign";
import type { SignDesign, SignLayer } from "../../types/signage";

export function businessSignToSignDesign(design: BusinessSignDesign, layout: BusinessSignLayout): SignDesign {
  const layers: SignLayer[] = [];
  for (const line of layout.lines) {
    const source = design.lines[line.index];
    layers.push({
      id: `line-${line.index + 1}`, kind: "text", materialId: source.materialId, thicknessMm: 2,
      x: line.x + line.width / 2, y: line.y + line.height / 2,
      text: source.text.trim(), fontId: source.fontId, capHeightMm: Math.round(line.capMm * 10) / 10,
      bbox: { x: line.x, y: line.y, width: line.width, height: line.height },
    });
  }
  if (design.arc) {
    for (const arc of layout.arcs) {
      layers.push({
        id: `arc-${arc.position}`, kind: "arcText", materialId: design.arc.materialId, thicknessMm: 2, x: 0, y: 0,
        text: arc.position === "top" ? design.arc.top.trim() : design.arc.bottom.trim(), fontId: design.arc.fontId,
        capHeightMm: Math.round(arc.capMm * 10) / 10, arcPosition: arc.position,
      });
    }
  }
  if (design.logo && layout.logo) {
    layers.push({
      id: "logo", kind: "logoColor", materialId: design.logo.materialId, thicknessMm: 2,
      x: layout.logo.x + layout.logo.width / 2, y: layout.logo.y + layout.logo.height / 2,
      traced: design.logo.format === "raster",
      bbox: { x: layout.logo.x, y: layout.logo.y, width: layout.logo.width, height: layout.logo.height },
    });
  }
  if (design.frameMaterialId && layout.frame) {
    const inset = layout.frame.kind === "circle" ? layout.widthMm / 2 - layout.frame.r - layout.frame.stroke / 2 : layout.frame.x + layout.widthMm / 2 - layout.frame.stroke / 2;
    layers.push({
      id: "frame", kind: "frame", materialId: design.frameMaterialId, thicknessMm: 2, x: 0, y: 0,
      frameWidthMm: Math.round(layout.frame.stroke * 10) / 10, frameInsetMm: Math.round(inset * 10) / 10,
    });
  }
  return {
    mode: "sign",
    base: {
      shape: design.shape, widthMm: layout.widthMm, heightMm: layout.heightMm, direction: design.direction,
      materialId: design.baseMaterialId, thicknessMm: design.baseThicknessMm,
    },
    layers,
    options: { holes: design.holes, selfAdhesive: design.selfAdhesive, positioningStencil: design.positioningStencil, whiteLabel: false },
    quantity: design.quantity,
  };
}
