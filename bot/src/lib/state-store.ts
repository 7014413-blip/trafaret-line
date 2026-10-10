import type { BotState, Draft, TrackedIntake } from "../types/state"
import { readJsonIfExists, writeJsonAtomic } from "./fs-atomic"

function emptyState(): BotState {
  return { version: 1, drafts: {}, tracked: {} }
}

/**
 * Стан бота у файлі: чернетки, що збираються, і заявки, за якими бот стежить.
 * Переживає перезапуск ноутбука. Записи серіалізуються в черзі, щоб не перетирати одне одного.
 */
export class StateStore {
  private state: BotState = emptyState()
  private writeChain: Promise<void> = Promise.resolve()

  constructor(private readonly file: string) {}

  async load(): Promise<void> {
    const loaded = await readJsonIfExists<BotState>(this.file)
    if (loaded && loaded.version === 1) {
      this.state = {
        version: 1,
        drafts: loaded.drafts ?? {},
        tracked: loaded.tracked ?? {},
      }
    }
  }

  private persist(): Promise<void> {
    const snapshot = JSON.parse(JSON.stringify(this.state)) as BotState
    this.writeChain = this.writeChain
      .catch(() => undefined)
      .then(() => writeJsonAtomic(this.file, snapshot))
    return this.writeChain
  }

  draftForUser(telegramId: number): Draft | null {
    return this.state.drafts[String(telegramId)] ?? null
  }

  async saveDraft(draft: Draft): Promise<void> {
    this.state.drafts[String(draft.telegramId)] = draft
    await this.persist()
  }

  async deleteDraft(telegramId: number): Promise<void> {
    delete this.state.drafts[String(telegramId)]
    await this.persist()
  }

  tracked(): TrackedIntake[] {
    return Object.values(this.state.tracked)
  }

  trackedById(id: string): TrackedIntake | null {
    return this.state.tracked[id] ?? null
  }

  async saveTracked(item: TrackedIntake): Promise<void> {
    this.state.tracked[item.id] = item
    await this.persist()
  }

  async deleteTracked(id: string): Promise<void> {
    delete this.state.tracked[id]
    await this.persist()
  }
}
