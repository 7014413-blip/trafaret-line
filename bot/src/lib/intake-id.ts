import { randomBytes } from "node:crypto"

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789"

function pad(n: number): string {
  return String(n).padStart(2, "0")
}

function randomSuffix(length: number): string {
  const bytes = randomBytes(length)
  let out = ""
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length]
  return out
}

/**
 * Ідентифікатор заявки за схемою конвеєра: YYYYMMDD-HHMMSS-tg-xxxx (час UTC).
 * Приклад: 20261010-201500-tg-a7f3.
 */
export function makeIntakeId(now: Date = new Date()): string {
  const date = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}`
  const time = `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`
  return `${date}-${time}-tg-${randomSuffix(4)}`
}

export const INTAKE_ID_RE = /^\d{8}-\d{6}-(tg|scout)-[a-z0-9]{4}$/

/** Внутрішній ідентифікатор чернетки, поки Денис її збирає. */
export function makeDraftId(): string {
  return `d${Date.now().toString(36)}${randomSuffix(4)}`
}
