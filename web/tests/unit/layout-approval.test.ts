// «Лист погодження макета»: which lines need «Макет перевірив», and the sheet in the order folder.

import { describe, expect, it } from "vitest";
import { approvalSheetSvg } from "@/lib/export/approval-sheet";
import { needsLayoutApproval } from "@/lib/validation/layout-approval";
import { testFont } from "./support/node-font";

describe("needsLayoutApproval", () => {
  it("asks for constructors and the customer's own file", () => {
    for (const kind of ["stencil", "welded", "sign", "pointer", "plaque", "words", "layered", "initials", "letters"]) {
      expect(needsLayoutApproval({ kind }), kind).toBe(true);
    }
    // Lines saved before the kind existed are «Свій напис» stencils.
    expect(needsLayoutApproval({})).toBe(true);
  });

  it("does not ask for ready products, blanks and accessories", () => {
    for (const kind of ["catalog", "blank", "accessory"]) expect(needsLayoutApproval({ kind }), kind).toBe(false);
  });
});

describe("approvalSheetSvg", () => {
  const svg = approvalSheetSvg(testFont("montserrat"), {
    orderNumber: "TL-7",
    approvedAt: "2026-10-16T14:05:00Z",
    lines: [
      { position: 1, title: "Свій напис «КАВА»", sizeText: "30 × 12 см", quantity: 2, previewSvg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 12"><rect width="30" height="12"/></svg>' },
      { position: 2, title: "За вашим макетом", sizeText: "", quantity: 1, previewSvg: null },
    ],
  });

  it("is one page with a row per line, the pictures nested in their boxes", () => {
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www.w3.org\/2000\/svg" width="1240" height="(\d+)"/);
    expect(Number(/height="(\d+)"/.exec(svg)?.[1])).toBe(230 + 2 * 240 + 110);
    expect(svg).toContain('<svg x="70" y="260" width="180" height="180" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 12">');
    expect(svg).toContain("<title>Лист погодження TL-7</title>");
  });

  it("draws the text as outlines, so no system font is needed", () => {
    expect(svg).not.toContain("<text");
    expect((svg.match(/<path /g) ?? []).length).toBeGreaterThan(8);
  });
});
