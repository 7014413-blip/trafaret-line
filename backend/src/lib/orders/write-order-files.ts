// Production files of an order (ТЗ §7), written into its folder (lib/orders/order-files-dir.ts):
//   TL-<n>-<position>_<constructor>_<material>_<w>x<h>mm.svg / .dxf  machine files, CUT layers + INFO
//   … .png                                                        preview of the part
//   TL-<n>-<position>_<kind>_preview.png                            constructor's picture of other lines
//   TL-<n>_params.json                                              every line with its parameters
//   TL-<n>_approval.png                                             «Лист погодження макета»
//   fonts/<family>_<id>.<ext>                                       customer fonts of the order
// Written after the order is placed (subscribers/order-production-files.ts) and again from the
// admin button «Перебудувати файли». Customer fonts of the order are marked as used and kept.

import fs from "node:fs/promises";
import path from "node:path";
import { approvalSheetSvg } from "../../shared/lib/export/approval-sheet";
import { productionFileName } from "../../shared/lib/export/production-name";
import { needsLayoutApproval } from "../../shared/lib/validation/layout-approval";
import type { ApprovalSheetLine } from "../../shared/types/production";
import { toLayeredDxf, toLayeredSvg } from "../../shared/lib/export/layers";
import { MATERIALS } from "../../shared/lib/materials";
import type { MaterialType } from "../../shared/types/customizer";
import type { OrderFilesResult, OrderForFiles, OrderLineForFiles } from "../../types/order-files";
import { fontFiles, markFontUsed, readFontNote } from "../text/font-usage";
import { customFontsDir, loadFontById } from "../text/node-fonts";
import { lineProductionPart } from "./line-production-part";
import { listOrderFiles, orderFolder } from "./order-files-dir";
import { orderFontKeys } from "./order-font-keys";
import { svgToPng } from "./svg-to-png";

const safe = (value: string) => value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "font";

/** Text of the INFO layer: order, position, material and size, in ASCII for the machine software. */
function infoLines(orderNumber: string, position: number, count: number, line: OrderLineForFiles, materialId: string, widthMm: number, heightMm: number): string[] {
  const material = MATERIALS[materialId as MaterialType];
  return [
    `Order ${orderNumber}, item ${position} of ${count}`,
    `Material: ${material ? material.name.en : materialId}`,
    `Size: ${Math.round(widthMm)} x ${Math.round(heightMm)} mm`,
    `Qty: ${line.quantity}`,
  ];
}

/** Site font the approval sheet is written in. */
const SHEET_FONT = "montserrat";

/** Machine files and preview of one line; the names written, the picture used and problems for the manager. */
async function writeLine(folder: string, orderNumber: string, position: number, count: number, line: OrderLineForFiles): Promise<{ files: string[]; problems: string[]; previewSvg: string | null }> {
  const meta = line.metadata ?? {};
  const files: string[] = [];
  const problems: string[] = [];
  let built = false;
  let previewSvg: string | null = null;
  try {
    const made = lineProductionPart(meta);
    if (made) {
      const materialId = String(meta.materialId ?? "");
      const base = productionFileName({ orderNumber, position, constructor: made.constructor, materialId, widthMm: made.widthMm, heightMm: made.heightMm });
      const part = { ...made.part, label: `${orderNumber} #${position}`, info: infoLines(orderNumber, position, count, line, materialId, made.widthMm, made.heightMm) };
      await fs.writeFile(path.join(folder, `${base}.svg`), toLayeredSvg(part));
      await fs.writeFile(path.join(folder, `${base}.dxf`), toLayeredDxf(part));
      await fs.writeFile(path.join(folder, `${base}.png`), svgToPng(made.previewSvg));
      files.push(`${base}.svg`, `${base}.dxf`, `${base}.png`);
      problems.push(...made.warnings.map((w) => `Позиція ${position}: ${w}`));
      built = true;
      previewSvg = made.previewSvg;
    }
  } catch (e) {
    problems.push(`Позиція ${position}: файл для станка не зібрано (${(e as Error).message}). Потрібен макет менеджера`);
  }
  // Lines without a server part: the constructor's own picture, when the browser sent it.
  if (!built && typeof meta.previewSvg === "string") {
    const name = `${orderNumber}-${position}_${safe(String(meta.kind ?? "line"))}_preview.png`;
    try {
      await fs.writeFile(path.join(folder, name), svgToPng(meta.previewSvg));
      files.push(name);
      previewSvg = meta.previewSvg;
    } catch (e) {
      problems.push(`Позиція ${position}: превʼю не намальовано (${(e as Error).message})`);
    }
  }
  return { files, problems, previewSvg };
}

