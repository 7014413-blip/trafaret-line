// Calls of the order files widget to the admin API (api/admin/tl-orders). Same address and
// session cookie as the admin itself.

import type { OrderFile, OrderFilesResult } from "../../types/order-files"
import { adminJson as call } from "./admin-json"

export function loadOrderFiles(orderId: string): Promise<{ orderNumber: string; files: OrderFile[]; problems: string[] }> {
  return call(`/admin/tl-orders/${encodeURIComponent(orderId)}/files`)
}

export function rebuildOrderFiles(orderId: string): Promise<OrderFilesResult> {
  return call(`/admin/tl-orders/${encodeURIComponent(orderId)}/files`, { method: "POST" })
}

export function orderFileUrl(orderId: string, name: string): string {
  return `/admin/tl-orders/${encodeURIComponent(orderId)}/file?name=${encodeURIComponent(name)}`
}

export function orderArchiveUrl(orderId: string, fontsOnly: boolean): string {
  return `/admin/tl-orders/${encodeURIComponent(orderId)}/archive${fontsOnly ? "?only=fonts" : ""}`
}
