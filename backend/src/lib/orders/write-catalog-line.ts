// Machine files of a catalogue stencil line: the cut of the ordered size comes from the master
// layout through the size cache (lib/masters/master-cut.ts), the order files add the INFO layer
// with the order, position, material and size. A set of several stencils gets one file per piece.

import fs from "node:fs/promises";
import path from "node:path";
import { productionFileName } from "../../shared/lib/export/production-name";
import { toLayeredDxf, toLayeredSvg } from "../../shared/lib/export/layers";
import { polygonsToPathData } from "../../shared/lib/geometry/svg-path";
import type { CatalogLineSource, MasterCutResult } from "../../types/masters";
import { masterCut } from "../masters/master-cut";
import { svgToPng } from "./svg-to-png";

export interface CatalogLineFiles {
  files: string[];
  previewSvg: string;
  article: string;
  fromCache: boolean;
}

/** Picture of the stencil: the sheet with its cut-outs. */
function previewOf(widthMm: number, heightMm: number, cutPaths: MasterCutResult["cut"]["pieces"][number]["cutPaths"]): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${widthMm} ${heightMm}" width="${widthMm}mm" height="${heightMm}mm">`
    + `<rect width="${widthMm}" height="${heightMm}" fill="#ffffff" stroke="#94a3b8" stroke-width="0.5"/>`
    + `<path d="${polygonsToPathData(cutPaths, 2)}" fill="#0f172a" fill-rule="evenodd"/></svg>`;
}

export async function writeCatalogLine(
  folder: string,
  orderNumber: string,
  position: number,
  source: CatalogLineSource,
  info: (materialId: string, widthMm: number, heightMm: number) => string[],
  cutter: (source: CatalogLineSource) => Promise<MasterCutResult> = (s) => masterCut(s),
): Promise<CatalogLineFiles> {
  const { cut, fromCache } = await cutter(source);
  const { widthMm, heightMm } = cut.sheet;
  const files: string[] = [];
  let previewSvg = "";
  for (const [i, piece] of cut.pieces.entries()) {
    const name = productionFileName({ orderNumber, position, constructor: "catalog", materialId: source.materialCode, widthMm, heightMm });
    const base = cut.pieces.length > 1 ? `${name}_p${i + 1}` : name;
    const part = {
      sheet: { shape: "rect" as const, widthMm, heightMm },
      cutPaths: piece.cutPaths,
      label: `${orderNumber} #${position}`,
      info: [...info(source.materialCode, widthMm, heightMm), `Master: ${cut.article} ${source.sizeCode}${cut.pieces.length > 1 ? ` piece ${i + 1}/${cut.pieces.length}` : ""}`],
    };
    const picture = previewOf(widthMm, heightMm, piece.cutPaths);
    await fs.writeFile(path.join(folder, `${base}.svg`), toLayeredSvg(part));
    await fs.writeFile(path.join(folder, `${base}.dxf`), toLayeredDxf(part));
    await fs.writeFile(path.join(folder, `${base}.png`), svgToPng(picture));
    files.push(`${base}.svg`, `${base}.dxf`, `${base}.png`);
    if (!previewSvg) previewSvg = picture;
  }
  return { files, previewSvg, article: cut.article, fromCache };
}
