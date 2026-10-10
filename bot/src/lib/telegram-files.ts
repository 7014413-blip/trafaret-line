import type { Api } from "grammy"
import type { IncomingFileKind } from "../types/files"

/** Розширення файлів, які бот вважає макетом для різання. */
const LAYOUT_EXTENSIONS = new Set(["svg", "dxf", "pdf", "ai", "eps", "cdr", "plt"])
const PHOTO_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "heic", "heif"])

export function extensionOf(fileName: string | undefined): string {
  if (!fileName) return ""
  const dot = fileName.lastIndexOf(".")
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : ""
}

/** Документ (файл без стиснення): фото, макет або щось інше. */
export function classifyDocument(fileName: string | undefined, mimeType: string | undefined): IncomingFileKind {
  const ext = extensionOf(fileName)
  if (LAYOUT_EXTENSIONS.has(ext)) return "layout"
  if (PHOTO_EXTENSIONS.has(ext)) return "photo"
  if (mimeType?.startsWith("image/")) return mimeType === "image/svg+xml" ? "layout" : "photo"
  if (mimeType === "application/pdf") return "layout"
  return "unsupported"
}

/** Безпечне ім'я файлу: лише латиниця, цифри, крапка, дефіс; без шляхів. */
export function safeFileName(original: string | undefined, fallbackBase: string, fallbackExt: string): string {
  const ext = extensionOf(original) || fallbackExt
  const base = (original ?? "")
    .replace(/\.[^.]*$/, "")
    .normalize("NFKD")
    .replace(/[^\w-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
  return `${base || fallbackBase}.${ext}`
}

/**
 * Завантажує файл з Telegram за file_id. Bot API віддає файли до 20 МБ;
 * більші бот відхиляє з поясненням ще до завантаження.
 */
export async function downloadTelegramFile(api: Api, token: string, fileId: string, maxBytes: number): Promise<Buffer> {
  const file = await api.getFile(fileId)
  if (!file.file_path) {
    throw new Error("Telegram не віддав шлях до файлу (можливо, файл більший за 20 МБ).")
  }
  if (file.file_size !== undefined && file.file_size > maxBytes) {
    throw new Error(`Файл завеликий: ${(file.file_size / 1024 / 1024).toFixed(1)} МБ.`)
  }
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Не вдалося завантажити файл з Telegram: HTTP ${response.status}.`)
  }
  const data = Buffer.from(await response.arrayBuffer())
  if (data.length > maxBytes) {
    throw new Error(`Файл завеликий: ${(data.length / 1024 / 1024).toFixed(1)} МБ.`)
  }
  return data
}
