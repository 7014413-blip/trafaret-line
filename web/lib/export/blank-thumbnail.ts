// Small SVG of a configured blank for the cart and checkout: the shape in its colour, drawn in
// a 100-unit box (the cart shows the shape, the title carries the size).

import type { BlankColour, BlankShape } from "../../types/blank";
import { blankShapePath, drawnSize } from "../blanks/shape-path";

export function blankThumbnailSvg(shape: BlankShape, widthMm: number, heightMm: number, colour: BlankColour): string {
  const unit = Math.max(widthMm, heightMm);
  const sheet = drawnSize(shape.aspect, (widthMm / unit) * 100, (heightMm / unit) * 100, shape.sizeMode);
  const x = (100 - sheet.w) / 2;
  const y = (100 - sheet.h) / 2;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -4 108 108" preserveAspectRatio="xMidYMid meet">`,
    `<path d="${blankShapePath(shape.id, sheet.w, sheet.h)}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" fill="${colour.hex}" stroke="#334155" stroke-width="1.2"/>`,
    "</svg>",
  ].join("");
}
