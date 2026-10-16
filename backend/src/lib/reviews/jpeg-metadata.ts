// JPEG without its metadata: EXIF (camera, place of the shot), XMP, IPTC and comments are
// dropped; the picture data, JFIF header, colour profile (ICC) and Adobe colour marker stay.
// Null when the file is not a well-formed JPEG.

const SOI = 0xd8
const SOS = 0xda
const EOI = 0xd9
const APP0 = 0xe0
const APP2 = 0xe2
const APP14 = 0xee
const COM = 0xfe

const keepSegment = (marker: number, body: Buffer) =>
  marker === APP0 || marker === APP14 || (marker === APP2 && body.subarray(0, 12).toString("latin1") === "ICC_PROFILE\0")

export function stripJpegMetadata(buf: Buffer): Buffer | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== SOI) return null
  const parts: Buffer[] = [buf.subarray(0, 2)]
  let at = 2
  while (at < buf.length) {
    if (buf[at] !== 0xff) return null
    const marker = buf[at + 1]
    if (marker === 0xff) { at += 1; continue }
    if (marker === EOI) { parts.push(buf.subarray(at, at + 2)); return Buffer.concat(parts) }
    // Standalone markers have no length.
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { parts.push(buf.subarray(at, at + 2)); at += 2; continue }
    if (at + 4 > buf.length) return null
    const length = buf.readUInt16BE(at + 2)
    if (length < 2 || at + 2 + length > buf.length) return null
    const segment = buf.subarray(at, at + 2 + length)
    if (marker === SOS) {
      // The compressed picture runs to the end of the file.
      parts.push(buf.subarray(at))
      return Buffer.concat(parts)
    }
    const isMeta = (marker >= 0xe1 && marker <= 0xef) || marker === COM
    if (!isMeta || keepSegment(marker, segment.subarray(4))) parts.push(segment)
    at += 2 + length
  }
  return null
}