const cm = (value: unknown) => (typeof value === "number" && value > 0 ? String(Math.round(value * 10) / 10).replace(".", ",") : "");

/** «Лист погодження макета» of the made-to-layout lines, as PNG; null when the order has none. */
async function writeApprovalSheet(folder: string, order: OrderForFiles, orderNumber: string, lines: ApprovalSheetLine[]): Promise<string | null> {
  if (!lines.length) return null;
  const font = loadFontById(SHEET_FONT);
  if (!font) throw new Error(`font ${SHEET_FONT} is missing on the server`);
  const name = `${orderNumber}_approval.png`;
  await fs.writeFile(path.join(folder, name), svgToPng(approvalSheetSvg(font, { orderNumber, approvedAt: order.approvedAt, lines }), 1240));
  return name;
}

/** Copies the customer fonts of the order into its folder and marks them as used. */
async function copyFonts(folder: string, orderNumber: string, keys: Set<string>): Promise<{ fonts: Record<string, unknown>[]; problems: string[] }> {
  const fonts: Record<string, unknown>[] = [];
  const problems: string[] = [];
  if (!keys.size) return { fonts, problems };
  await fs.mkdir(path.join(folder, "fonts"), { recursive: true });
  for (const key of keys) {
    const note = await readFontNote(key);
    const id = path.basename(key).split(".")[0].slice(0, 8);
    const name = `${safe(note?.family ?? "font")}_${id}${path.extname(key)}`;
    try {
      await fs.copyFile(fontFiles(key, customFontsDir()).file, path.join(folder, "fonts", name));
      await markFontUsed(key, orderNumber);
      fonts.push({ key, file: `fonts/${name}`, family: note?.family ?? null, originalName: note?.originalName ?? null, rightsConfirmedAt: note?.at ?? null, sha256: note?.sha256 ?? null, embeddingRestricted: note?.embeddingRestricted ?? null });
    } catch {
      problems.push(`Шрифт клієнта ${note?.originalName ?? key} не знайдено на сервері`);
    }
  }
  return { fonts, problems };
}

export async function writeOrderFiles(order: OrderForFiles): Promise<OrderFilesResult> {
  const orderNumber = `TL-${order.displayId}`;
  const folder = orderFolder(orderNumber);
  if (!folder) throw new Error(`bad order number ${orderNumber}`);
  await fs.mkdir(folder, { recursive: true });

  const problems: string[] = [];
  const lines: Record<string, unknown>[] = [];
  const toApprove: ApprovalSheetLine[] = [];
  for (const [i, line] of order.items.entries()) {
    const written = await writeLine(folder, orderNumber, i + 1, order.items.length, line);
    problems.push(...written.problems);
    const meta = line.metadata ?? {};
    if (needsLayoutApproval({ kind: typeof meta.kind === "string" ? meta.kind : null })) {
      const size = [cm(meta.widthCm), cm(meta.heightCm)];
      toApprove.push({ position: i + 1, title: line.title, sizeText: size.every(Boolean) ? `${size[0]} × ${size[1]} см` : "", quantity: line.quantity, previewSvg: written.previewSvg });
    }
    const { previewSvg: _preview, ...metadata } = line.metadata ?? {};
    lines.push({ position: i + 1, title: line.title, quantity: line.quantity, files: written.files, ...metadata });
  }
  const keys = new Set<string>();
  for (const line of order.items) orderFontKeys(line.metadata, keys);
  const copied = await copyFonts(folder, orderNumber, keys);
  problems.push(...copied.problems);
  try {
    await writeApprovalSheet(folder, order, orderNumber, toApprove);
  } catch (e) {
    problems.push(`Лист погодження макета не намальовано (${(e as Error).message})`);
  }

  await fs.writeFile(path.join(folder, `${orderNumber}_params.json`), JSON.stringify({
    order: orderNumber, orderId: order.id, writtenAt: new Date().toISOString(), layoutApprovedAt: order.approvedAt, lines, fonts: copied.fonts, problems,
  }, null, 2));
  return { orderNumber, files: await listOrderFiles(orderNumber), problems };
}
