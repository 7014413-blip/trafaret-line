// Shipping in one place: the parcel (packaging.ts), Nova Poshta data (integrations.ts) and
// the shape of data/knowledge_base/rules_logistics.json.

import type { ParcelConfig } from "./packaging";

export type { PackKind, Parcel, ParcelConfig, ParcelItem, WeightBreakdown, WeightLine } from "./packaging";
export type { NpCity, NpPriceQuery, NpPriceResult, NpServiceType, NpWarehouse, NpWarehouseCategory } from "./integrations";
export type { DeliveryMethod, OrderDelivery } from "./order";

/** data/knowledge_base/rules_logistics.json */
export interface LogisticsRules {
  about: string;
  updated: string;
  sources: Record<string, string>;
  parcel: ParcelConfig;
}
