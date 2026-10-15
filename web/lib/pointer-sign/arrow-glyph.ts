// Outline of the small direction arrow cut from the overlay sheet (photos of Денис's signs:
// a long thin shaft with a triangular head). Box (x, y, width, height) in mm, Y down.

import type { PointerDirection } from "../../types/pointer-sign";

export function arrowGlyphOutline(x: number, y: number, width: number, height: number, direction: PointerDirection): [number, number][] {
  const head = Math.min(width * 0.42, height * 0.95);
  const shaft = height * 0.34;
  const cy = y + height / 2;
  // Drawn pointing right, mirrored around the box centre for the left direction.
  const right: [number, number][] = [
    [x, cy - shaft / 2],
    [x + width - head, cy - shaft / 2],
    [x + width - head, y],
    [x + width, cy],
    [x + width - head, y + height],
    [x + width - head, cy + shaft / 2],
    [x, cy + shaft / 2],
  ];
  if (direction === 1) return right;
  const mid = x + width / 2;
  return right.map(([px, py]) => [2 * mid - px, py] as [number, number]).reverse();
}
