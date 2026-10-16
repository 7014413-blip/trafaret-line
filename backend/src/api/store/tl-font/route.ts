// POST /store/tl-font { name, data(base64), rightsConfirmed } → { key, id, name, format, sizeBytes, url, convertedFrom }
// A customer's own font for the constructors (Денис 10.10). The file is checked with the
// same code as in the browser (shared/lib/text/font-check.ts), stored under
// backend/uploads/fonts with a random name and used only for this customer's orders:
// it never appears in the public font list and is read back only by the signed link `url`
// (lib/text/font-link.ts). WOFF2 is unpacked here to the TTF or OTF inside (ТЗ §23), and the
// browser takes that file by the link. Fonts no order uses are deleted after 30 days
// (jobs/delete-unused-fonts.ts). Requests per address are limited in api/middlewares.ts.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { createHash, randomUUID } from "node:crypto"
import { clientAddress } from "../../../lib/rate-limit"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { checkFontBuffer, MAX_FONT_BYTES } from "../../../shared/lib/text/font-check"
import { customFontId } from "../../../shared/lib/text/custom-font-id"
import { customFontsDir } from "../../../lib/text/node-fonts"
import { fontLink } from "../../../lib/text/font-link"
import { isWoff2, unpackWoff2 } from "../../../lib/text/woff2"
import type { FontSidecar } from "../../../types/order-files"

interface FontUploadBody {
  name?: string
  data?: string
  rightsConfirmed?: boolean
}

export async function POST(req: MedusaRequest<FontUploadBody>, res: MedusaResponse) {
  if (req.body?.rightsConfirmed !== true) {
    return res.status(400).json({ message: "Підтвердьте, що маєте право використовувати цей шрифт" })
  }
  const name = String(req.body?.name ?? "font").slice(0, 200)
  const received = Buffer.from(String(req.body?.data ?? ""), "base64")
  if (!received.length || received.length > MAX_FONT_BYTES) return res.status(400).json({ message: "Файл порожній або більший за 10 МБ" })

  const woff2 = isWoff2(received)
  let buf: Buffer = received
  if (woff2) {
    try {
      buf = await unpackWoff2(received)
    } catch {
      return res.status(400).json({ message: "Файл WOFF2 пошкоджений і не відкривається. Спробуйте TTF або OTF" })
    }
  }
  const check = checkFontBuffer(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer, name)
  if (!check.ok || !check.format) return res.status(400).json({ message: check.error ?? "Шрифт не підходить" })

  const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${check.format}`
  const file = path.join(customFontsDir(), ...key.split("/"))
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, buf)
  // The rights confirmation (time, address, hash of the file the customer sent) is kept next
  // to the font for production (ТЗ v0.9 §6.3); orders that use the font are added later.
  const note: FontSidecar = {
    originalName: name,
    family: check.familyName,
    rightsConfirmed: true,
    at: new Date().toISOString(),
    ip: clientAddress(req),
    sha256: createHash("sha256").update(received).digest("hex"),
    embeddingRestricted: check.embeddingRestricted,
    ...(woff2 ? { convertedFrom: "woff2" as const } : {}),
  }
  await writeFile(`${file}.json`, JSON.stringify(note))
  return res.json({
    key, id: customFontId(key), name: check.familyName, format: check.format, sizeBytes: buf.length,
    url: fontLink(key), convertedFrom: woff2 ? "woff2" : null,
  })
}
