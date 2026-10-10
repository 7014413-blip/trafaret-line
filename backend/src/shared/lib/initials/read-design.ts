// Reads a wedding initials design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make.

import type { InitialsConfig, InitialsDesign, InitialsMode, InitialsSeparator } from "../../types/initials";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { DEFAULT_INITIALS_CONFIG } from "./config";

const FONT_ID = /^[a-z0-9:_./-]{1,120}$/i;
const SEPARATORS = new Set<InitialsSeparator>(["bar", "amp", "plus", "dot", "none"]);
const MODES = new Set<InitialsMode>(["pieces", "topper"]);

const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, "").replace(/\s+/g, "").trim();

export function readInitialsDesign(raw: unknown, quantity: number, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG): InitialsDesign {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new Error("initials: design is not an object");
  const d = raw as Record<string, unknown>;
  const first = clean(d.first);
  const second = clean(d.second);
  if ([...first].length > cfg.maxChars || [...second].length > cfg.maxChars || (!first && !second)) throw new Error("initials: bad letters");
  const separator = String(d.separator) as InitialsSeparator;
  if (!SEPARATORS.has(separator)) throw new Error("initials: bad separator");
  const mode = String(d.mode) as InitialsMode;
  if (!MODES.has(mode)) throw new Error("initials: bad mode");
  const fontId = String(d.fontId ?? "");
  if (!FONT_ID.test(fontId)) throw new Error("initials: bad font id");
  const letterHeightMm = Math.round(Number(d.letterHeightMm));
  if (!Number.isFinite(letterHeightMm) || letterHeightMm < cfg.minLetterMm || letterHeightMm > cfg.maxLetterMm) throw new Error("initials: letter height out of range");
  return {
    first, second, separator, fontId, letterHeightMm, mode,
    materialId: findJoinedWordsMaterial(String(d.materialId ?? "")).id,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
