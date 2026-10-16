// Where the production files of an order live: <ORDER_FILES_DIR or backend/uploads/orders>/TL-<n>/,
// customer fonts of the order in its "fonts" subfolder. Names coming from requests are checked
// so they never leave the order folder.

import fs from "node:fs/promises";
import path from "node:path";
import type { OrderFile, OrderFileKind } from "../../types/order-files";

const ORDER_NUMBER = /^TL-\d{1,12}$/;
const FILE_NAME = /^(fonts\/)?[A-Za-z0-9][A-Za-z0-9._-]{0,200}$/;
const KINDS: Record<string, OrderFileKind> = { ".svg": "svg", ".dxf": "dxf", ".png": "png", ".json": "json" };

export function orderFilesRoot(): string {
  return process.env.ORDER_FILES_DIR ?? path.resolve(process.cwd(), "uploads", "orders");
}

/** Folder of the order, or null for a malformed order number. */
export function orderFolder(orderNumber: string): string | null {
  return ORDER_NUMBER.test(orderNumber) ? path.join(orderFilesRoot(), orderNumber) : null;
}

/** Absolute path of a file of the order, or null when the name is not a plain file name. */
export function orderFilePath(orderNumber: string, name: string): string | null {
  const folder = orderFolder(orderNumber);
  if (!folder || !FILE_NAME.test(name) || name.includes("..")) return null;
  return path.join(folder, ...name.split("/"));
}

async function filesIn(folder: string, prefix: string): Promise<OrderFile[]> {
  const entries = await fs.readdir(folder, { withFileTypes: true }).catch(() => []);
  const out: OrderFile[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const stat = await fs.stat(path.join(folder, entry.name));
    const kind = prefix ? "font" : KINDS[path.extname(entry.name).toLowerCase()];
    if (kind) out.push({ name: `${prefix}${entry.name}`, kind, sizeBytes: stat.size });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

/** Files of the order folder (machine files, previews, parameters, then fonts). */
export async function listOrderFiles(orderNumber: string): Promise<OrderFile[]> {
  const folder = orderFolder(orderNumber);
  if (!folder) return [];
  return [...(await filesIn(folder, "")), ...(await filesIn(path.join(folder, "fonts"), "fonts/"))];
}

/** Problems written with the files (params JSON), empty when the files were not written yet. */
export async function readOrderProblems(orderNumber: string): Promise<string[]> {
  const file = orderFilePath(orderNumber, `${orderNumber}_params.json`);
  const text = file ? await fs.readFile(file, "utf8").catch(() => null) : null;
  if (!text) return [];
  try {
    const problems = (JSON.parse(text) as { problems?: unknown }).problems;
    return Array.isArray(problems) ? problems.map(String) : [];
  } catch {
    return [];
  }
}
