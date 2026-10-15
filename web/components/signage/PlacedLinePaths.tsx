// Text lines of a constructor preview: each line's outline moved and scaled to its place in the
// layout. Lines whose outline is not measured yet are skipped.

import type { PlacedLine } from "@/types/constructor-ui";

export function PlacedLinePaths<L extends PlacedLine>({ lines, paths, fill }: {
  lines: L[];
  paths: Map<number, string>;
  /** One colour for every line, or the colour of each line. */
  fill: string | ((line: L) => string | null);
}) {
  return (
    <>
      {lines.map((line) => {
        const d = paths.get(line.index);
        const colour = typeof fill === "function" ? fill(line) : fill;
        return d && colour ? <path key={line.index} d={d} fill={colour} transform={`translate(${line.x} ${line.y}) scale(${line.scale})`} /> : null;
      })}
    </>
  );
}
