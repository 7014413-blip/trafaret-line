// Typed accessors for reading a constructor design sent by the browser (checkout). Every
// constructor reads its design with them, so text, numbers and lines are checked the same way
// everywhere; errors name the constructor ("pointer sign: bad font id").

import type { DesignReader, TextLineRules } from "../../types/design-reader";
import type { PlaqueTextLine } from "../../types/plaques";

/** Font ids of shop fonts and of the customer's fonts ("custom:<key>"). */
export const FONT_ID_PATTERN = /^[a-z0-9:_./-]{1,120}$/i;

const MAX_QUANTITY = 9999;

export function createDesignReader(scope: string): DesignReader {
  const fail = (message: string): never => {
    throw new Error(`${scope}: ${message}`);
  };
  const record = (value: unknown, what: string): Record<string, unknown> => {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail(`${what} is not an object`);
    return value as Record<string, unknown>;
  };
  const num = (value: unknown, what: string): number => {
    const n = Number(value);
    if (!Number.isFinite(n)) fail(`${what} is not a number`);
    return n;
  };
  const clean = (value: unknown): string =>
    String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  const list = (value: unknown, max: number, what: string): unknown[] => {
    if (!Array.isArray(value) || value.length > max) fail(`bad ${what}`);
    return value as unknown[];
  };
  const textLine = (value: unknown, rules: TextLineRules): PlaqueTextLine => {
    const line = record(value, "line");
    const text = clean(line.text);
    if ([...text].length > rules.maxChars) fail("line is too long");
    const fontId = String(line.fontId ?? "");
    if (!rules.fontId.test(fontId)) fail("bad font id");
    const size = num(line.size, "line size");
    if (size < rules.minSize || size > rules.maxSize) fail("line size out of range");
    return { text, fontId, size };
  };
  const quantity = (value: number): number => Math.max(1, Math.min(MAX_QUANTITY, Math.round(value)));
  return { fail, record, num, clean, list, textLine, quantity };
}
