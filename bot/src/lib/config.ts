import path from "node:path"
import type { BotConfig } from "../types/config"

const BOT_ROOT = path.resolve(__dirname, "..", "..", "..")

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name]?.trim()
  if (!value) {
    throw new Error(
      `Не задано ${name}. Впишіть його у файл .env поруч із ботом (зразок у .env.example).`,
    )
  }
  return value
}

function parseIds(raw: string | undefined): Set<number> {
  const ids = new Set<number>()
  if (!raw) return ids
  for (const part of raw.split(/[,;\s]+/)) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const id = Number(trimmed)
    if (!Number.isSafeInteger(id) || id <= 0) {
      throw new Error(`ALLOWED_TELEGRAM_IDS: «${trimmed}» не схоже на Telegram ID (лише цифри).`)
    }
    ids.add(id)
  }
  return ids
}

function parsePositiveInt(raw: string | undefined, name: string, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback
  const value = Number(raw)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} має бути цілим додатним числом, зараз «${raw}».`)
  }
  return value
}

function resolveDir(raw: string | undefined, fallback: string): string {
  const value = raw?.trim() ? raw.trim() : fallback
  return path.isAbsolute(value) ? value : path.resolve(BOT_ROOT, value)
}

/** Читає налаштування з process.env; відносні шляхи рахуються від папки бота. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): BotConfig {
  const inboxDir = resolveDir(env.INBOX_DIR, path.join("..", "factory", "inbox"))
  return {
    telegramToken: required(env, "TELEGRAM_BOT_TOKEN"),
    allowedTelegramIds: parseIds(env.ALLOWED_TELEGRAM_IDS),
    inboxDir,
    // За замовчуванням — знімок категорій і матеріалів у папці бота (data/).
    catalogDir: resolveDir(env.CATALOG_DIR, "."),
    stateFile: resolveDir(env.BOT_STATE_FILE, "bot-state.json"),
    medusaBackendUrl: (env.MEDUSA_BACKEND_URL?.trim() || "http://localhost:9000").replace(/\/+$/, ""),
    medusaAdminApiKey: env.MEDUSA_ADMIN_API_KEY?.trim() ?? "",
    statusPollSeconds: parsePositiveInt(env.STATUS_POLL_SECONDS, "STATUS_POLL_SECONDS", 60),
    maxFileBytes: parsePositiveInt(env.MAX_FILE_MB, "MAX_FILE_MB", 20) * 1024 * 1024,
  }
}
