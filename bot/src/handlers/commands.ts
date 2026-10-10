import type { Bot, Context } from "grammy"
import { STATUS_LABELS } from "../lib/card"
import { cancelCardRepost, sendCard } from "../lib/card-refresh"
import type { BotDeps } from "../types/deps"

const HELP_TEXT = [
  "<b>Як додати товар</b>",
  "1. Надішліть фото товару (можна альбомом) і підпис, наприклад:",
  "<i>тірамісу Ø34 PET 350 грн</i>",
  "<i>сніжинка 15, 20, 25 см, пластик, 120 грн</i>",
  "Макет SVG/DXF/PDF можна надіслати файлом.",
  "2. Бот покаже картку. Чого бракує, виберіть кнопками.",
  "3. Натисніть «Відправити в обробку». Конвеєр зробить фото в стилі сайту, мокапи, тексти й SEO і створить чернетку.",
  "4. Коли чернетка буде готова, бот надішле кнопку «Опублікувати на сайті».",
  "",
  "Постачальника в підписах не згадуйте: на сайті вказуються лише матеріал і характеристики.",
  "",
  "/status — останні заявки та їхній стан",
  "/card — показати поточну картку",
  "/cancel — скасувати поточну заявку",
  "/id — ваш Telegram ID",
].join("\n")

export function registerCommands(bot: Bot<Context>, deps: BotDeps): void {
  bot.command(["start", "help"], async (ctx) => {
    await ctx.reply(HELP_TEXT, { parse_mode: "HTML" })
  })

  bot.command("id", async (ctx) => {
    await ctx.reply(`Ваш Telegram ID: <code>${ctx.from?.id ?? "?"}</code>`, { parse_mode: "HTML" })
  })

  bot.command("card", async (ctx) => {
    const userId = ctx.from?.id
    if (userId === undefined) return
    await deps.lock.run(userId, async () => {
      const draft = deps.store.draftForUser(userId)
      if (!draft) {
        await ctx.reply("Зараз немає заявки, яка збирається. Надішліть фото товару, щоб почати.")
        return
      }
      await sendCard(ctx.api, deps, draft)
    })
  })

  bot.command("cancel", async (ctx) => {
    const userId = ctx.from?.id
    if (userId === undefined) return
    await deps.lock.run(userId, async () => {
      const draft = deps.store.draftForUser(userId)
      cancelCardRepost(userId)
      if (!draft) {
        await ctx.reply("Скасовувати нічого: заявки, яка збирається, немає.")
        return
      }
      await deps.inbox.discardDraft(draft.draftId)
      await deps.store.deleteDraft(userId)
      if (draft.cardMessageId !== null) {
        await ctx.api.deleteMessage(draft.chatId, draft.cardMessageId).catch(() => undefined)
      }
      await ctx.reply("Заявку скасовано, файли видалено.")
    })
  })

  bot.command("status", async (ctx) => {
    const items = deps.store
      .tracked()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 10)
    if (items.length === 0) {
      await ctx.reply("Відправлених заявок ще немає.")
      return
    }
    const lines = ["<b>Останні заявки</b>"]
    for (const item of items) {
      const label = item.publishedByBot ? STATUS_LABELS.published : STATUS_LABELS[item.lastStatus]
      lines.push(`<code>${item.id}</code>: ${label}`)
    }
    await ctx.reply(lines.join("\n"), { parse_mode: "HTML" })
  })
}
