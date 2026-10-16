// Production files of an order line (ТЗ §7): file name with the order number and position,
// the INFO layer in SVG and DXF, and the machine parts rebuilt from the line spec.

import { describe, expect, it } from "vitest";
import { canvasPart } from "@/lib/export/canvas-part";
import { toLayeredDxf, toLayeredSvg } from "@/lib/export/layers";
import { productionFileName } from "@/lib/export/production-name";
import { textStencilPart } from "@/lib/export/text-stencil-part";
import { weldedWordPart } from "@/lib/export/welded-word-part";
import { DEFAULT_WELD } from "@/lib/geometry/weld";
import type { LayeredPart } from "@/types/vector";
import { testFont } from "./support/node-font";

const text = { font: testFont("montserrat"), lineFonts: [], align: "center" as const, upper: false };

describe("production file name", () => {
  it("starts with the order number and position, ends with the size", () => {
    expect(productionFileName({ orderNumber: "TL-1042", position: 2, constructor: "stencil", materialId: "pet_thin", widthMm: 300, heightMm: 119.6 }))
      .toBe("TL-1042-2_stencil_pet_thin_300x120mm");
  });

  it("keeps only safe characters", () => {
    expect(productionFileName({ orderNumber: "TL 7/../x", position: 1, constructor: "word", materialId: "acrylic_3", widthMm: 200, heightMm: 80 }))
      .toBe("TL-7-x-1_word_acrylic_3_200x80mm");
  });
});

describe("INFO layer", () => {
  const part: LayeredPart = {
    sheet: { shape: "rect", widthMm: 100, heightMm: 50 },
    cutPaths: [[[10, 10], [20, 10], [20, 20], [10, 20]]],
    info: ["Order TL-5, item 1", "Material: PET 0.5 mm", "Size: 100 x 50 mm", "Мітка"],
  };

  it("SVG: grey INFO group with the text under the part, scale 1:1", () => {
    const svg = toLayeredSvg(part);
    expect(svg).toContain('<g id="INFO" stroke="#808080"');
    expect(svg).toContain(">Order TL-5, item 1</text>");
    expect(svg).toContain(">?????</text>");
    // 50 mm part + 5 mm gap + 4 lines of 6 mm.
    expect(svg).toContain('height="79mm" viewBox="0 0 100 79"');
  });

  it("DXF: INFO layer in the table and TEXT entities below the part", () => {
    const dxf = toLayeredDxf(part).split("\n");
    expect(dxf[dxf.indexOf("LAYER") + 2]).toBe("5");
    const text = dxf.indexOf("TEXT");
    expect(dxf.slice(text, text + 14)).toEqual(["TEXT", "8", "INFO", "62", "8", "10", "0", "20", "-9", "40", "4", "1", "Order TL-5, item 1", "0"]);
  });

  it("no INFO layer without info lines", () => {
    expect(toLayeredSvg({ ...part, info: undefined })).not.toContain("INFO");
  });
});

describe("machine parts", () => {
  it("«Свій напис»: the paid sheet with the letters cut out", () => {
    const made = textStencilPart({ ...text, text: "ОБОРОНА", widthMm: 300, marginMm: 15, square: false, bridgeStrength: "normal", materialId: "pet_thin" });
    expect(made.constructor).toBe("stencil");
    expect(made.widthMm).toBe(300);
    expect(made.part.cutPaths.length).toBeGreaterThanOrEqual(7);
    expect(made.warnings).toEqual([]);
    expect(made.previewSvg).toContain("<path");
  });

  it("square stencil keeps the square sheet", () => {
    const made = textStencilPart({ ...text, text: "Їжак", widthMm: 300, marginMm: 15, square: true, bridgeStrength: "strong", materialId: "pet_thin" });
    expect(made.constructor).toBe("square-stencil");
    expect([made.widthMm, made.heightMm]).toEqual([300, 300]);
  });

  it("«Цілим словом»: one outer outline, the counters cut inside first", () => {
    const made = weldedWordPart({ ...text, text: "ОБОРОНА", widthMm: 200, options: DEFAULT_WELD, materialId: "acrylic_3", colourHex: "#ffffff" });
    expect(made.part.outerCut).toHaveLength(1);
    expect(made.part.cutPaths.length).toBeGreaterThanOrEqual(4);
    expect(Math.abs(made.widthMm - 200)).toBeLessThan(2);
    expect(made.part.sheet).toMatchObject({ shape: "custom" });
    expect(toLayeredSvg(made.part)).toContain('<g id="CUT_OUTER"');
  });

  const elements = [
    { kind: "text" as const, transform: { x: 40, y: 40, scale: 1, angle: 0 }, text: "Софія", font: text.font, capMm: 30 },
    { kind: "shape" as const, transform: { x: 250, y: 60, scale: 1, angle: 0 }, shape: "star" as const },
  ];

  it("«Вільне полотно»: stencil on the customer's sheet", () => {
    const made = canvasPart({ sheet: { widthMm: 400, heightMm: 200, marginMm: 15 }, elements, materialId: "pet_thin", result: "stencil", autoJoin: false });
    expect(made.constructor).toBe("canvas-stencil");
    expect([made.widthMm, made.heightMm]).toEqual([400, 200]);
    expect(made.part.cutPaths.length).toBeGreaterThan(5);
  });

  it("«Вільне полотно» → «Цілим шматком»: one piece when joined automatically", () => {
    const made = canvasPart({ sheet: { widthMm: 400, heightMm: 200, marginMm: 15 }, elements, materialId: "acrylic_3", result: "piece", autoJoin: true });
    expect(made.constructor).toBe("canvas-piece");
    expect(made.part.outerCut).toHaveLength(1);
  });
});
