import type { Bot, Context } from "grammy"
import {
  ASK_PROMPTS,
  STATUS_LABELS,
  childCategoryKeyboard,
  escapeHtml,
  kindKeyboard,
  materialKeyboard,
  topCategoryKeyboard,
} from "../lib/card"
import { cancelCardRepost, editCard } from "../lib/card-refresh"
import { checkDraft, setCategory, setKind } from "../lib/draft"
import { MedusaError } from "../lib/medusa"
import type { BotDeps } from "../types/deps"
import type { ProductKind } from "../types/intake"
import type { Draft } from "../types/state"

const ASK_KEYS: Record<string, NonNullable<Draft["awaiting"]>> = {
  price: "price",
  size: "size",
  title: "title",
  text: "text_on_stencil",
}

const KINDS: ReadonlySet<string> = new Set<ProductKind>(["custom", "ready", "blank"])

async function showKeyboard(ctx: Context, markup: ReturnType<typeof kindKeyboard>): Promise<void> {
  await ctx.editMessageReplyMarkup({ reply_markup: markup }).catch(() => undefined)
}

/** Кнопки на картці чернетки. */
async function handleDraftAction(ctx: Context, deps: BotDeps, data: string): Promise<void> {
  const userId = ctx.from?.id
  if (userId === undefined) return

  await deps.lock.run(userId, async () => {
    const draft = deps.store.draftForUser(userId)
    const messageId = ctx.callbackQuery?.message?.message_id
    if (!draft || messageId === undefined || draft.cardMessageId !== messageId) {
      await ctx.answerCallbackQuery({ text: "Ця картка вже неактуальна. Надішліть фото або /card." })
      return
    }
    cancelCardRepost(userId)

    if (data === "cg") {
      await ctx.answerCallbackQuery()
      await showKeyboard(ctx, topCategoryKeyboard(deps.catalog))
      return
    }
    if (data.startsWith("cp:")) {
      await ctx.answerCallbackQuery()
      await showKeyboard(ctx, childCategoryKeyboard(deps.catalog, data.slice(3)))
      return
    }
    if (data === "kg") {
      await ctx.answerCallbackQuery()
      await showKeyboard(ctx, kindKeyboard())
      return
    }
    if (data === "mg") {
      await ctx.answerCallbackQuery()
      await showKeyboard(ctx, materialKeyboard(deps.catalog, draft.product.kind))
      return
    }
    if (data === "back") {
      await ctx.answerCallbackQuery()
      await editCard(ctx.api, deps, draft)
      return
    }

    let updated: Draft | null = null
    if (data.startsWith("c:")) {
      const handle = data.slice(2)
      if (!deps.catalog.categoryByHandle.has(handle)) {
        await ctx.answerCallbackQuery({ text: "Такої категорії вже немає в каталозі." })
        return
      }
      updated = setCategory(draft, handle)
    } else if (data.startsWith("k:")) {
      const kind = data.slice(2)
      if (!KINDS.has(kind)) {
        await ctx.answerCallbackQuery()
        return
      }
      updated = setKind(draft, kind as ProductKind, deps.catalog)
    } else if (data.startsWith("ms:")) {
      const code = data.slice(3)
      if (!deps.catalog.materialByCode.has(code)) {
        await ctx.answerCallbackQuery({ text: "Такого матеріалу вже немає в каталозі." })
        return
      }
      updated = { ...draft, product: { ...draft.product, material: code } }
    } else if (data.startsWith("ask:")) {
      const awaiting = ASK_KEYS[data.slice(4)]
      if (!awaiting) {
        await ctx.answerCallbackQuery()
        return
      }
      await deps.store.saveDraft({ ...draft, awaiting })
      await ctx.answerCallbackQuery()
      await ctx.reply(ASK_PROMPTS[awaiting])
      return
    } else if (data === "cancel") {
      await deps.inbox.discardDraft(draft.draftId)
      await deps.store.deleteDraft(userId)
      await ctx.answerCallbackQuery({ text: "Скасовано" })
      await ctx.editMessageText("Заявку скасовано, файли видалено.").catch(() => undefined)
      return
    } else if (data === "sub") {
      const check = checkDraft(draft)
      if (check.blocking.length > 0) {
        await ctx.answerCallbackQuery({ text: `Бракує: ${check.blocking.join(", ")}` })
        return
      }
      const intake = await deps.inbox.submit(draft)
      await deps.store.deleteDraft(userId)
      await deps.store.saveTracked({
        id: intake.id,
        chatId: draft.chatId,
        createdAt: intake.created_at,
        lastStatus: "new",
        medusaHandle: null,
        publishedByBot: false,
      })
      await ctx.answerCallbackQuery({ text: "Відправлено" })
      await ctx
        .editMessageText(
          `✅ Заявку <code>${intake.id}</code> відправлено в обробку.\n` +
            `${escapeHtml(intake.product.title_uk ?? "Без назви")}\n\n` +
            "Коли чернетка буде готова, я надішлю кнопку «Опублікувати на сайті». Стан усіх заявок: /status",
          { parse_mode: "HTML" },
        )
        .catch(() => undefined)
      return
    }

    if (!updated) {
      await ctx.answerCallbackQuery()
      return
    }
    await deps.store.saveDraft(updated)
    await ctx.answerCallbackQuery()
    await editCard(ctx.api, deps, updated)
  })
}

/** Кнопка «Опублікувати на сайті» під сповіщенням про готову чернетку. */
async function handlePublish(ctx: Context, deps: BotDeps, intakeId: string): Promise<void> {
  const tracked = deps.store.trackedById(intakeId)
  if (!tracked) {
    await ctx.answerCallbackQuery({ text: "Заявку не знайдено." })
    return
  }
  if (tracked.publishedByBot || tracked.lastStatus === "published") {
    await ctx.answerCallbackQuery({ text: "Вже опубліковано." })
    await ctx.editMessageReplyMarkup().catch(() => undefined)
    return
  }
  const status = await deps.inbox.readStatus(intakeId)
  const handle = status?.medusa_handle ?? tracked.medusaHandle
  if (!handle) {
    await ctx.answerCallbackQuery({ text: "Чернетка ще не готова в адмінці." })
    return
  }
  await ctx.answerCallbackQuery({ text: "Публікую…" })
  try {
    const product = await deps.medusa.publishByHandle(handle)
    await deps.store.saveTracked({ ...tracked, medusaHandle: handle, publishedByBot: true, lastStatus: "published" })
    await ctx.editMessageReplyMarkup().catch(() => undefined)
    await ctx.reply(
      `🚀 Опубліковано: <b>${escapeHtml(product.title)}</b>\nЗаявка <code>${intakeId}</code> — ${STATUS_LABELS.published}.\n` +
        `Адмінка: ${escapeHtml(deps.medusa.adminUrl(product.id))}`,
      { parse_mode: "HTML" },
    )
  } catch (error) {
    const message = error instanceof MedusaError ? error.message : `Неочікувана помилка: ${(error as Error).message}`
    console.error(`[publish] ${intakeId}:`, error)
    await ctx.reply(`Не вдалося опублікувати: ${escapeHtml(message)}`, { parse_mode: "HTML" })
  }
}

export function registerCallbacks(bot: Bot<Context>, deps: BotDeps): void {
  bot.on("callback_query:data", async (ctx) => {
    const data = ctx.callbackQuery.data
    if (data.startsWith("pub:")) {
      await handlePublish(ctx, deps, data.slice(4))
      return
    }
    await handleDraftAction(ctx, deps, data)
  })
}
