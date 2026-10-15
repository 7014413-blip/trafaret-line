// Reads a «Написи на планці» design sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make. The pieces are
// measured afterwards with the server's own fonts (lib/joined-words/measure-design.ts).

import type { JoinedWordsConfig, JoinedWordsDesign, JoinedWordsLine } from "../../types/joined-words";
import { DEFAULT_JOINED_WORDS_CONFIG } from "./config";
import { findJoinedWordsMaterial } from "./find-material";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";

const read = createDesignReader("joined words");

function readLine(raw: unknown, cfg: JoinedWordsConfig): JoinedWordsLine {
  const line = read.textLine(raw, { maxChars: cfg.maxLineChars, fontId: FONT_ID_PATTERN, minSize: 0.6, maxSize: 1.6 });
  const tail = read.clean(read.record(raw, "line").tail);
  if ([...tail].length > cfg.maxTailChars) read.fail("line is too long");
  return { ...line, tail };
}

export function readJoinedWordsDesign(raw: unknown, quantity: number, cfg: JoinedWordsConfig = DEFAULT_JOINED_WORDS_CONFIG): JoinedWordsDesign {
  const d = read.record(raw, "design");
  const materialId = findJoinedWordsMaterial(String(d.materialId ?? "")).id;
  const letterHeightMm = Math.round(read.num(d.letterHeightMm, "letter height"));
  if (letterHeightMm < Math.floor(cfg.minLetterMm / 1.6) || letterHeightMm > cfg.maxLetterMm) read.fail("letter height out of range");
  const lines = read.list(d.lines, cfg.maxLines, "lines").map((line) => readLine(line, cfg)).filter((line) => line.text || line.tail);
  if (!lines.length) read.fail("nothing to cut");
  return {
    materialId, letterHeightMm, upper: d.upper === true, lines,
    quantity: read.quantity(quantity),
  };
}
