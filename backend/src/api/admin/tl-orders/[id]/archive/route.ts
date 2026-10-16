// GET /admin/tl-orders/:id/archive             → TL-<n>_files.zip, every file of the order
// GET /admin/tl-orders/:id/archive?only=fonts  → TL-<n>_fonts.zip, «Завантажити шрифти замовлення»
// Admin only: Medusa protects /admin/*.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import fs from "node:fs/promises";
import { requestGraph } from "../../../../../lib/orders/admin-graph";
import { listOrderFiles, orderFilePath } from "../../../../../lib/orders/order-files-dir";
import { orderNumberOf } from "../../../../../lib/orders/order-number";
import { zipStore } from "../../../../../lib/orders/zip";
import type { ZipEntry } from "../../../../../types/order-files";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderNumber = await orderNumberOf(requestGraph(req), req.params.id);
  if (!orderNumber) return res.status(404).json({ message: "Замовлення не знайдено" });
  const fontsOnly = req.query.only === "fonts";
  const files = (await listOrderFiles(orderNumber)).filter((f) => !fontsOnly || f.kind === "font");
  if (!files.length) return res.status(404).json({ message: fontsOnly ? "У замовленні немає шрифтів клієнта" : "Файлів замовлення ще немає" });
  const entries: ZipEntry[] = [];
  for (const file of files) {
    const filePath = orderFilePath(orderNumber, file.name);
    if (filePath) entries.push({ name: fontsOnly ? file.name.replace(/^fonts\//, "") : file.name, data: await fs.readFile(filePath) });
  }
  res.setHeader("content-type", "application/zip");
  res.setHeader("content-disposition", `attachment; filename="${orderNumber}_${fontsOnly ? "fonts" : "files"}.zip"`);
  res.send(zipStore(entries));
}
