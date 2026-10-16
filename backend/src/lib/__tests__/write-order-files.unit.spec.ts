import fs from "node:fs"
import fsp from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { customFontId } from "../../shared/lib/text/custom-font-id"
import { readFontNote } from "../text/font-usage"
import { unpackWoff2 } from "../text/woff2"
import { writeOrderFiles } from "../orders/write-order-files"

const FONT_KEY = "2026-10-16/0b5c1d1e-1234-4abc-8def-0123456789ab.ttf"
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47])

describe("writeOrderFiles", () => {
  let root: string
  const saved = { orders: process.env.ORDER_FILES_DIR, fonts: process.env.CUSTOM_FONTS_DIR }

  beforeAll(async () => {
    root = await fsp.mkdtemp(path.join(os.tmpdir(), "tl-order-"))
    process.env.ORDER_FILES_DIR = path.join(root, "orders")
    process.env.CUSTOM_FONTS_DIR = path.join(root, "fonts")
    // A customer font (Arsenal SC, SIL OFL) uploaded as WOFF2 and stored unpacked.
    const sfnt = await unpackWoff2(fs.readFileSync(path.join(__dirname, "fixtures", "arsenal-sc.woff2")))
    const file = path.join(root, "fonts", ...FONT_KEY.split("/"))
    await fsp.mkdir(path.dirname(file), { recursive: true })
    await fsp.writeFile(file, sfnt)
    await fsp.writeFile(`${file}.json`, JSON.stringify({ originalName: "Arsenal.woff2", family: "Arsenal SC", rightsConfirmed: true, at: "2026-10-16T10:00:00Z", ip: "", sha256: "x", embeddingRestricted: false, convertedFrom: "woff2" }))
  })

  afterAll(async () => {
    process.env.ORDER_FILES_DIR = saved.orders
    process.env.CUSTOM_FONTS_DIR = saved.fonts
    await fsp.rm(root, { recursive: true, force: true })
  })

  it("writes machine files named by order and position, previews, parameters and fonts", async () => {
    const result = await writeOrderFiles({
      id: "order_1",
      displayId: 42,
      items: [
        {
          title: "Свій напис «ОБОРОНА»", quantity: 2,
          metadata: { position: 1, kind: "stencil", materialId: "pet_thin", widthCm: 30, heightCm: 11.9, spec: { text: "ОБОРОНА", fontId: "montserrat", lineFontIds: [], align: "center", upper: false, widthMm: 300, marginMm: 15, square: false, bridgeStrength: "normal" } },
        },
        {
          title: "Напис цілим словом «Софія»", quantity: 1,
          metadata: { position: 2, kind: "welded", materialId: "acrylic_3", widthCm: 20, heightCm: 8, spec: { text: "Софія", fontId: customFontId(FONT_KEY), lineFontIds: [], align: "center", upper: false, colourId: "clear", weld: {} } },
        },
        {
          title: "Табличка", quantity: 1,
          metadata: { position: 3, kind: "plaque", previewSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 5"><rect width="10" height="5" fill="#111"/></svg>' },
        },
        { title: "Трафарет за макетом клієнта", quantity: 1, metadata: { position: 4, kind: "stencil", materialId: "pet_thin", uploadKey: "2026-10-16/x.pdf", spec: null } },
      ],
    })

    const names = result.files.map((f) => f.name)
    expect(result.orderNumber).toBe("TL-42")
    expect(result.problems).toEqual([])
    const stencil = names.find((n) => /^TL-42-1_stencil_pet_thin_300x\d+mm\.svg$/.test(n))
    expect(stencil).toBeDefined()
    const base = stencil!.replace(/\.svg$/, "")
    expect(names).toEqual(expect.arrayContaining([`${base}.dxf`, `${base}.png`, "TL-42-3_plaque_preview.png", "TL-42_params.json", "fonts/Arsenal-SC_0b5c1d1e.ttf"]))
    expect(names.some((n) => /^TL-42-2_word_acrylic_3_\d+x\d+mm\.dxf$/.test(n))).toBe(true)
    expect(names.some((n) => n.startsWith("TL-42-4"))).toBe(false)

    const folder = path.join(root, "orders", "TL-42")
    expect(fs.readFileSync(path.join(folder, `${base}.png`)).subarray(0, 4)).toEqual(PNG)
    expect(fs.readFileSync(path.join(folder, `${base}.svg`), "utf8")).toContain("Order TL-42, item 1 of 4")
    const dxf = fs.readFileSync(path.join(folder, `${base}.dxf`), "utf8")
    expect(dxf).toContain("INFO\n62\n8")
    expect(dxf).toContain("Material: PET 0.5 mm")

    const params = JSON.parse(fs.readFileSync(path.join(folder, "TL-42_params.json"), "utf8"))
    expect(params.lines).toHaveLength(4)
    expect(params.lines[2].previewSvg).toBeUndefined()
    expect(params.fonts[0]).toMatchObject({ key: FONT_KEY, family: "Arsenal SC" })
    expect((await readFontNote(FONT_KEY))?.orders).toEqual(["TL-42"])
  }, 60_000)

  it("reports a line it cannot rebuild instead of failing the order", async () => {
    const result = await writeOrderFiles({
      id: "order_2", displayId: 43,
      items: [{ title: "Свій напис", quantity: 1, metadata: { kind: "stencil", materialId: "pet_thin", widthCm: 30, spec: { text: "Тест", fontId: "no-such-font" } } }],
    })
    expect(result.problems).toEqual([expect.stringContaining("Позиція 1: файл для станка не зібрано")])
    expect(result.files.map((f) => f.name)).toEqual(["TL-43_params.json"])
  })
})
