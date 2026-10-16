// Production files of an order for the order page of the admin (widgets/order-production-files.tsx).
// GET  /admin/tl-orders/:id/files → { orderNumber, files, problems }
// POST /admin/tl-orders/:id/files → writes the files again («Перебудувати файли»)
// Admin only: Medusa protects /admin/*.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { requestGraph } from "../../../../../lib/orders/admin-graph";
import { listOrderFiles, readOrderProblems } from "../../../../../lib/orders/order-files-dir";
import { loadOrderForFiles } from "../../../../../lib/orders/load-order";
import { orderNumberOf } from "../../../../../lib/orders/order-number";
import { writeOrderFiles } from "../../../../../lib/orders/write-order-files";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const orderNumber = await orderNumberOf(requestGraph(req), req.params.id);
  if (!orderNumber) return res.status(404).json({ message: "Замовлення не знайдено" });
  res.json({ orderNumber, files: await listOrderFiles(orderNumber), problems: await readOrderProblems(orderNumber) });
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const order = await loadOrderForFiles(requestGraph(req), req.params.id);
  if (!order) return res.status(404).json({ message: "Замовлення не знайдено" });
  res.json(await writeOrderFiles(order));
}
