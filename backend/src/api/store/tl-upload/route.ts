// POST /store/tl-upload { name, type, data(base64) } → { key }
// Stores a customer's layout file (DXF, AI, EPS, PDF, SVG, CDR, PNG, JPG ≤ 25 MB) for
// the manager. Files go to backend/uploads/layouts (outside any public folder) with a random
// name; the order keeps the key. On the server this moves to S3-compatible storage (ТЗ §2).
// The content must match the extension and SVGs must be free of scripts (lib/upload-check.ts);
// requests per address are limited in api/middlewares.ts.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { checkLayoutFile, LAYOUT_FORMATS, type LayoutFormat } from "../../../lib/upload-check";

const MAX = 25 * 1024 * 1024;

export async function POST(req: MedusaRequest<{ name: string; data: string }>, res: MedusaResponse) {
  const name = String(req.body?.name ?? "");
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!LAYOUT_FORMATS.has(ext)) return res.status(400).json({ message: "Формат не підтримується" });
  const buf = Buffer.from(String(req.body?.data ?? ""), "base64");
  if (!buf.length || buf.length > MAX) return res.status(400).json({ message: "Файл порожній або більший за 25 МБ" });
  const problem = checkLayoutFile(ext as LayoutFormat, buf);
  if (problem) {
    req.scope.resolve("logger").warn(`tl-upload refused ${ext}: ${problem}`);
    return res.status(400).json({ message: "Файл пошкоджений або не відповідає формату. Збережіть макет ще раз і завантажте." });
  }

  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
  const dir = path.join(process.cwd(), "uploads", "layouts", key.split("/")[0]);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(process.cwd(), "uploads", "layouts", key), buf);
  return res.json({ key, size: buf.length, originalName: name.slice(0, 200) });
}
