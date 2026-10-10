// Content check of customer layout files (QA 2026-10-10, plan «Безопасность» P1): the file
// must start like its format, and an SVG must not carry scripts, event handlers or external
// references, because a manager opens it in a browser.

export type LayoutFormat = "dxf" | "ai" | "eps" | "pdf" | "svg" | "cdr" | "png" | "jpg" | "jpeg";

export const LAYOUT_FORMATS: ReadonlySet<string> = new Set<LayoutFormat>(["dxf", "ai", "eps", "pdf", "svg", "cdr", "png", "jpg", "jpeg"]);

const startsWith = (buf: Buffer, bytes: number[]) => bytes.every((b, i) => buf[i] === b);
const head = (buf: Buffer, n = 2048) => buf.subarray(0, n).toString("latin1");

/** Null when the file looks like its extension says, otherwise the reason (for the log). */
export function checkLayoutFile(ext: LayoutFormat, buf: Buffer): string | null {
  if (buf.length < 8) return "file too small";
  if (startsWith(buf, [0x4d, 0x5a])) return "executable";
  switch (ext) {
    case "png":
      return startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]) ? null : "not a PNG";
    case "jpg":
    case "jpeg":
      return startsWith(buf, [0xff, 0xd8, 0xff]) ? null : "not a JPEG";
    case "pdf":
      return head(buf, 1024).includes("%PDF-") ? null : "not a PDF";
    case "ai":
      // Illustrator files are PDF- or PostScript-based.
      return /%PDF-|%!PS-Adobe/.test(head(buf, 1024)) ? null : "not an AI file";
    case "eps":
      return startsWith(buf, [0xc5, 0xd0, 0xd3, 0xc6]) || head(buf, 1024).includes("%!PS-Adobe") ? null : "not an EPS file";
    case "cdr":
      // CorelDRAW: RIFF container (old versions) or ZIP (X4 and newer).
      return startsWith(buf, [0x52, 0x49, 0x46, 0x46]) || startsWith(buf, [0x50, 0x4b, 0x03, 0x04]) ? null : "not a CDR file";
    case "dxf": {
      const text = head(buf, 4096);
      return /(^|\n)\s*0\s*\r?\n\s*SECTION/i.test(text) || startsWith(buf, Array.from(Buffer.from("AutoCAD Binary DXF"))) ? null : "not a DXF file";
    }
    case "svg":
      return checkSvg(buf.toString("utf8"));
    default:
      return "unknown format";
  }
}

function checkSvg(text: string): string | null {
  if (!/<svg[\s>]/i.test(text.slice(0, 4096))) return "not an SVG";
  if (/<script[\s>]/i.test(text)) return "SVG with a script";
  if (/\son[a-z]+\s*=/i.test(text)) return "SVG with an event handler";
  if (/(href|src)\s*=\s*["']\s*(javascript:|data:text\/html|https?:)/i.test(text)) return "SVG with an external or script link";
  if (/<foreignObject[\s>]/i.test(text)) return "SVG with embedded HTML";
  if (/<!ENTITY/i.test(text)) return "SVG with XML entities";
  return null;
}
