// GET /store/tl-font/file?key=…&exp=…&sig=… → a stored customer font, only by the signed link
// the upload returned (lib/text/font-link.ts). Without a valid, unexpired signature: 404, so
// the stored fonts cannot be listed or guessed.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { readFile } from "node:fs/promises"
import path from "node:path"
import { isValidFontKey } from "../../../../shared/lib/text/custom-font-id"
import { isValidFontLink } from "../../../../lib/text/font-link"
import { fontFiles } from "../../../../lib/text/font-usage"

const TYPES: Record<string, string> = { ".ttf": "font/ttf", ".otf": "font/otf", ".woff": "font/woff" }
const one = (value: unknown) => (typeof value === "string" ? value : "")

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const key = one(req.query.key)
  if (!isValidFontKey(key) || !isValidFontLink(key, one(req.query.exp), one(req.query.sig))) {
    return res.status(404).json({ message: "Not found" })
  }
  const data = await readFile(fontFiles(key).file).catch(() => null)
  if (!data) return res.status(404).json({ message: "Not found" })
  res.setHeader("content-type", TYPES[path.extname(key)] ?? "application/octet-stream")
  res.setHeader("cache-control", "private, max-age=86400")
  res.setHeader("x-content-type-options", "nosniff")
  res.send(data)
}
