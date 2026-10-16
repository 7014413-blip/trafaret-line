import fs from "node:fs"
import fsp from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { CatalogLineSource } from "../../types/masters"
import { cleanMasterCache } from "../masters/clean-master-cache"
import { masterCut } from "../masters/master-cut"
import { writeCatalogLine } from "../orders/write-catalog-line"

// A master like the catalogue ones: a ring (hole inside) and a bar, drawn in black on 100 × 100.
const MASTER = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">'
  + '<path d="M50 10a30 30 0 1 1 0 60a30 30 0 1 1 0-60zM50 25a15 15 0 1 0 0 30a15 15 0 1 0 0-30z" fill="#000" fill-rule="evenodd"/>'
  + '<rect x="10" y="80" width="80" height="10" fill="#000"/></svg>'

const SOURCE: CatalogLineSource = {
  handle: "trafaret-kilce",
  sizeCode: "q30",
  sizeLabel: "30 × 30 см",
  sheetMm: [330, 330],
  detail: "малюнок 30 × 30 см, аркуш 33 × 33 см",
  designUrls: ["https://example.test/kilce.svg"],
  materialCode: "pet05",
  sku: "TL-TRAFARET-KILCE-Q30-PET05",
}

describe("master layouts and the size cache", () => {
  let root: string

  beforeEach(async () => {
    root = await fsp.mkdtemp(path.join(os.tmpdir(), "tl-masters-"))
  })

  afterEach(async () => {
    await fsp.rm(root, { recursive: true, force: true })
  })

  it("builds a size once and takes a repeat order of the same size from the cache", async () => {
    const read = jest.fn(async () => MASTER)
    const first = await masterCut(SOURCE, read, root)
    expect(first.fromCache).toBe(false)
    expect(read).toHaveBeenCalledTimes(1)
    expect(first.cut.article).toBe("TL-TRAFARET-KILCE")
    expect(first.cut.pieces).toHaveLength(1)
    const piece = first.cut.pieces[0]
    // Ring outside, its hole and the bar: three loops, the picture fitted into 300 mm.
    expect(piece.cutPaths.length).toBe(3)
    expect(Math.max(piece.designWidthMm, piece.designHeightMm)).toBeGreaterThan(290)
    expect(Math.max(piece.designWidthMm, piece.designHeightMm)).toBeLessThanOrEqual(300.5)
    const xs = piece.cutPaths.flat().map((p) => p[0])
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0)
    expect(Math.max(...xs)).toBeLessThanOrEqual(330)
    for (const file of first.files) expect(fs.existsSync(file)).toBe(true)
    expect(first.files.map((f) => path.relative(root, f))).toEqual([
      expect.stringMatching(/^TL-TRAFARET-KILCE[\\/]q30_330x330mm_[0-9a-f]{10}\.json$/),
      expect.stringMatching(/-1\.svg$/),
      expect.stringMatching(/-1\.dxf$/),
    ])

    const old = new Date("2026-01-01T00:00:00Z")
    for (const file of first.files) await fsp.utimes(file, old, old)
    const again = await masterCut(SOURCE, read, root)
    expect(again.fromCache).toBe(true)
    expect(read).toHaveBeenCalledTimes(1)
    expect(again.cut.pieces[0].cutPaths).toEqual(piece.cutPaths)
    // A used size is touched, so the cleaning keeps it.
    for (const file of again.files) expect(fs.statSync(file).mtimeMs).toBeGreaterThan(old.getTime())

    const other = await masterCut({ ...SOURCE, sizeCode: "q20", sheetMm: [230, 230], detail: "малюнок 20 × 20 см, аркуш 23 × 23 см" }, read, root)
    expect(other.fromCache).toBe(false)
    expect(read).toHaveBeenCalledTimes(2)
  })

  it("refuses a product without a master layout", async () => {
    await expect(masterCut({ ...SOURCE, designUrls: [] }, async () => MASTER, root)).rejects.toThrow("no master layout")
  })

  it("deletes sizes nobody used for 90 days and their empty folders", async () => {
    const read = async () => MASTER
    const kept = await masterCut(SOURCE, read, root)
    const gone = await masterCut({ ...SOURCE, handle: "trafaret-staryi" }, read, root)
    const now = new Date("2026-10-16T04:00:00Z")
    const stale = new Date(now.getTime() - 91 * 24 * 60 * 60 * 1000)
    const fresh = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000)
    for (const file of gone.files) await fsp.utimes(file, stale, stale)
    for (const file of kept.files) await fsp.utimes(file, fresh, fresh)

    const deleted = await cleanMasterCache(root, now)
    expect(deleted).toHaveLength(3)
    expect(deleted.every((name) => name.startsWith("TL-TRAFARET-STARYI"))).toBe(true)
    expect(fs.existsSync(path.join(root, "TL-TRAFARET-STARYI"))).toBe(false)
    for (const file of kept.files) expect(fs.existsSync(file)).toBe(true)
    expect(await cleanMasterCache(path.join(root, "missing"), now)).toEqual([])
  })

  it("writes the order's machine files of a catalogue line with the INFO lines and the master", async () => {
    const folder = path.join(root, "order")
    await fsp.mkdir(folder)
    const made = await writeCatalogLine(folder, "TL-7", 2, SOURCE,
      (material, w, h) => [`Order: TL-7 #2`, `Material: ${material} ${w}x${h}`],
      (source) => masterCut(source, async () => MASTER, path.join(root, "cache")))
    expect(made.files).toEqual(["TL-7-2_catalog_pet05_330x330mm.svg", "TL-7-2_catalog_pet05_330x330mm.dxf", "TL-7-2_catalog_pet05_330x330mm.png"])
    expect(made.article).toBe("TL-TRAFARET-KILCE")
    expect(made.fromCache).toBe(false)
    expect(made.previewSvg).toContain('fill-rule="evenodd"')
    const svg = await fsp.readFile(path.join(folder, made.files[0]), "utf8")
    expect(svg).toContain("Master: TL-TRAFARET-KILCE q30")
    expect(svg).toContain("Material: pet05 330x330")
    const png = await fsp.readFile(path.join(folder, made.files[2]))
    expect(png.subarray(1, 4).toString()).toBe("PNG")

    const set = await writeCatalogLine(folder, "TL-7", 3, { ...SOURCE, designUrls: ["a.svg", "b.svg"] }, () => [],
      (source) => masterCut(source, async () => MASTER, path.join(root, "cache")))
    expect(set.files.filter((f) => f.endsWith(".svg"))).toEqual(["TL-7-3_catalog_pet05_330x330mm_p1.svg", "TL-7-3_catalog_pet05_330x330mm_p2.svg"])
  })
})
