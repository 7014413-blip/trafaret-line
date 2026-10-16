import { zipStore } from "../orders/zip"

/** Entries read back from the central directory of a stored ZIP. */
function readZip(zip: Buffer): { name: string; crc: number; data: Buffer }[] {
  const end = zip.length - 22
  expect(zip.readUInt32LE(end)).toBe(0x06054b50)
  const count = zip.readUInt16LE(end + 10)
  let at = zip.readUInt32LE(end + 16)
  const out: { name: string; crc: number; data: Buffer }[] = []
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50)
    const crc = zip.readUInt32LE(at + 16)
    const size = zip.readUInt32LE(at + 20)
    const nameLength = zip.readUInt16LE(at + 28)
    const local = zip.readUInt32LE(at + 42)
    const name = zip.subarray(at + 46, at + 46 + nameLength).toString("utf8")
    expect(zip.readUInt32LE(local)).toBe(0x04034b50)
    const dataAt = local + 30 + zip.readUInt16LE(local + 26)
    out.push({ name, crc, data: zip.subarray(dataAt, dataAt + size) })
    at += 46 + nameLength
  }
  return out
}

describe("zipStore", () => {
  it("stores the files with their names, sizes and CRC-32", () => {
    const zip = zipStore([
      { name: "TL-5-1_stencil_pet_thin_300x120mm.svg", data: Buffer.from("<svg/>") },
      { name: "fonts/Шрифт_ab12cd34.ttf", data: Buffer.from("123456789") },
    ])
    const entries = readZip(zip)
    expect(entries.map((e) => e.name)).toEqual(["TL-5-1_stencil_pet_thin_300x120mm.svg", "fonts/Шрифт_ab12cd34.ttf"])
    expect(entries[0].data.toString()).toBe("<svg/>")
    // Check value of CRC-32 for "123456789".
    expect(entries[1].crc).toBe(0xcbf43926)
  })

  it("makes a valid empty archive", () => {
    expect(readZip(zipStore([]))).toEqual([])
  })
})
