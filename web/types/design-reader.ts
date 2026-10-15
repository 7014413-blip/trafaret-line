// Reader of a constructor design sent by the browser (checkout): typed accessors that throw
// with the constructor's name on anything the shop cannot make.

import type { PlaqueTextLine } from "./plaques";

/** Limits of one text line of a constructor design. */
export interface TextLineRules {
  maxChars: number;
  /** Allowed font ids (shop fonts and "custom:<key>"). */
  fontId: RegExp;
  /** Smallest and largest relative letter size of a line. */
  minSize: number;
  maxSize: number;
}

export interface DesignReader {
  /** Throws "<scope>: <message>". */
  fail: (message: string) => never;
  /** A plain object, or throws. */
  record: (value: unknown, what: string) => Record<string, unknown>;
  /** A finite number, or throws. */
  num: (value: unknown, what: string) => number;
  /** Customer text: control characters removed, spaces collapsed. */
  clean: (value: unknown) => string;
  /** An array of at most `max` items, or throws. */
  list: (value: unknown, max: number, what: string) => unknown[];
  /** Text, font and letter size of one line, checked against the rules. */
  textLine: (value: unknown, rules: TextLineRules) => PlaqueTextLine;
  /** Order quantity: whole, from 1 to 9999. */
  quantity: (value: number) => number;
}
