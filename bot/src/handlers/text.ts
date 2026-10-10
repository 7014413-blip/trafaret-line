import type { Bot, Context } from "grammy"
import { ASK_PROMPTS } from "../lib/card"
import { cancelCardRepost, sendCard } from "../lib/card-refresh"
import { applyText, newDraft } from "../lib/draft"
import { parsePrice, parseSizes } from "../lib/parse-caption"
import type { BotDeps } from "../types/deps"
import type { AnswerResult } from "../types/files"
import type { Draft } from "../types/state"

/** Відповідь на конкретне питання бота (ціна, розмір, назва, текст). */
function applyAnswer(draft: Draft, text: string): AnswerResult {
  const value = text.trim()
  switch (draft.awaiting) {
    case "price": {
      const price = parsePrice(value) ?? (/^\d{1,6}([.,]\d{1,2})?$/.test(value) ? Math.round(Number(value.replace(",", "."))) : null)
      if (price === null || price <= 0) return { ok: false, error: "Не зрозумів ціну. Напишіть число, наприклад: 350" }
      return { ok: true, draft: { ...draft, awaiting: null, product: { ...draft.product, price_uah: price } } }
    }
    case "size": {
      const withUnit = /(мм|mm|см|cm|[xх×øØ⌀])/iu.test(value) ? value : `${value} см`
      const sizes = parseSizes(withUnit)
      if (sizes.length === 0) {
        return { ok: false, error: "Не зрозумів розмір. Приклади: 15 см, 30x20 см, Ø34 см." }
      }
      return { ok: true, draft: { ...draft, awaiting: null, product: { ...draft.product, sizes_mm: sizes } } }
    }
    case "title": {
      if (value.length < 3) return { ok: false, error: "Назва закоротка, напишіть хоча б кілька слів." }
      const title = value.length > 120 ? `${value.slice(0, 117)}...` : value
      return { ok: true, draft: { ...draft, awaiting: null, product: { ...draft.product, title_uk: title } } }
    }
    case "text_on_stencil": {
      if (!value) return { ok: false, error: "Текст порожній, напишіть, що має бути на трафареті." }
      return {
        ok: true,
        draft: { ...draft, awaiting: null, product: { ...draft.product, text_on_stencil: value.slice(0, 200) } },
      }
    }
    case null:
      return { ok: true, draft }
  }
}

export function registerTextHandler(bot: Bot<Context>, deps: BotDeps): void {
  bot.on("message:text", async (ctx) => {
    const text = ctx.message.text
    if (text.startsWith("/")) {
      await ctx.reply("Невідома команда. Список команд: /help")
      return
    }
    const userId = ctx.from.id
    const chatId = ctx.chat.id

    await deps.lock.run(userId, async () => {
      cancelCardRepost(userId)
      const existing = deps.store.draftForUser(userId)

      if (existing?.awaiting) {
        const result = applyAnswer(existing, text)
        if (!result.ok) {
          await ctx.reply(`${result.error}\n\n${ASK_PROMPTS[existing.awaiting]}`)
          return
        }
        await deps.store.saveDraft(result.draft)
        await sendCard(ctx.api, deps, result.draft)
        return
      }

      const draft = applyText(existing ?? newDraft(chatId, userId), text, deps.catalog)
      await deps.store.saveDraft(draft)
      await sendCard(ctx.api, deps, draft)
    })
  })
}
