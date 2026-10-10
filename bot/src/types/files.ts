import type { Draft } from "./state"

export type IncomingFileKind = "photo" | "layout" | "unsupported"

/** Фото або документ із повідомлення, ще не завантажений. */
export interface IncomingFile {
  fileId: string
  uniqueId: string
  kind: "photo" | "layout"
  originalName: string | undefined
  fallbackExt: string
  size: number | undefined
}

/** Результат розбору відповіді на питання бота. */
export type AnswerResult = { ok: true; draft: Draft } | { ok: false; error: string }
