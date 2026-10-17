// Vector layouts are limited to MAX_VECTOR_NODES nodes (plan step 8.4): above that the laser
// software slows down and such files are almost always traced pictures that need redrawing.
// Only SVG and DXF are counted; other formats are limited by size (25 MB) only.

import { dxfNodes } from "./dxf-nodes";
import { svgNodes } from "./svg-nodes";

export const MAX_VECTOR_NODES = 10_000;

/** Null when the file is within the limit, otherwise the customer message in Ukrainian. */
export function vectorNodeProblem(ext: string, buf: Buffer): string | null {
  const nodes = ext === "svg" ? svgNodes(buf.toString("utf8")) : ext === "dxf" ? dxfNodes(buf.toString("latin1")) : null;
  if (nodes === null || nodes <= MAX_VECTOR_NODES) return null;
  return `У макеті ${nodes.toLocaleString("uk-UA")} вузлів, а ми приймаємо до ${MAX_VECTOR_NODES.toLocaleString("uk-UA")}. `
    + "Спростіть контури (в Illustrator: Обʼєкт → Контур → Спростити) або напишіть нам у Viber.";
}
