// A review photo as it is kept: JPEG or PNG only, without metadata (a phone photo carries the
// place where it was taken). The browser already sends a reduced JPEG without EXIF
// (web lib/client/resize-photo.ts); this is the server's own check.

import { stripJpegMetadata } from "./jpeg-metadata"
import { stripPngMetadata } from "./png-metadata"

export function cleanReviewPhoto(buf: Buffer): { ext: "jpg" | "png"; data: Buffer } | null {
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    const data = stripJpegMetadata(buf)
    return data ? { ext: "jpg", data } : null
  }
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    const data = stripPngMetadata(buf)
    return data ? { ext: "png", data } : null
  }
  return null
}
