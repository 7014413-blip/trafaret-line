// Creates the secret admin API key of the Telegram bot («Опублікувати на сайті») and writes
// it straight into bot/.env (MEDUSA_ADMIN_API_KEY), so the key is never printed or pasted.
// Run with Medusa stopped: npx medusa exec ./src/scripts/create-bot-api-key.ts
// An existing non-empty MEDUSA_ADMIN_API_KEY in bot/.env is kept (no second key).

import type { ExecArgs } from "@medusajs/framework/types"
import { createApiKeysWorkflow } from "@medusajs/medusa/core-flows"
import fs from "node:fs"
import path from "node:path"

const KEY_NAME = "MEDUSA_ADMIN_API_KEY"

function botDir(): string {
  return process.env.BOT_DIR ?? path.resolve(process.cwd(), "..", "bot")
}

function readEnv(dir: string): string {
  const env = path.join(dir, ".env")
  if (fs.existsSync(env)) return fs.readFileSync(env, "utf8")
  const example = path.join(dir, ".env.example")
  if (!fs.existsSync(example)) throw new Error(`No .env or .env.example in ${dir}`)
  return fs.readFileSync(example, "utf8")
}

function currentKey(text: string): string {
  const line = text.split(/\r?\n/).find((l) => l.startsWith(`${KEY_NAME}=`))
  return line ? line.slice(KEY_NAME.length + 1).trim() : ""
}

export default async function createBotApiKey({ container }: ExecArgs) {
  const logger = container.resolve("logger")
  const dir = botDir()
  const text = readEnv(dir)
  if (currentKey(text)) {
    logger.info(`${KEY_NAME} is already set in ${path.join(dir, ".env")}, nothing to do`)
    return
  }

  const { result } = await createApiKeysWorkflow(container).run({
    input: { api_keys: [{ title: "Telegram-бот товарів", type: "secret", created_by: "" }] },
  })
  const token = (result as { token: string }[])[0]?.token
  if (!token) throw new Error("Medusa did not return the new key")

  const lines = text.split(/\r?\n/)
  const index = lines.findIndex((l) => l.startsWith(`${KEY_NAME}=`))
  if (index >= 0) lines[index] = `${KEY_NAME}=${token}`
  else lines.push(`${KEY_NAME}=${token}`)
  fs.writeFileSync(path.join(dir, ".env"), lines.join("\r\n"), "utf8")
  logger.info(`Secret API key «Telegram-бот товарів» created and written to ${path.join(dir, ".env")}`)
}
