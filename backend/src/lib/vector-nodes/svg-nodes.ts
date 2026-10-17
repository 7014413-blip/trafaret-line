// Number of nodes (points the laser software has to process) in an SVG: every segment end of
// every path, the points of polygons and polylines, and fixed counts for the basic shapes.

/** Numbers each path command takes per segment. Z takes none and adds no node. */
const PARAMS: Record<string, number> = { m: 2, l: 2, t: 2, h: 1, v: 1, c: 6, s: 4, q: 4, a: 7, z: 0 };

/** Nodes a basic shape becomes when it is converted to a path. */
const SHAPE_NODES: Record<string, number> = { rect: 4, circle: 4, ellipse: 4, line: 2 };

const NUMBER = /[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g;

export function pathNodes(d: string): number {
  let nodes = 0;
  for (const [, command, args] of d.matchAll(/([MLTHVCSQAZmlthvcsqaz])([^MLTHVCSQAZmlthvcsqaz]*)/g)) {
    const per = PARAMS[command.toLowerCase()];
    if (!per) continue;
    // Arc flags can be written without separators ("a5 5 0 1012 0"); counting them as numbers
    // only makes the count a little higher, which is the safe side.
    const count = args.match(NUMBER)?.length ?? 0;
    nodes += Math.max(1, Math.floor(count / per));
  }
  return nodes;
}

export function svgNodes(text: string): number {
  let nodes = 0;
  for (const [, d] of text.matchAll(/\sd\s*=\s*["']([^"']*)["']/g)) nodes += pathNodes(d);
  for (const [, points] of text.matchAll(/<(?:polygon|polyline)\b[^>]*\spoints\s*=\s*["']([^"']*)["']/gi)) {
    nodes += Math.floor((points.match(NUMBER)?.length ?? 0) / 2);
  }
  for (const [, tag] of text.matchAll(/<(rect|circle|ellipse|line)\b/gi)) nodes += SHAPE_NODES[tag.toLowerCase()];
  return nodes;
}
