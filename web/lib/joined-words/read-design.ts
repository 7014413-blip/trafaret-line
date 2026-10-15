// Reads a «Написи на планці» design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make. The pieces are
// measured afterwards with the server's own fonts (lib/joined-words/measure-design.ts).

import type { JoinedWordsConfig, JoinedWordsDesign, JoinedWordsLine } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { findJoinedWordsMaterial } from "./find-material";

const FONT_ID = /^[a-z0-9:_./-]{1,120}$/i;

const record = (value: unknown, what: string): Record<string, unknown> => {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`joined words: ${what} is not an object`);
  return value as Record<string, unknown>;
};
const num = (value: unknown, what: string): number => {
  const n = Number(value);
  if (!Number.isFinite(n)) throw new Error(`joined words: ${what} is not a number`);
  return n;
};
/** Customer text: control characters removed, spaces collapsed. */
const clean = (value: unknown) => String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();

function readLine(raw: unknown, cfg: JoinedWordsConfig): JoinedWordsLine {
  const line = record(raw, "line");
  const text = clean(line.text);
  const tail = clean(line.tail);
  if ([...text].length > cfg.maxLineChars || [...tail].length > cfg.maxTailChars) throw new Error("joined words: line is too long");
  const fontId = String(line.fontId ?? "");
  if (!FONT_ID.test(fontId)) throw new Error("joined words: bad font id");
  const size = num(line.size, "line size");
  if (size < 0.6 || size > 1.6) throw new Error("joined words: line size out of range");
  return { text, tail, fontId, size };
}

export function readJoinedWordsDesign(raw: unknown, quantity: number, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG): JoinedWordsDesign {
  const d = record(raw, "design");
  const materialId = findJoinedWordsMaterial(String(d.materialId ?? "")).id;
  const letterHeightMm = Math.round(num(d.letterHeightMm, "letter height"));
  if (letterHeightMm < Math.floor(cfg.minLetterMm / 1.6) || letterHeightMm > cfg.maxLetterMm) throw new Error("joined words: letter height out of range");
  if (!Array.isArray(d.lines) || d.lines.length > cfg.maxLines) throw new Error("joined words: bad lines");
  const lines = d.lines.map((line) => readLine(line, cfg)).filter((line) => line.text || line.tail);
  if (!lines.length) throw new Error("joined words: nothing to cut");
  return {
    materialId, letterHeightMm, upper: d.upper === true, lines,
    quantity: Math.max(1, Math.min(9999, Math.round(quantity))),
  };
}
