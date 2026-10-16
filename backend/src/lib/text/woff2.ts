// WOFF2 customer fonts (ТЗ §23): unpacked on the server to the TTF or OTF inside, because
// opentype.js reads only TTF, OTF and WOFF. The browser gets the unpacked file back by the
// signed link (lib/text/font-link.ts).

import { decompress } from "wawoff2";
import { sniffFontFormat } from "../../shared/lib/text/font-check";

export function isWoff2(buf: Buffer): boolean {
  return sniffFontFormat(new Uint8Array(buf.subarray(0, 4))) === "woff2";
}

/** The TTF or OTF packed in a WOFF2 file; throws when the file does not unpack. */
export async function unpackWoff2(buf: Buffer): Promise<Buffer> {
  const sfnt = Buffer.from(await decompress(buf));
  if (!sfnt.length) throw new Error("WOFF2 did not unpack");
  return sfnt;
}
