import fs from "node:fs"
import path from "node:path"
import { checkFontBuffer } from "../../shared/lib/text/font-check"
import { isWoff2, unpackWoff2 } from "../text/woff2"

// Arsenal SC (SIL Open Font License, fixtures/arsenal-sc-OFL.txt) packed as WOFF2.
const WOFF2 = fs.readFileSync(path.join(__dirname, "fixtures", "arsenal-sc.woff2"))

describe("WOFF2 customer fonts", () => {
  it("recognises WOFF2 by its first bytes", () => {
    expect(isWoff2(WOFF2)).toBe(true)
    expect(isWoff2(Buffer.from([0, 1, 0, 0, 0]))).toBe(false)
  })

  it("unpacks to a font the constructors can read", async () => {
    const sfnt = await unpackWoff2(WOFF2)
    const check = checkFontBuffer(sfnt.buffer.slice(sfnt.byteOffset, sfnt.byteOffset + sfnt.byteLength) as ArrayBuffer, "arsenal.woff2")
    expect(check.ok).toBe(true)
    expect(check.format).toBe("ttf")
    expect(check.missingCyrillic).toEqual([])
  })

  it("rejects a broken file", async () => {
    await expect(unpackWoff2(Buffer.concat([WOFF2.subarray(0, 200), Buffer.alloc(200)]))).rejects.toThrow()
  })
})
