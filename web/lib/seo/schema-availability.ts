// Schema.org availability of a product from the owner's choice in the admin cabinet:
// «В наявності» → InStock, «Під замовлення» → MadeToOrder, «Немає» → OutOfStock.

import type { ProductAvailability } from "../../types/catalog";

const SCHEMA: Record<ProductAvailability, string> = {
  in_stock: "https://schema.org/InStock",
  on_order: "https://schema.org/MadeToOrder",
  out_of_stock: "https://schema.org/OutOfStock",
};

export function schemaAvailability(availability: ProductAvailability): string {
  return SCHEMA[availability];
}
