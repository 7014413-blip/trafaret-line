// The checkout reads constructor designs sent by the browser with one reader: bad input is
// refused with the constructor's name, customer text is cleaned.

import { describe, expect, it } from "vitest";
import { createDesignReader, FONT_ID_PATTERN } from "@/lib/validation/design-reader";
import { readOfficePlaqueDesign } from "@/lib/office-plaque/read-design";

const read = createDesignReader("test sign");
const rules = { maxChars: 20, fontId: FONT_ID_PATTERN, minSize: 0.6, maxSize: 1.6 };

describe("design reader", () => {
  it("cleans customer text and keeps a valid line", () => {
    expect(read.textLine({ text: "  Кава\u0007  з   собою ", fontId: "lora", size: 1 }, rules)).toEqual({ text: "Кава з собою", fontId: "lora", size: 1 });
  });

  it("refuses bad lines with the constructor name", () => {
    expect(() => read.textLine({ text: "x".repeat(21), fontId: "lora", size: 1 }, rules)).toThrow("test sign: line is too long");
    expect(() => read.textLine({ text: "x", fontId: "../../etc", size: 1 }, { ...rules, fontId: /^[a-z]+$/ })).toThrow("test sign: bad font id");
    expect(() => read.textLine({ text: "x", fontId: "lora", size: 5 }, rules)).toThrow("test sign: line size out of range");
    expect(() => read.record([], "design")).toThrow("test sign: design is not an object");
    expect(() => read.list([1, 2, 3], 2, "lines")).toThrow("test sign: bad lines");
  });

  it("keeps quantities between 1 and 9999", () => {
    expect(read.quantity(0)).toBe(1);
    expect(read.quantity(12.4)).toBe(12);
    expect(read.quantity(1e6)).toBe(9999);
  });

  it("reads a whole office plaque design", () => {
    const plaque = readOfficePlaqueDesign({
      sizeCode: "21x6", widthMm: 210, heightMm: 60, baseColourId: "black", plateColourId: "gold",
      lines: [{ text: "Олена Коваленко", fontId: "lora", size: 1 }], unknown: "dropped",
    }, 3);
    expect(plaque.lines[0].text).toBe("Олена Коваленко");
    expect(plaque.quantity).toBe(3);
    expect("unknown" in plaque).toBe(false);
    expect(() => readOfficePlaqueDesign({ sizeCode: "21x6", widthMm: 210, heightMm: 60, baseColourId: "black", plateColourId: "gold", lines: [{ text: "", fontId: "lora", size: 1 }] }, 1))
      .toThrow("office plaque: nothing to engrave");
  });
});
