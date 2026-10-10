// Ukrainian labels of the «Простий кабінет» pages.

import type { ProductAvailability } from "../../types/kabinet"

export const AVAILABILITY_LABEL: Record<ProductAvailability, string> = {
  in_stock: "В наявності",
  on_order: "Під замовлення",
  out_of_stock: "Немає в наявності",
}

export const formatPriceFrom = (value: number | null) =>
  value == null ? "—" : `від ${new Intl.NumberFormat("uk-UA").format(value)} ₴`
