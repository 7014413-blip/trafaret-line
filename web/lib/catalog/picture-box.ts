// Size of the picture on a catalogue stencil sheet, from the size description the catalogue
// keeps for every size («малюнок 30 × 30 см, аркуш 33 × 33 см», «малюнок Ø16 см, …»,
// «напис до 40 см, …»). The master layout is scaled to fit this box. A description without the
// picture size («набір на аркуші 21 × 29,7 см») leaves the sheet minus the usual margin.

import { CONSTRUCTOR_CONFIG } from "../geometry/config";

const NUMBER = String.raw`(\d+(?:[.,]\d+)?)`;
const BOX = new RegExp(`${NUMBER}\\s*[×x]\\s*${NUMBER}\\s*см`);
const SIDE = new RegExp(`(?:Ø\\s*|діаметр\\s+|до\\s+)?${NUMBER}\\s*см`);

const cm = (value: string) => Number(value.replace(",", ".")) * 10;

export function pictureBoxMm(
  detail: string,
  sheetMm: readonly [number, number],
  marginMm: number = CONSTRUCTOR_CONFIG.sheetMarginMm,
): { widthMm: number; heightMm: number } {
  const [sheetW, sheetH] = sheetMm;
  const fallback = { widthMm: Math.max(1, sheetW - 2 * marginMm), heightMm: Math.max(1, sheetH - 2 * marginMm) };
  // Only the part before the sheet size describes the picture.
  const head = detail.split("аркуш")[0];
  const box = BOX.exec(head);
  const side = box ? null : SIDE.exec(head);
  const [w, h] = box ? [cm(box[1]), cm(box[2])] : side ? [cm(side[1]), cm(side[1])] : [0, 0];
  if (!(w > 0 && h > 0)) return fallback;
  return { widthMm: Math.min(w, sheetW), heightMm: Math.min(h, sheetH) };
}
