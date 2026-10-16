// Calls of the order files widget to the admin API (api/admin/tl-orders). Same address and
// session cookie as the admin itself.

import type { OrderFile, OrderFilesResult } from "../../types/order-files"

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { accept: "application/json" }, ...init })
  const data = (await response.json().catch(() => ({}))) as T & { message?: string }
  if (!response.ok) throw new Error(data.message || `Помилка сервера (${response.status})`)
  return data
}

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
