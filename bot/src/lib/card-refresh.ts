import { GrammyError, type Api } from "grammy"
import type { BotDeps } from "../types/deps"
import type { Draft } from "../types/state"
import { draftCardText, draftKeyboard } from "./card"

const pendingReposts = new Map<number, NodeJS.Timeout>()
const REPOST_DELAY_MS = 1500

function isNotModified(error: unknown): boolean {
  return error instanceof GrammyError && error.description.includes("message is not modified")
}

/** Оновлює картку чернетки на місці (після натискання кнопки). */
export async function editCard(api: Api, deps: BotDeps, draft: Draft): Promise<Draft> {
  if (draft.cardMessageId !== null) {
    try {
      await api.editMessageText(draft.chatId, draft.cardMessageId, draftCardText(draft, deps.catalog), {
        parse_mode: "HTML",
        reply_markup: draftKeyboard(draft),
      })
      return draft
    } catch (error) {
      if (isNotModified(error)) return draft
      if (!(error instanceof GrammyError)) throw error
      // Повідомлення видалене або застаріле — надсилаємо нову картку.
    }
  }
  return sendCard(api, deps, draft)
}

/** Надсилає нову картку внизу чату і прибирає стару, щоб вона не губилась над фото. */
export async function sendCard(api: Api, deps: BotDeps, draft: Draft): Promise<Draft> {
  const sent = await api.sendMessage(draft.chatId, draftCardText(draft, deps.catalog), {
    parse_mode: "HTML",
    reply_markup: draftKeyboard(draft),
  })
  const oldId = draft.cardMessageId
  const updated: Draft = { ...draft, cardMessageId: sent.message_id }
  await deps.store.saveDraft(updated)
  if (oldId !== null && oldId !== sent.message_id) {
    await api.deleteMessage(draft.chatId, oldId).catch(() => undefined)
  }
  return updated
}

/**
 * Перевиставляє картку з невеликою затримкою: альбом із кількох фото дає одну картку,
 * а не по картці на кожне фото.
 */
export function scheduleCardRepost(api: Api, deps: BotDeps, telegramId: number): void {
  const existing = pendingReposts.get(telegramId)
  if (existing) clearTimeout(existing)
  const timer = setTimeout(() => {
    pendingReposts.delete(telegramId)
    void deps.lock
      .run(telegramId, async () => {
        const draft = deps.store.draftForUser(telegramId)
        if (draft) await sendCard(api, deps, draft)
      })
      .catch((error: unknown) => {
        console.error(`[card] не вдалося оновити картку для ${telegramId}:`, error)
      })
  }, REPOST_DELAY_MS)
  pendingReposts.set(telegramId, timer)
}

export function cancelCardRepost(telegramId: number): void {
  const existing = pendingReposts.get(telegramId)
  if (existing) clearTimeout(existing)
  pendingReposts.delete(telegramId)
}
