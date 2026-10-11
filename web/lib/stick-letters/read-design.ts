// Reads a set of self-adhesive letters sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make. The lines are
// measured afterwards with the server's own fonts (lib/stick-letters/price-design.ts).

import type { StickLettersConfig, StickLettersDesign, StickLettersLine } from "../../types/stick-letters";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { stickLettersConfigFor } from "./config-for";

const FONT_ID = /^[a-z0-9:_./-]{1,120}$/i;

const record = (value: unknown, what: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`stick letters: ${what} is not an object`);
  return value as Record<string, unknown>;
};
const num = (value: unknown, what: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`stick letters: ${what} is not a number`);
  return n;
};
/** Customer text: control characters removed, spaces collapsed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

function readLine(raw: unknown, cfg: StickLettersConfig): StickLettersLine {
  const line = record(raw, "line");
  const text = clean(line.text);
  if ([...text].length > cfg.maxLineChars) throw new Error("stick letters: line is too long");
  const fontId = String(line.fontId ?? "");
  if (!FONT_ID.test(fontId)) throw new Error("stick letters: bad font id");
  const size = num(line.size, "line size");
  if (size < 0.4 || size > 1.6) throw new Error("stick letters: line size out of range");
  return { text, fontId, size, joined: line.joined === true };
}

export function readStickLettersDesign(raw: unknown, quantity: number): StickLettersDesign {
  const d = record(raw, "design");
  const product = d.product === "chars" || d.product === "sign-letters" ? d.product : "letters";
  const cfg: StickLettersConfig = stickLettersConfigFor(product);
  const materialId = findJoinedWordsMaterial(String(d.materialId ?? "")).id;
  if (cfg.materialIds && !cfg.materialIds.includes(materialId)) throw new Error("stick letters: this sheet is not offered");
  const letterHeightMm = Math.round(num(d.letterHeightMm, "letter height"));
  if (letterHeightMm < Math.floor(cfg.minLetterMm / 1.6) || letterHeightMm > cfg.maxLetterMm) throw new Error("stick letters: letter height out of range");
  if (!Array.isArray(d.lines) || d.lines.length > cfg.maxLines) throw new Error("stick letters: bad lines");
  const lines = d.lines.map((line) => readLine(line, cfg)).filter((line) => line.text).map((line) => (cfg.joinable ? line : { ...line, joined: false }));
  if (!lines.length) throw new Error("stick letters: nothing to cut");
  return {
    product, adhesive: cfg.rateNoAdhesivePerM2 == null ? true : d.adhesive !== false,
    materialId, letterHeightMm, upper: cfg.caseChoice && d.upper === true, lines,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
