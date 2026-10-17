// PNG without its text and EXIF chunks (tEXt, zTXt, iTXt, eXIf, tIME); picture chunks stay.
// Null when the file is not a well-formed PNG.

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const DROP = new Set(["tEXt", "zTXt", "iTXt", "eXIf", "tIME"])

export function stripPngMetadata(buf: Buffer): Buffer | null {
  if (buf.length < SIGNATURE.length + 12 || !buf.subarray(0, 8).equals(SIGNATURE)) return null
  const parts: Buffer[] = [SIGNATURE]
  let at = 8
  let first = true
  while (at + 12 <= buf.length) {
    const length = buf.readUInt32BE(at)
    const type = buf.subarray(at + 4, at + 8).toString("latin1")
    const end = at + 12 + length
    if (end > buf.length) return null
    if (first && type !== "IHDR") return null
    first = false
    if (!DROP.has(type)) parts.push(buf.subarray(at, end))
    at = end
    if (type === "IEND") return Buffer.concat(parts)
  }
  return null
}
