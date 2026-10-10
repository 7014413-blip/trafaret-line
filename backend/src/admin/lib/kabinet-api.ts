// Calls of the «Простий кабінет» pages to the admin API. The admin runs on the same
// address as the API and is signed in with a session cookie, so plain fetch with
// credentials is enough.

import type {
  KabinetError, KabinetImportReport, KabinetImportRequest, KabinetListQuery, KabinetListResponse, KabinetProduct,
  KabinetProductInput, KabinetSaveResponse,
} from "../../types/kabinet"

export class KabinetApiError extends Error {
  constructor(message: string, public readonly field?: string, public readonly status?: number) {
    super(message)
    this.name = "KabinetApiError"
  }
}

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: { "content-type": "application/json", accept: "application/json" },
    ...init,
  })
  const text = await response.text()
  const data = text ? (JSON.parse(text) as unknown) : null
  if (!response.ok) {
    const err = (data ?? {}) as Partial<KabinetError>
    throw new KabinetApiError(err.message || `Помилка сервера (${response.status})`, err.field, response.status)
  }
  return data as T
}

export function listProducts(query: KabinetListQuery): Promise<KabinetListResponse> {
  const params = new URLSearchParams()
  if (query.q) params.set("q", query.q)
  if (query.categoryId) params.set("categoryId", query.categoryId)
  if (query.status) params.set("status", query.status)
  params.set("offset", String(query.offset ?? 0))
  params.set("limit", String(query.limit ?? 50))
  return call(`/admin/tl-products?${params}`)
}

export async function getProduct(id: string): Promise<KabinetProduct> {
  return (await call<{ product: KabinetProduct }>(`/admin/tl-products/${encodeURIComponent(id)}`)).product
}

export async function saveProduct(id: string | null, input: KabinetProductInput): Promise<KabinetProduct> {
  const path = id ? `/admin/tl-products/${encodeURIComponent(id)}` : "/admin/tl-products"
  return (await call<KabinetSaveResponse>(path, { method: "POST", body: JSON.stringify(input) })).product
}

/** Downloads the whole catalogue as a CSV file for Excel. */
export async function downloadExport(): Promise<void> {
  const response = await fetch("/admin/tl-products/export", { credentials: "include" })
  if (!response.ok) throw new KabinetApiError(`Не вдалося вивантажити товари (${response.status})`, undefined, response.status)
  const blob = await response.blob()
  const name = /filename="([^"]+)"/.exec(response.headers.get("content-disposition") ?? "")?.[1] ?? "tovary.csv"
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Sends a CSV table: dryRun shows what would change, otherwise the changes are saved. */
export function importCsv(csv: string, dryRun: boolean): Promise<KabinetImportReport> {
  const body: KabinetImportRequest = { csv, dryRun }
  return call("/admin/tl-products/import", { method: "POST", body: JSON.stringify(body) })
}

/** Uploads photos with the built-in Medusa upload route; returns their public URLs. */
export async function uploadPhotos(files: File[]): Promise<string[]> {
  const form = new FormData()
  for (const file of files) form.append("files", file)
  const response = await fetch("/admin/uploads", { method: "POST", credentials: "include", body: form })
  if (!response.ok) throw new KabinetApiError(`Не вдалося завантажити фото (${response.status})`, "images", response.status)
  const data = (await response.json()) as { files?: { url: string }[] }
  return (data.files ?? []).map((f) => f.url)
}
