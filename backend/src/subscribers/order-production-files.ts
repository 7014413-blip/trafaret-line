// After an order is placed, its production files are written (lib/orders/write-order-files.ts):
// SVG and DXF for the laser, PNG previews, parameters and the customer's fonts. A failure is
// logged and never stops the order; the admin button «Перебудувати файли» writes them again.

import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import { loadOrderForFiles } from "../lib/orders/load-order";
import { writeOrderFiles } from "../lib/orders/write-order-files";
import type { QueryGraph } from "../types/order-files";

export default async function orderProductionFiles({ event: { data }, container }: SubscriberArgs<{ id: string }>): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as unknown as { graph: QueryGraph };
  try {
    const order = await loadOrderForFiles(query.graph.bind(query), data.id);
    if (!order) return;
    const result = await writeOrderFiles(order);
    if (result.problems.length) logger.warn(`Order ${result.orderNumber} files: ${result.problems.join("; ")}`);
  } catch (e) {
    logger.error(`Order ${data.id}: production files were not written: ${(e as Error).message}`);
  }
}

export const config: SubscriberConfig = {
  event: "order.placed",
};
