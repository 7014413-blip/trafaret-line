import type { Api } from "grammy"
import type { BotDeps } from "../types/deps"
import type { IntakeStatus } from "../types/intake"
import type { TrackedIntake } from "../types/state"
import { STATUS_LABELS, escapeHtml, publishKeyboard } from "./card"

/** Завершені заявки зберігаються для /status ще 30 днів, потім прибираються зі стану бота. */
const KEEP_FINISHED_MS = 30 * 24 * 60 * 60 * 1000

function isFinished(item: TrackedIntake): boolean {
  return item.publishedByBot || item.lastStatus === "published" || item.lastStatus === "rejected"
}

function notificationText(item: TrackedIntake, status: IntakeStatus): string {
  const lines = [`Заявка <code>${item.id}</code>: <b>${STATUS_LABELS[status.status]}</b>`]
  if (status.note) lines.push(escapeHtml(status.note))
  if (status.status === "draft") {
    lines.push("", "Перегляньте чернетку в адмінці сайту або публікуйте одразу кнопкою нижче.")
  }
  return lines.join("\n")
}

/**
 * Раз на STATUS_POLL_SECONDS читає status.json відстежуваних заявок
 * і повідомляє Дениса про кожну зміну стану від конвеєра.
 */
export class StatusWatcher {
  private timer: NodeJS.Timeout | null = null
  private running = false

  constructor(
    private readonly api: Api,
    private readonly deps: BotDeps,
  ) {}

  start(): void {
    if (this.timer) return
    const intervalMs = this.deps.config.statusPollSeconds * 1000
    this.timer = setInterval(() => void this.tick(), intervalMs)
    void this.tick()
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
  }

  async tick(now: Date = new Date()): Promise<void> {
    if (this.running) return
    this.running = true
    try {
      for (const item of this.deps.store.tracked()) {
        await this.checkOne(item, now).catch((error: unknown) => {
          console.error(`[status] заявка ${item.id}:`, error)
        })
      }
    } finally {
      this.running = false
    }
  }

  private async checkOne(item: TrackedIntake, now: Date): Promise<void> {
    if (isFinished(item)) {
      if (now.getTime() - Date.parse(item.createdAt) > KEEP_FINISHED_MS) {
        await this.deps.store.deleteTracked(item.id)
      }
      return
    }
    const status = await this.deps.inbox.readStatus(item.id)
    if (!status) return
    const handleChanged = status.medusa_handle !== null && status.medusa_handle !== item.medusaHandle
    if (status.status === item.lastStatus && !handleChanged) return

    const updated: TrackedIntake = {
      ...item,
      lastStatus: status.status,
      medusaHandle: status.medusa_handle ?? item.medusaHandle,
    }
    await this.deps.store.saveTracked(updated)

    if (status.status === item.lastStatus) return
    const canPublish = status.status === "draft" && updated.medusaHandle !== null && this.deps.medusa.enabled
    await this.api.sendMessage(item.chatId, notificationText(updated, status), {
      parse_mode: "HTML",
      ...(canPublish ? { reply_markup: publishKeyboard(item.id) } : {}),
    })
  }
}
