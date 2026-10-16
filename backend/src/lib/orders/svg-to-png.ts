// PNG preview of a production part or of the constructor's own picture of the line, for the
// order page and the workshop. resvg draws SVG without scripts and without loading anything
// from the network.

import { Resvg } from "@resvg/resvg-js";

/** Largest SVG drawn: a production part of a big stencil, or the constructor's picture of a line. */
const MAX_SVG_CHARS = 5_000_000;

export function svgToPng(svg: string, widthPx = 1200): Buffer {
  if (svg.length > MAX_SVG_CHARS) throw new Error("preview SVG is too large");
  const resvg = new Resvg(svg, { fitTo: { mode: "width", value: widthPx }, background: "#ffffff", font: { loadSystemFonts: false } });
  return resvg.render().asPng();
}
