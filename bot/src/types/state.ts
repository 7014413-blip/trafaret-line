import type { IntakeProduct, IntakeStatusValue } from "./intake"

/** Файл, отриманий від Дениса й уже збережений у staging-папці чернетки. */
export interface DraftFile {
  /** Ім'я файлу в staging-папці. */
  name: string
  /** photos — фото товару; layout — макет SVG/DXF/PDF/AI/EPS/CDR. */
  kind: "photo" | "layout"
  /** Telegram file_unique_id, щоб той самий файл не збережено двічі. */
  uniqueId: string
}

/** Заявка, яку Денис ще збирає в чаті (до кнопки «Відправити в обробку»). */
export interface Draft {
  draftId: string
  chatId: number
  telegramId: number
  startedAt: string
  rawText: string[]
  files: DraftFile[]
  product: IntakeProduct
  /** Повідомлення-картка чернетки, яке бот оновлює на місці. */
  cardMessageId: number | null
  /** Що бот зараз чекає текстом: ціну, розміри, назву або текст на трафареті. */
  awaiting: "price" | "size" | "title" | "text_on_stencil" | null
}

/** Заявка, вже передана в чергу; бот стежить за її status.json. */
export interface TrackedIntake {
  id: string
  chatId: number
  createdAt: string
  lastStatus: IntakeStatusValue
  medusaHandle: string | null
  publishedByBot: boolean
}

export interface BotState {
  version: 1
  drafts: Record<string, Draft>
  tracked: Record<string, TrackedIntake>
}
