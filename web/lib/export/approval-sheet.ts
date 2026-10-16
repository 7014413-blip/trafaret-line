// «Лист погодження макета» (PLAN-RABOT шаг 8.1): one page with every made-to-layout line of
// the order, its picture, size and quantity, and the time the customer ticked «Макет
// перевірив». Text is drawn as outlines of the site font, so the PNG looks the same on any
// server without system fonts. The pictures are the constructors' own SVG, nested as is.

import type { ApprovalSheet } from "../../types/production";
import type { LoadedFont } from "../../types/text";
import { textToDesign } from "../text/text-layout";

const WIDTH = 1240;
const MARGIN = 60;
const ROW = 240;
const PREVIEW = 200;
const HEADER = 230;
const FOOTER = 110;
const INK = "#0f172a";
const MUTED = "#64748b";
const LINE = "#e2e8f0";
/** Characters per title line at the body size. */
const WRAP = 58;

const escapeAttr = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/**
 * Text as a filled path with its top-left corner at (x, top) and the given cap height, px;
 * with `centreIn` it is centred in a box of that width starting at x.
 */
function text(font: LoadedFont, value: string, x: number, top: number, capPx: number, colour: string, centreIn?: number): string {
  const layout = textToDesign(font, value.replace(/\s+/g, " ").trim() || " ", { align: "left" });
  if (!layout.pathData) return "";
  const k = capPx / Math.max(1, layout.capUnits);
  const left = centreIn ? x + (centreIn - layout.design.bboxMm.w * k) / 2 : x;
  return `<path d="${layout.pathData}" transform="translate(${left.toFixed(1)} ${top}) scale(${k.toFixed(5)})" fill="${colour}" fill-rule="nonzero"/>`;
}

/** Splits a title into lines of at most WRAP characters at spaces. */
function wrap(value: string): string[] {
  const lines: string[] = [];
  let current = "";
  for (const word of value.split(/\s+/).filter(Boolean)) {
    if (current && current.length + 1 + word.length > WRAP) {
      lines.push(current);
      current = word;
    } else {
      current = current ? `${current} ${word}` : word;
    }
  }
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

/** The constructor's picture placed in a box (its own viewBox keeps the proportions). */
function nested(svg: string, x: number, y: number, size: number): string {
  return svg.trim().replace(/^<svg\b/, `<svg x="${x}" y="${y}" width="${size}" height="${size}"`);
}

function approvedText(iso: string | null): string {
  if (!iso) return "Замовлення оформлено до появи галочки «Макет перевірив»";
  const at = new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Kyiv" }).format(new Date(iso));
  return `Покупець перевірив макет і поставив галочку «Макет перевірив»: ${at}`;
}

export function approvalSheetSvg(font: LoadedFont, sheet: ApprovalSheet): string {
  const height = HEADER + sheet.lines.length * ROW + FOOTER;
  const parts: string[] = [
    `<rect width="${WIDTH}" height="${height}" fill="#ffffff"/>`,
    text(font, "Лист погодження макета", MARGIN, 60, 34, INK),
    text(font, `Замовлення ${sheet.orderNumber}`, MARGIN, 125, 22, INK),
    text(font, approvedText(sheet.approvedAt), MARGIN, 170, 15, MUTED),
  ];
  sheet.lines.forEach((line, i) => {
    const top = HEADER + i * ROW;
    parts.push(`<line x1="${MARGIN}" y1="${top}" x2="${WIDTH - MARGIN}" y2="${top}" stroke="${LINE}" stroke-width="2"/>`);
    const box = top + (ROW - PREVIEW) / 2;
    parts.push(`<rect x="${MARGIN}" y="${box}" width="${PREVIEW}" height="${PREVIEW}" rx="12" fill="#fafafa" stroke="${LINE}" stroke-width="2"/>`);
    parts.push(line.previewSvg
      ? nested(line.previewSvg, MARGIN + 10, box + 10, PREVIEW - 20)
      : text(font, "Без картинки", MARGIN, box + 92, 14, MUTED, PREVIEW));
    const textX = MARGIN + PREVIEW + 40;
    const titleLines = wrap(`${line.position}. ${line.title}`);
    titleLines.forEach((t, n) => parts.push(text(font, t, textX, box + 16 + n * 34, 18, INK)));
    const details = [line.sizeText, `${line.quantity} шт.`].filter(Boolean).join(" · ");
    parts.push(text(font, details, textX, box + 26 + titleLines.length * 34, 16, MUTED));
  });
  parts.push(`<line x1="${MARGIN}" y1="${height - FOOTER}" x2="${WIDTH - MARGIN}" y2="${height - FOOTER}" stroke="${LINE}" stroke-width="2"/>`);
  parts.push(text(font, "Виріб ріжемо саме так, як на картинках вище. Trafaret Line", MARGIN, height - FOOTER + 40, 14, MUTED));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}"><title>${escapeAttr(`Лист погодження ${sheet.orderNumber}`)}</title>${parts.join("")}</svg>`;
}
