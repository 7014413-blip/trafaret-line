// Picture size of a catalogue stencil from its size description.

import { describe, expect, it } from "vitest";
import { pictureBoxMm } from "@/lib/catalog/picture-box";

describe("pictureBoxMm", () => {
  it("reads a picture box, a diameter and a longest side", () => {
    expect(pictureBoxMm("малюнок 30 × 30 см, аркуш 33 × 33 см", [330, 330])).toEqual({ widthMm: 300, heightMm: 300 });
    expect(pictureBoxMm("малюнок Ø16 см, аркуш 20 × 20 см", [200, 200])).toEqual({ widthMm: 160, heightMm: 160 });
    expect(pictureBoxMm("напис до 40 × 12,5 см, аркуш 43 × 16 см", [430, 160])).toEqual({ widthMm: 400, heightMm: 125 });
    expect(pictureBoxMm("малюнок 25 см по більшій стороні, аркуш 28 × 28 см", [280, 280])).toEqual({ widthMm: 250, heightMm: 250 });
  });

  it("falls back to the sheet minus the margin when the picture size is not written", () => {
    expect(pictureBoxMm("набір на аркуші 21 × 29,7 см, елементи 6–7 см", [210, 297])).toEqual({ widthMm: 180, heightMm: 267 });
    expect(pictureBoxMm("", [330, 330])).toEqual({ widthMm: 300, heightMm: 300 });
  });

  it("never exceeds the sheet", () => {
    expect(pictureBoxMm("малюнок 50 × 50 см", [330, 330])).toEqual({ widthMm: 330, heightMm: 330 });
  });
});
