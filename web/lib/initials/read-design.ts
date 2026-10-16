// Reads a wedding initials design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { InitialsConfig, InitialsDesign, InitialsMode, InitialsSeparator } from "../../types/initials";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { DEFAULT_INITIALS_CONFIG } from "./config";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";
import type { DesignReader } from "../../types/design-reader";

const SEPARATORS = new Set<InitialsSeparator>(["bar", "amp", "plus", "dot", "none"]);
const MODES = new Set<InitialsMode>(["pieces", "topper"]);

const read: DesignReader = createDesignReader("initials");
/** Letters: control characters and every space removed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, "").replace(/\s+/g, "").trim();

export function readInitialsDesign(raw: unknown, quantity: number, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG): InitialsDesign {
  const d = read.record(raw, "design");
  const first = clean(d.first);
  const second = clean(d.second);
  if ([...first].length > cfg.maxChars || [...second].length > cfg.maxChars || (!first && !second)) read.fail("bad letters");
  const separator = String(d.separator) as InitialsSeparator;
  if (!SEPARATORS.has(separator)) read.fail("bad separator");
  const mode = String(d.mode) as InitialsMode;
  if (!MODES.has(mode)) read.fail("bad mode");
  const fontId = String(d.fontId ?? "");
  if (!FONT_ID_PATTERN.test(fontId)) read.fail("bad font id");
  const letterHeightMm = Math.round(Number(d.letterHeightMm));
  if (!Number.isFinite(letterHeightMm) || letterHeightMm < cfg.minLetterMm || letterHeightMm > cfg.maxLetterMm) read.fail("letter height out of range");
  return {
    first, second, separator, fontId, letterHeightMm, mode,
    materialId: findJoinedWordsMaterial(String(d.materialId ?? "")).id,
    quantity: read.quantity(quantity),
  };
}
