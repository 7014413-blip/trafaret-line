// Repair of ClipperOffset in clipper2-js 1.2.4 (the last release). The library was machine
// translated from C#, where OffsetPolygon passes the previous vertex index by reference
// (`OffsetPoint(group, path, i, ref prev)`) so every vertex is joined with its own previous
// edge. The JavaScript copy passes a plain number, so every vertex is joined with the LAST
// edge of the path: a 10 × 10 mm square shrunk by 1 mm came back as a twisted shape reaching
// x = 11 mm. Every offset of the site (thin places of a stencil, the outline around a welded
// word) went through that code. This file restores the C# loop; it is applied once, when
// lib/geometry/clipper.ts is loaded, before any offset runs.

import { Clipper, ClipperOffset, type Path64 } from "clipper2-js";

/** The private members of ClipperOffset the C# loop needs. */
interface OffsetInternals {
  _groupDelta: number;
  offsetPoint(group: OffsetGroup, path: Path64, j: number, k: number): void;
  offsetPolygon(group: OffsetGroup, path: Path64): void;
}

interface OffsetGroup {
  outPath: unknown[];
  outPaths: unknown[][];
}

const proto = ClipperOffset.prototype as unknown as OffsetInternals;

proto.offsetPolygon = function offsetPolygon(this: OffsetInternals, group: OffsetGroup, path: Path64): void {
  // A hole the offset would close completely disappears (the library's own test).
  if ((Clipper.area(path) < 0) !== (this._groupDelta < 0)) {
    const box = Clipper.getBounds(path);
    const minDim = Math.abs(this._groupDelta) * 2;
    if (minDim > box.width || minDim > box.height) return;
  }
  group.outPath = [];
  for (let i = 0, prev = path.length - 1; i < path.length; prev = i, i++) {
    this.offsetPoint(group, path, i, prev);
  }
  group.outPaths.push(group.outPath);
};

/** True once the repair is installed; lib/geometry/clipper.ts exports it so the import stays. */
export const CLIPPER_OFFSET_FIXED = true;
