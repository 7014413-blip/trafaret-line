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
  });
});
