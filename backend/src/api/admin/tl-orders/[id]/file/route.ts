// GET /admin/tl-orders/:id/file?name=<file of the order folder> → the file as a download.
// Admin only: Medusa protects /admin/*.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import fs from "node:fs/promises";
import path from "node:path";
import { requestGraph } from "../../../../../lib/orders/admin-graph";
import { orderFilePath } from "../../../../../lib/orders/order-files-dir";
import { orderNumberOf } from "../../../../../lib/orders/order-number";

const TYPES: Record<string, string> = {
  ".svg": "image/svg+xml", ".dxf": "application/dxf", ".png": "image/png", ".json": "application/json",
  ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff",
};

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderNumber = await orderNumberOf(requestGraph(req), req.params.id);
  const name = typeof req.query.name === "string" ? req.query.name : "";
  const file = orderNumber ? orderFilePath(orderNumber, name) : null;
  const data = file ? await fs.readFile(file).catch(() => null) : null;
  if (!data) return res.status(404).json({ message: "Файл не знайдено" });
  res.setHeader("content-type", TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream");
  res.setHeader("content-disposition", `attachment; filename="${path.basename(name)}"`);
  // A downloaded SVG never runs as a page of the admin.
  res.setHeader("content-security-policy", "sandbox");
  res.setHeader("x-content-type-options", "nosniff");
  res.send(data);
}
