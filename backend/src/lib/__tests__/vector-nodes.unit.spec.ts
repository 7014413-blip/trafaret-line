// Node limit of customer vector layouts: SVG paths, shapes and DXF entity points are counted,
// files above 10 000 nodes get a clear message, other formats are not counted.

import { dxfNodes } from "../vector-nodes/dxf-nodes";
import { pathNodes, svgNodes } from "../vector-nodes/svg-nodes";
import { MAX_VECTOR_NODES, vectorNodeProblem } from "../vector-nodes/vector-node-limit";

const dxf = (entities: string[], header: string[] = []) => [
  "0", "SECTION", "2", "HEADER", ...header, "0", "ENDSEC",
  "0", "SECTION", "2", "ENTITIES", ...entities, "0", "ENDSEC", "0", "EOF",
].join("\r\n");

const line = (x1: number, y1: number, x2: number, y2: number) => ["0", "LINE", "8", "CUT", "10", `${x1}`, "20", `${y1}`, "11", `${x2}`, "21", `${y2}`];

describe("pathNodes", () => {
  it("counts the end of every segment, also repeated ones without a letter", () => {
    expect(pathNodes("M0 0 L10 0 L10 10 Z")).toBe(3);
    expect(pathNodes("M0,0 10,0 10,10 0,10z")).toBe(4);
    expect(pathNodes("M0 0L10 0 10 10 0 10Z")).toBe(4);
    expect(pathNodes("M0 0C1 1 2 2 3 3 4 4 5 5 6 6H10V10")).toBe(5);
    expect(pathNodes("m0 0a5 5 0 1 0 10 0")).toBe(2);
  });
});

describe("svgNodes", () => {
  it("adds paths, polygon points and basic shapes", () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0L10 0L10 10Z"/>'
      + '<polygon points="0,0 5,0 5,5"/><rect width="1" height="1"/><circle r="2"/><line x2="3"/></svg>';
    expect(svgNodes(svg)).toBe(3 + 3 + 4 + 4 + 2);
  });
});

describe("dxfNodes", () => {
  it("counts entity points and skips header points", () => {
    expect(dxfNodes(dxf([...line(0, 0, 10, 0), ...line(10, 0, 10, 10)], ["9", "$EXTMIN", "10", "0", "20", "0"]))).toBe(4);
  });

  it("does not count binary DXF", () => {
    expect(dxfNodes("AutoCAD Binary DXF\r\n\u001a\u0000")).toBeNull();
  });
});

describe("vectorNodeProblem", () => {
  it("accepts a file at the limit and refuses one node more", () => {
    const at = dxf(Array.from({ length: MAX_VECTOR_NODES / 2 }, (_, i) => line(i, 0, i, 1)).flat());
    const above = dxf([...Array.from({ length: MAX_VECTOR_NODES / 2 }, (_, i) => line(i, 0, i, 1)).flat(), "0", "POINT", "10", "0", "20", "0"]);
    expect(vectorNodeProblem("dxf", Buffer.from(at))).toBeNull();
    expect(vectorNodeProblem("dxf", Buffer.from(above))).toMatch(/^У макеті 10\s001 вузлів, а ми приймаємо до 10\s000\./);
  });

  it("refuses an SVG traced into too many points", () => {
    const d = `M0 0${" L1 1".repeat(MAX_VECTOR_NODES)}Z`;
    expect(vectorNodeProblem("svg", Buffer.from(`<svg><path d="${d}"/></svg>`))).toMatch(/Спростіть контури/);
  });

  it("does not count other formats", () => {
    expect(vectorNodeProblem("pdf", Buffer.from("%PDF-1.7 M0 0 L1 1"))).toBeNull();
  });
});
