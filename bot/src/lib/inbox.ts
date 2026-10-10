import { promises as fs } from "node:fs"
import path from "node:path"
import type { Intake, IntakeStatus, IntakeStatusValue } from "../types/intake"
import type { Draft } from "../types/state"
import { readJsonIfExists, renameWithRetry, writeFileAtomic, writeJsonAtomic } from "./fs-atomic"
import { INTAKE_ID_RE, makeIntakeId } from "./intake-id"

/**
 * Черга заявок конвеєра на ноутбуці: <inbox>/<id>/{intake.json, status.json, photos/, layout/}.
 * Поки Денис збирає заявку, файли лежать у <inbox>/.staging/<draftId>/; при відправці
 * папка цілком перейменовується в <inbox>/<id>/, тож конвеєр бачить лише готові заявки.
 */

const STATUS_VALUES: ReadonlySet<IntakeStatusValue> = new Set([
  "new",
  "brief",
  "render",
  "qa",
  "draft",
  "published",
  "rejected",
])

export class Inbox {
  constructor(private readonly root: string) {}

  async ensure(): Promise<void> {
    await fs.mkdir(path.join(this.root, ".staging"), { recursive: true })
  }

  stagingDir(draftId: string): string {
    return path.join(this.root, ".staging", draftId)
  }

  intakeDir(id: string): string {
    if (!INTAKE_ID_RE.test(id)) throw new Error(`Некоректний id заявки: ${id}`)
    return path.join(this.root, id)
  }

  /** Зберігає файл чернетки (фото або макет) у staging. */
  async saveDraftFile(draftId: string, kind: "photo" | "layout", name: string, data: Buffer): Promise<void> {
    const sub = kind === "photo" ? "photos" : "layout"
    await writeFileAtomic(path.join(this.stagingDir(draftId), sub, name), data)
  }

  async discardDraft(draftId: string): Promise<void> {
    await fs.rm(this.stagingDir(draftId), { recursive: true, force: true })
  }

  /**
   * Перетворює чернетку на заявку: пише intake.json і status.json ("new") у staging,
   * потім перейменовує папку в <inbox>/<id>. Повертає записану заявку.
   */
  async submit(draft: Draft, now: Date = new Date()): Promise<Intake> {
    const staging = this.stagingDir(draft.draftId)
    await fs.mkdir(staging, { recursive: true })

    let id = makeIntakeId(now)
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await fs.access(path.join(this.root, id))
        id = makeIntakeId(now)
      } catch {
        break
      }
    }

    const intake: Intake = {
      id,
      source: "telegram",
      priority: "now",
      created_at: now.toISOString(),
      telegram_id: draft.telegramId,
      raw_text: draft.rawText.join("\n").trim(),
      ref: null,
      product: { ...draft.product, sizes_mm: draft.product.sizes_mm.map(([w, h]) => [w, h]) },
    }
    const status: IntakeStatus = {
      status: "new",
      updated_at: now.toISOString(),
      note: "Заявка з Telegram-бота",
      medusa_handle: null,
    }

    await writeJsonAtomic(path.join(staging, "intake.json"), intake)
    await writeJsonAtomic(path.join(staging, "status.json"), status)
    await renameWithRetry(staging, path.join(this.root, id))
    return intake
  }

  /** Поточний статус заявки від конвеєра; null, якщо папки або файлу вже/ще немає. */
  async readStatus(id: string): Promise<IntakeStatus | null> {
    const raw = await readJsonIfExists<Partial<IntakeStatus>>(path.join(this.intakeDir(id), "status.json"))
    if (!raw || typeof raw.status !== "string" || !STATUS_VALUES.has(raw.status as IntakeStatusValue)) {
      return null
    }
    return {
      status: raw.status as IntakeStatusValue,
      updated_at: typeof raw.updated_at === "string" ? raw.updated_at : "",
      note: typeof raw.note === "string" ? raw.note : "",
      medusa_handle: typeof raw.medusa_handle === "string" && raw.medusa_handle ? raw.medusa_handle : null,
    }
  }
}
