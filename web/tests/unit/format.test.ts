// Customer-facing formats: centimetres with a comma, prices with a space and ₴.

import { describe, expect, it } from "vitest";
import { cmText, formatCm, formatUAH } from "@/lib/format";

describe("formats", () => {
  it("shows centimetres the Ukrainian way", () => {
    expect(cmText(300)).toBe("30");
    expect(cmText(305)).toBe("30,5");
    expect(formatCm(1250)).toBe("125 см");
  });

  it("shows prices in hryvnias", () => {
    expect(formatUAH(1285).replace(/\s/g, " ")).toBe("1 285 ₴");
    expect(formatUAH(1285, "ru").replace(/\s/g, " ")).toBe("1 285 ₴");
  });

  it("shows English pages the English way", () => {
    expect(cmText(305, "en")).toBe("30.5");
    expect(formatCm(1250, "en")).toBe("125 cm");
    expect(formatUAH(1285, "en")).toBe("1,285 ₴");
  });
});
