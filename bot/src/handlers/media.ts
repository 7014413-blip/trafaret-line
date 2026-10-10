import type { Bot, Context } from "grammy"
import { scheduleCardRepost } from "../lib/card-refresh"
import { applyText, newDraft } from "../lib/draft"
import { classifyDocument, downloadTelegramFile, extensionOf, safeFileName } from "../lib/telegram-files"
import type { BotDeps } from "../types/deps"
import type { IncomingFile } from "../types/files"
import type { Draft, DraftFile } from "../types/state"

function nextName(draft: Draft, file: IncomingFile): string {
  if (file.kind === "photo") {
    const index = draft.files.filter((f) => f.kind === "photo").length + 1
    const ext = extensionOf(file.originalName) || file.fallbackExt
    return `${String(index).padStart(2, "0")}.${ext === "jpeg" ? "jpg" : ext}`
  }
  const name = safeFileName(file.originalName, "layout", file.fallbackExt)
  const taken = new Set(draft.files.map((f) => f.name))
  if (!taken.has(name)) return name
  const dot = name.lastIndexOf(".")
  for (let i = 2; ; i++) {
    const candidate = `${name.slice(0, dot)}-${i}${name.slice(dot)}`
    if (!taken.has(candidate)) return candidate
  }
}

async function acceptFile(ctx: Context, deps: BotDeps, file: IncomingFile): Promise<void> {
  const userId = ctx.from?.id
  const chatId = ctx.chat?.id
  if (userId === undefined || chatId === undefined) return

  if (file.size !== undefined && file.size > deps.config.maxFileBytes) {
    await ctx.reply(
      `Файл завеликий (${(file.size / 1024 / 1024).toFixed(1)} МБ). Telegram дозволяє ботам до 20 МБ: стисніть або надішліть як фото.`,
    )
    return
  }

  // Завантажуємо поза чергою користувача, щоб альбом качався паралельно.
  const data = await downloadTelegramFile(ctx.api, deps.config.telegramToken, file.fileId, deps.config.maxFileBytes)
  const caption = ctx.message?.caption ?? ""

  await deps.lock.run(userId, async () => {
    let draft = deps.store.draftForUser(userId) ?? newDraft(chatId, userId)
    if (draft.files.some((f) => f.uniqueId === file.uniqueId)) return

    const name = nextName(draft, file)
    await deps.inbox.saveDraftFile(draft.draftId, file.kind, name, data)
    const entry: DraftFile = { name, kind: file.kind, uniqueId: file.uniqueId }
    draft = { ...draft, files: [...draft.files, entry] }
    if (caption.trim()) draft = applyText(draft, caption, deps.catalog)
    await deps.store.saveDraft(draft)
  })
  scheduleCardRepost(ctx.api, deps, userId)
}

export function registerMediaHandlers(bot: Bot<Context>, deps: BotDeps): void {
  bot.on("message:photo", async (ctx) => {
    const sizes = ctx.message.photo
    const largest = sizes[sizes.length - 1]
    if (!largest) return
    await acceptFile(ctx, deps, {
      fileId: largest.file_id,
      uniqueId: largest.file_unique_id,
      kind: "photo",
      originalName: undefined,
      fallbackExt: "jpg",
      size: largest.file_size,
    })
  })

  bot.on("message:document", async (ctx) => {
    const doc = ctx.message.document
    const kind = classifyDocument(doc.file_name, doc.mime_type)
    if (kind === "unsupported") {
      await ctx.reply(
        "Такий файл бот не приймає. Підходять фото (JPG, PNG, WEBP, HEIC) і макети (SVG, DXF, PDF, AI, EPS, CDR, PLT).",
      )
      return
    }
    await acceptFile(ctx, deps, {
      fileId: doc.file_id,
      uniqueId: doc.file_unique_id,
      kind,
      originalName: doc.file_name,
      fallbackExt: kind === "photo" ? "jpg" : "bin",
      size: doc.file_size,
    })
  })

  bot.on(["message:video", "message:animation", "message:sticker", "message:voice", "message:audio"], async (ctx) => {
    await ctx.reply("Поки що бот приймає лише фото, макети й текст. Надішліть фото товару з підписом.")
  })
}
