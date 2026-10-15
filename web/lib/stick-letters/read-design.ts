// Reads a set of self-adhesive letters sent by the browser (checkout): every field is checked and
// copied, unknown fields are dropped. Throws on anything the shop cannot make. The lines are
// measured afterwards with the server's own fonts (lib/stick-letters/price-design.ts).

import type { StickLettersConfig, StickLettersDesign, StickLettersLine } from "../../types/stick-letters";
import { findJoinedWordsMaterial } from "../joined-words/find-material";
import { stickLettersConfigFor } from "./config-for";
import { createDesignReader, FONT_ID_PATTERN } from "../validation/design-reader";

const read = createDesignReader("stick letters");

function readLine(raw: unknown, cfg: StickLettersConfig): StickLettersLine {
  const line = read.textLine(raw, { maxChars: cfg.maxLineChars, fontId: FONT_ID_PATTERN, minSize: 0.4, maxSize: 1.6 });
  return { ...line, joined: read.record(raw, "line").joined === true };
}

export function readStickLettersDesign(raw: unknown, quantity: number): StickLettersDesign {
  const d = read.record(raw, "design");
  const product = d.product === "chars" || d.product === "sign-letters" ? d.product : "letters";
  const cfg: StickLettersConfig = stickLettersConfigFor(product);
  const materialId = findJoinedWordsMaterial(String(d.materialId ?? "")).id;
  if (cfg.materialIds && !cfg.materialIds.includes(materialId)) read.fail("this sheet is not offered");
  const letterHeightMm = Math.round(read.num(d.letterHeightMm, "letter height"));
  if (letterHeightMm < Math.floor(cfg.minLetterMm / 1.6) || letterHeightMm > cfg.maxLetterMm) read.fail("letter height out of range");
  const lines = read.list(d.lines, cfg.maxLines, "lines").map((line) => readLine(line, cfg)).filter((line) => line.text).map((line) => (cfg.joinable ? line : { ...line, joined: false }));
  if (!lines.length) read.fail("nothing to cut");
  return {
    product, adhesive: cfg.rateNoAdhesivePerM2 == null ? true : d.adhesive !== false,
    materialId, letterHeightMm, upper: cfg.caseChoice && d.upper === true, lines,
    quantity: read.quantity(quantity),
  };
}
