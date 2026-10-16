import fs from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { markFontUsed } from "../text/font-usage"
import { deleteUnusedFonts } from "../text/unused-fonts"

const DAY = 86_400_000
const NOW = Date.parse("2026-12-01T12:00:00Z")

async function addFont(dir: string, folder: string, id: string, at: string | null): Promise<string> {
  const key = `${folder}/${id}.ttf`
  await fs.mkdir(path.join(dir, folder), { recursive: true })
  await fs.writeFile(path.join(dir, key), "font")
  if (at) await fs.writeFile(path.join(dir, `${key}.json`), JSON.stringify({ originalName: "f.ttf", family: "F", rightsConfirmed: true, at, ip: "", sha256: "", embeddingRestricted: false }))
  return key
}

describe("deleteUnusedFonts", () => {
  let dir: string
  beforeEach(async () => { dir = await fs.mkdtemp(path.join(os.tmpdir(), "tl-fonts-")) })
  afterEach(async () => { await fs.rm(dir, { recursive: true, force: true }) })

  it("deletes fonts without an order 30 days after the upload, keeps the rest", async () => {
    const old = await addFont(dir, "2026-10-01", "00000000-0000-4000-8000-000000000001", "2026-10-01T10:00:00Z")
    const used = await addFont(dir, "2026-10-01", "00000000-0000-4000-8000-000000000002", "2026-10-01T10:00:00Z")
    const fresh = await addFont(dir, "2026-11-20", "00000000-0000-4000-8000-000000000003", "2026-11-20T10:00:00Z")
    const noNote = await addFont(dir, "2026-09-01", "00000000-0000-4000-8000-000000000004", null)
    await markFontUsed(used, "TL-7", dir)

    expect((await deleteUnusedFonts(dir, NOW)).sort()).toEqual([noNote, old].sort())
    await expect(fs.access(path.join(dir, used))).resolves.toBeUndefined()
    await expect(fs.access(path.join(dir, fresh))).resolves.toBeUndefined()
    await expect(fs.access(path.join(dir, `${old}.json`))).rejects.toThrow()
    // The empty date folder is removed too.
    await expect(fs.access(path.join(dir, "2026-09-01"))).rejects.toThrow()
  })

  it("keeps a font 29 days old", async () => {
    const at = new Date(NOW - 29 * DAY).toISOString()
    await addFont(dir, at.slice(0, 10), "00000000-0000-4000-8000-000000000005", at)
    expect(await deleteUnusedFonts(dir, NOW)).toEqual([])
  })
})
