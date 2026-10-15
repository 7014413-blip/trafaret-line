// Reads a pointer sign design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type {
  PointerArrowPlacement, PointerLogo, PointerSignConfig, PointerSignDesign, PointerTextLine,
} from "../../types/pointer-sign";
import { DEFAULT_POINTER_SIGN_CONFIG } from "./config";
import { findPointerMaterial } from "./find-material";
import { resolvePointerSize } from "./size";
import { createDesignReader } from "../validation/design-reader";
import type { DesignReader } from "../../types/design-reader";

const PLACEMENTS: ReadonlySet<PointerArrowPlacement> = new Set<PointerArrowPlacement>(["none", "start", "end"]);
const FONT_ID = /^[a-z0-9:_-]{1,80}$/i;
const UPLOAD_KEY = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.(svg|png|jpe?g)$/i;

const read: DesignReader = createDesignReader("pointer sign");

function readLine(raw: unknown, cfg: PointerSignConfig): PointerTextLine {
  return read.textLine(raw, { maxChars: cfg.maxLineChars, fontId: FONT_ID, minSize: 0.6, maxSize: 1.6 });
}

function readLogo(raw: unknown): PointerLogo | null {
  if (raw == null) return null;
  const logo = read.record(raw, "logo");
  const uploadKey = logo.uploadKey == null ? null : String(logo.uploadKey);
  if (uploadKey !== null && !UPLOAD_KEY.test(uploadKey)) read.fail("bad logo file key");
  if (logo.format !== "svg" && logo.format !== "raster") read.fail("bad logo format");
  const aspect = read.num(logo.aspect, "logo aspect");
  if (aspect < 0.05 || aspect > 20) read.fail("logo aspect out of range");
  return {
    uploadKey, fileName: read.clean(logo.fileName).slice(0, 200), format: logo.format, aspect,
    invert: logo.invert === true, ring: logo.ring === true,
  };
}

export function readPointerSignDesign(raw: unknown, quantity: number, cfg: PointerSignConfig = DEFAULT_POINTER_SIGN_CONFIG): PointerSignDesign {
  const d = read.record(raw, "design");
  const sizeCode = String(d.sizeCode ?? "");
  const size = resolvePointerSize({ sizeCode, widthMm: read.num(d.widthMm, "width"), heightMm: read.num(d.heightMm, "height") }, cfg);
  const direction = read.num(d.direction, "direction");
  if (direction !== 1 && direction !== -1) read.fail("bad direction");
  const shape = d.shape === undefined || d.shape === "pointer" ? "pointer" : d.shape === "arrow" ? "arrow" : null;
  if (!shape) read.fail("bad shape");
  const baseMaterialId = findPointerMaterial(String(d.baseMaterialId ?? "")).id;
  const overlayMaterialId = findPointerMaterial(String(d.overlayMaterialId ?? "")).id;
  const lines = read.list(d.lines, cfg.maxLines, "lines").map((line) => readLine(line, cfg));
  const arrowRaw = read.record(d.arrow, "arrow");
  const placement = String(arrowRaw.placement) as PointerArrowPlacement;
  if (!PLACEMENTS.has(placement)) read.fail("bad arrow placement");
  const lineIndex = Math.round(read.num(arrowRaw.lineIndex, "arrow line"));
  if (lineIndex < 0 || lineIndex >= Math.max(1, cfg.maxLines)) read.fail("bad arrow line");
  const logo = readLogo(d.logo);
  if (!lines.some((line) => line.text) && !logo && placement === "none") read.fail("empty design");
  return {
    sizeCode: size.preset && sizeCode !== "custom" ? size.preset.code : "custom",
    widthMm: size.widthMm, heightMm: size.heightMm, direction, shape, baseMaterialId, overlayMaterialId,
    lines, arrow: { placement, lineIndex }, logo,
    quantity: read.quantity(quantity),
  };
}
