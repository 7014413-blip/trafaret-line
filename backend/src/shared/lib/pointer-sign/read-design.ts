// Reads a pointer sign design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type {
  PointerArrowPlacement, PointerLogo, PointerSignConfig, PointerSignDesign, PointerTextLine,
} from "../../types/pointer-sign";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";
import { findPointerMaterial } from "./find-material";
import { resolvePointerSize } from "./size";

const PLACEMENTS: ReadonlySet<PointerArrowPlacement> = new Set<PointerArrowPlacement>(["none", "start", "end"]);
const FONT_ID = /^[a-z0-9:_-]{1,80}$/i;
const UPLOAD_KEY = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(svg|png|jpe?g)$/i;

const record = (value: unknown, what: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`pointer sign: ${what} is not an object`);
  return value as Record<string, unknown>;
};
const num = (value: unknown, what: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`pointer sign: ${what} is not a number`);
  return n;
};
/** Customer text: control characters removed, spaces collapsed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

function readLine(raw: unknown, cfg: PointerSignConfig): PointerTextLine {
  const line = record(raw, "line");
  const text = clean(line.text);
  if ([...text].length > cfg.maxLineChars) throw new Error("pointer sign: line is too long");
  const fontId = String(line.fontId ?? "");
  if (!FONT_ID.test(fontId)) throw new Error("pointer sign: bad font id");
  const size = num(line.size, "line size");
  if (size < 0.6 || size > 1.6) throw new Error("pointer sign: line size out of range");
  return { text, fontId, size };
}

function readLogo(raw: unknown): PointerLogo | null {
  if (raw == null) return null;
  const logo = record(raw, "logo");
  const uploadKey = logo.uploadKey == null ? null : String(logo.uploadKey);
  if (uploadKey !== null && !UPLOAD_KEY.test(uploadKey)) throw new Error("pointer sign: bad logo file key");
  if (logo.format !== "svg" && logo.format !== "raster") throw new Error("pointer sign: bad logo format");
  const aspect = num(logo.aspect, "logo aspect");
  if (aspect < 0.05 || aspect > 20) throw new Error("pointer sign: logo aspect out of range");
  return {
    uploadKey, fileName: clean(logo.fileName).slice(0, 200), format: logo.format, aspect,
    invert: logo.invert === true, ring: logo.ring === true,
  };
}

export function readPointerSignDesign(raw: unknown, quantity: number, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG): PointerSignDesign {
  const d = record(raw, "design");
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolvePointerSize({ sizeCode, widthMm: num(d.widthMm, "width"), heightMm: num(d.heightMm, "height") }, cfg);
  const direction = num(d.direction, "direction");
  if (direction !== 1 && direction !== -1) throw new Error("pointer sign: bad direction");
  const shape = d.shape === undefined || d.shape === "pointer" ? "pointer" : d.shape === "arrow" ? "arrow" : null;
  if (!shape) throw new Error("pointer sign: bad shape");
  const baseMaterialId = findPointerMaterial(String(d.baseMaterialId ?? "")).id;
  const overlayMaterialId = findPointerMaterial(String(d.overlayMaterialId ?? "")).id;
  if (!Array.isArray(d.lines) || d.lines.length > cfg.maxLines) throw new Error("pointer sign: bad lines");
  const lines = d.lines.map((line) => readLine(line, cfg));
  const arrowRaw = record(d.arrow, "arrow");
  const placement = String(arrowRaw.placement) as PointerArrowPlacement;
  if (!PLACEMENTS.has(placement)) throw new Error("pointer sign: bad arrow placement");
  const lineIndex = Math.round(num(arrowRaw.lineIndex, "arrow line"));
  if (lineIndex < 0 || lineIndex >= Math.max(1, cfg.maxLines)) throw new Error("pointer sign: bad arrow line");
  const logo = readLogo(d.logo);
  if (!lines.some((line) => line.text) && !logo && placement === "none") throw new Error("pointer sign: empty design");
  return {
    sizeCode: size.preset && sizeCode !== "custom" ? size.preset.code : "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, direction, shape, baseMaterialId, overlayMaterialId,
    lines, arrow: { placement, lineIndex }, logo,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
