// Stencil cut with bridges (Clipper2).
//
//  1. Contours of every glyph/object are normalised with EvenOdd (a glyph knows its own
//     holes), then all objects are united with NonZero: overlapping letters merge.
//  2. The nesting tree of the union gives the structure directly: top-level outer
//     contours are cut regions, their holes are islands of material (the counter of
//     О, А, Р…) that would fall out, an outer contour inside an island is a cut inside
//     that island, and so on.
//  3. Bridges follow docs/tz/trebovaniya-peremychki-i-svarka.md §А: straight only,
//     vertical by default (top of the island, plus bottom when it is taller than 20 mm),
//     on the island axis unless the axis falls into a junction of strokes, sideways only
//     when vertical does not work, an extra side pair for long outlines. Irregular islands
//     with no straight solution fall back to the thinnest point of the stroke.
//  4. Bridges are rectangles across the stroke; they are subtracted from the cut
//     regions (Clipper Difference), so the cut file has real gaps, not drawn lines.
//  5. Every island must reach the sheet through bridges (directly or through other
//     islands); an island that does not gets an extra bridge to the outer edge.

import type { BridgePlacement, IslandInfo, LaserConfig, Polygon, StencilCutOptions, StencilCutResult, Vec2 } from "../../types/geometry";
import { bboxOf, distance, nearestOnPolygon, pointInPolygon, polygonsNetArea, polygonsPerimeter, polylineLength } from "../calculators/geometry";
import { difference, normaliseGroups, unionTree, type TreeNode } from "./clipper";
import { DEFAULT_LASER } from "./laser-config";
import { findThinZones } from "./thin-zones";

/** One cut region (outer contour of the union) and what is around it. */
interface Region {
  id: number;
  outer: Vec2[];
  /** Island ids of the holes of this region. */
  holeIslandIds: number[];
  /** Material piece that contains the region: null = the sheet, otherwise an island id. */
  ownerIslandId: number | null;
}

interface Island {
  id: number;
  outline: Vec2[];
  regionId: number;
}

interface Sample {
  /** Arc position along the island outline, mm. */
  s: number;
  from: Vec2;
  to: Vec2;
  length: number;
  /** null = the outer contour of the region, otherwise a sibling island. */
  targetIslandId: number | null;
}

/** Builds regions and islands from the nesting tree. */
function readTree(roots: TreeNode[]): { regions: Region[]; islands: Island[] } {
  const regions: Region[] = [];
  const islands: Island[] = [];

  const visitOuter = (node: TreeNode, ownerIslandId: number | null) => {
    const region: Region = { id: regions.length, outer: node.polygon, holeIslandIds: [], ownerIslandId };
    regions.push(region);
    for (const hole of node.children) {
      const island: Island = { id: islands.length, outline: hole.polygon, regionId: region.id };
      islands.push(island);
      region.holeIslandIds.push(island.id);
      for (const inner of hole.children) visitOuter(inner, island.id);
    }
  };

  for (const root of roots) visitOuter(root, null);
  return { regions, islands };
}

/** Points along a closed outline every `step` mm, with their arc position. */
function sampleOutline(outline: Polygon, step: number): { s: number; point: Vec2 }[] {
  const out: { s: number; point: Vec2 }[] = [];
  let travelled = 0;
  let nextAt = 0;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    const segment = distance(a, b);
    while (segment > 0 && nextAt <= travelled + segment) {
      const t = (nextAt - travelled) / segment;
      out.push({ s: nextAt, point: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t] });
      nextAt += step;
    }
    travelled += segment;
  }
  return out;
}

/** Stroke width at each sample: nearest point on the region outer edge or on a sibling island. */
function strokeSamples(island: Island, region: Region, islands: Island[], step: number, onlyOuter: boolean): Sample[] {
  const samples: Sample[] = [];
  for (const { s, point } of sampleOutline(island.outline, step)) {
    let best: Sample | null = null;
    const outer = nearestOnPolygon(point, region.outer);
    best = { s, from: point, to: outer.point, length: outer.distance, targetIslandId: null };
    if (!onlyOuter) {
      for (const siblingId of region.holeIslandIds) {
        if (siblingId === island.id) continue;
        const near = nearestOnPolygon(point, islands[siblingId].outline);
        if (near.distance < best.length) best = { s, from: point, to: near.point, length: near.distance, targetIslandId: siblingId };
      }
    }
    if (best.length <= 0) continue;
    // The bridge must leave the island through the cut, not across the island itself (concave islands).
    const ux = (best.to[0] - best.from[0]) / best.length;
    const uy = (best.to[1] - best.from[1]) / best.length;
    const probe: Vec2 = [best.from[0] + ux * Math.min(0.3, best.length / 2), best.from[1] + uy * Math.min(0.3, best.length / 2)];
    if (pointInPolygon(probe, island.outline)) continue;
    samples.push(best);
  }
  return samples;
}

/** Circular distance between two arc positions on an outline of length `perimeter`. */
function arcGap(a: number, b: number, perimeter: number): number {
  const d = Math.abs(a - b) % perimeter;
  return Math.min(d, perimeter - d);
}

/** How many bridges an island gets. */
function bridgeCountFor(island: Island, perimeter: number, cfg: LaserConfig): number {
  const box = bboxOf([island.outline]);
  const tall = Math.max(box.maxX - box.minX, box.maxY - box.minY) > cfg.secondBridgeFromMm;
  const byHeight = tall ? 2 : 1;
  const byPerimeter = Math.ceil(perimeter / cfg.bridgePerPerimeterMm);
  return Math.min(cfg.maxBridgesPerIsland, Math.max(byHeight, byPerimeter));
}

/** Picks `count` samples: the thinnest first, then the thinnest far enough from the chosen ones. */
function pickSamples(samples: Sample[], count: number, perimeter: number): Sample[] {
  if (!samples.length) return [];
  const sorted = [...samples].sort((a, b) => a.length - b.length);
  const chosen: Sample[] = [sorted[0]];
  const minGap = perimeter / (count * 2);
  for (const candidate of sorted) {
    if (chosen.length >= count) break;
    if (chosen.every((c) => arcGap(c.s, candidate.s, perimeter) >= minGap)) chosen.push(candidate);
  }
  return chosen;
}

/** Rectangle across the stroke from `from` to `to`, extended into the material on both ends. */
function bridgeQuad(from: Vec2, to: Vec2, width: number, overlap: number): Vec2[] {
  const length = distance(from, to);
  const ux = (to[0] - from[0]) / length;
  const uy = (to[1] - from[1]) / length;
  const nx = -uy * (width / 2);
  const ny = ux * (width / 2);
  const a: Vec2 = [from[0] - ux * overlap, from[1] - uy * overlap];
  const b: Vec2 = [to[0] + ux * overlap, to[1] + uy * overlap];
  return [[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]];
}

function toPlacement(island: Island, sample: Sample, width: number, cfg: LaserConfig): BridgePlacement {
  return {
    islandId: island.id,
    from: sample.from,
    to: sample.to,
    widthMm: width,
    lengthMm: sample.length,
    target: sample.targetIslandId == null ? "sheet" : "island",
    targetIslandId: sample.targetIslandId ?? undefined,
    quad: bridgeQuad(sample.from, sample.to, width, cfg.bridgeOverlapMm),
  };
}

/** Islands that reach the sheet through bridges. */
function connectedIslands(regions: Region[], islands: Island[], bridges: BridgePlacement[]): Set<number> {
  const edges = new Map<string, Set<string>>();
  const link = (a: string, b: string) => {
    if (!edges.has(a)) edges.set(a, new Set());
    if (!edges.has(b)) edges.set(b, new Set());
    edges.get(a)?.add(b);
    edges.get(b)?.add(a);
  };
  for (const bridge of bridges) {
    const island = islands[bridge.islandId];
    const region = regions[island.regionId];
    const other = bridge.target === "island" && bridge.targetIslandId != null
      ? `i${bridge.targetIslandId}`
      : region.ownerIslandId == null ? "sheet" : `i${region.ownerIslandId}`;
    link(`i${island.id}`, other);
  }
  const seen = new Set<string>(["sheet"]);
  const queue = ["sheet"];
  while (queue.length) {
    const node = queue.shift() as string;
    for (const next of edges.get(node) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  const out = new Set<number>();
  for (const island of islands) if (seen.has(`i${island.id}`)) out.add(island.id);
  return out;
}

type Direction = "up" | "down" | "left" | "right";

/** Positions along an axis where a straight line crosses a polygon outline. */
function crossings(polygon: Polygon, vertical: boolean, at: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    const [ac, bc] = vertical ? [a[0], b[0]] : [a[1], b[1]];
    if (ac > at === bc > at) continue;
    const t = (at - ac) / (bc - ac);
    out.push(vertical ? a[1] + (b[1] - a[1]) * t : a[0] + (b[0] - a[0]) * t);
  }
  return out;
}

/**
 * Straight bridge from the island edge on the axis line in one direction, up to the
 * nearest other edge of the same cut region (requirements §А.2–3, §А.6).
 */
function axisBridge(island: Island, region: Region, islands: Island[], direction: Direction, at: number): Sample | null {
  const vertical = direction === "up" || direction === "down";
  const own = crossings(island.outline, vertical, at);
  if (own.length < 2) return null;
  const forward = direction === "down" || direction === "right";
  const start = forward ? Math.max(...own) : Math.min(...own);
  let best: { pos: number; target: number | null } | null = null;
  const consider = (polygon: Polygon, target: number | null) => {
    for (const pos of crossings(polygon, vertical, at)) {
      const ahead = forward ? pos > start + 1e-6 : pos < start - 1e-6;
      if (!ahead) continue;
      if (!best || Math.abs(pos - start) < Math.abs(best.pos - start)) best = { pos, target };
    }
  };
  consider(region.outer, null);
  for (const siblingId of region.holeIslandIds) if (siblingId !== island.id) consider(islands[siblingId].outline, siblingId);
  if (!best) return null;
  const hit = best as { pos: number; target: number | null };
  const from: Vec2 = vertical ? [at, start] : [start, at];
  const to: Vec2 = vertical ? [at, hit.pos] : [hit.pos, at];
  return { s: 0, from, to, length: Math.abs(hit.pos - start), targetIslandId: hit.target };
}

/**
 * Best straight bridge in one direction: on the island axis, or, when the axis falls into
 * a junction of strokes (much thicker than the thinnest stroke around this island), the
 * shortest one within the middle 60 % of the island (requirements §А.5).
 */
function bestAxisBridge(island: Island, region: Region, islands: Island[], direction: Direction, reference: number): Sample | null {
  const box = bboxOf([island.outline]);
  const vertical = direction === "up" || direction === "down";
  const lo = vertical ? box.minX : box.minY;
  const hi = vertical ? box.maxX : box.maxY;
  const centre = (lo + hi) / 2;
  const onAxis = axisBridge(island, region, islands, direction, centre);
  if (onAxis && onAxis.length <= reference * 1.8) return onAxis;
  let best = onAxis;
  const span = (hi - lo) * 0.3;
  for (let k = 1; k <= 12; k++) {
    for (const sign of [-1, 1]) {
      const candidate = axisBridge(island, region, islands, direction, centre + sign * (span * k) / 12);
      if (candidate && (!best || candidate.length < best.length - 1e-6)) best = candidate;
    }
  }
  return best;
}

/** Straight bridges for one island by the rules §А.3–4: top (and bottom), sideways if needed. */
function placeAxisBridges(island: Island, region: Region, islands: Island[], cfg: LaserConfig): Sample[] {
  const box = bboxOf([island.outline]);
  const perimeter = polylineLength(island.outline, true);
  const tall = box.maxY - box.minY > cfg.secondBridgeFromMm;
  const raw: Record<Direction, Sample | null> = {
    up: axisBridge(island, region, islands, "up", (box.minX + box.maxX) / 2),
    down: axisBridge(island, region, islands, "down", (box.minX + box.maxX) / 2),
    left: axisBridge(island, region, islands, "left", (box.minY + box.maxY) / 2),
    right: axisBridge(island, region, islands, "right", (box.minY + box.maxY) / 2),
  };
  const lengths = Object.values(raw).filter((s): s is Sample => !!s).map((s) => s.length);
  const reference = lengths.length ? Math.min(...lengths) : 0;
  const pick = (d: Direction) => bestAxisBridge(island, region, islands, d, reference);
  const usable = (s: Sample | null): s is Sample => !!s && s.length <= cfg.maxBridgeLengthMm * 2;

  const chosen: Sample[] = [];
  const vertical = [pick("up"), ...(tall ? [pick("down")] : [])].filter(usable);
  const verticalOk = vertical.length === (tall ? 2 : 1) && vertical.every((s) => s.length <= reference * 1.8);
  if (verticalOk) chosen.push(...vertical);
  else {
    const horizontal = [pick("left"), ...(tall ? [pick("right")] : [])].filter(usable);
    chosen.push(...(horizontal.length >= vertical.length ? horizontal : vertical));
  }
  if (perimeter > cfg.bridgePerPerimeterMm && chosen.length < cfg.maxBridgesPerIsland) {
    const extra = verticalOk ? [pick("left"), pick("right")] : [pick("up"), pick("down")];
    for (const s of extra.filter(usable)) if (chosen.length < cfg.maxBridgesPerIsland) chosen.push(s);
  }
  return chosen;
}

/**
 * Turns raw contour groups (mm, any winding; one group = one glyph or object) into the
 * final cut: regions with bridges, island report, thin zones and laser path length.
 */
export function buildStencilCut(groups: ReadonlyArray<ReadonlyArray<Polygon>>, options: StencilCutOptions): StencilCutResult {
  const cfg = options.config ?? DEFAULT_LASER;
  const scale = cfg.clipperScale;
  const normalised = normaliseGroups(groups, scale);
  const roots = unionTree(normalised, scale);
  const { regions, islands } = readTree(roots);
  const cutBase = roots.length ? collectPaths(roots) : [];
  const width = Math.max(cfg.minBridgeMm, Math.min(cfg.maxBridgeMm, options.bridgeWidthMm));

  const bridges: BridgePlacement[] = [];
  if (!options.skipBridges) {
    for (const island of islands) {
      const region = regions[island.regionId];
      let chosen = placeAxisBridges(island, region, islands, cfg);
      if (!chosen.length) {
        // Irregular island where no straight line works: thinnest stroke as the last resort.
        const perimeter = polylineLength(island.outline, true);
        const step = Math.max(cfg.sampleStepMm, perimeter / 400);
        chosen = pickSamples(strokeSamples(island, region, islands, step, false), bridgeCountFor(island, perimeter, cfg), perimeter);
      }
      for (const sample of chosen) bridges.push(toPlacement(island, sample, width, cfg));
    }

    // Islands bridged only to each other: add one bridge to the outer edge of their region.
    for (let pass = 0; pass < islands.length; pass++) {
      const reached = connectedIslands(regions, islands, bridges);
      const lost = islands.filter((island) => !reached.has(island.id));
      if (!lost.length) break;
      // One island per pass: the others may already connect through it on the next pass.
      let fixed = false;
      for (const island of lost) {
        // A straight bridge to the outer edge first, the thinnest stroke if none exists.
        const region = regions[island.regionId];
        const box = bboxOf([island.outline]);
        const straight = ([["up", (box.minX + box.maxX) / 2], ["down", (box.minX + box.maxX) / 2], ["left", (box.minY + box.maxY) / 2], ["right", (box.minY + box.maxY) / 2]] as const)
          .map(([d, at]) => axisBridge(island, { ...region, holeIslandIds: [] }, islands, d, at))
          .filter((s): s is Sample => !!s)
          .sort((a, b) => a.length - b.length);
        const perimeter = polylineLength(island.outline, true);
        const step = Math.max(cfg.sampleStepMm, perimeter / 400);
        const [best] = straight.length ? straight : pickSamples(strokeSamples(island, region, islands, step, true), 1, perimeter);
        if (best) {
          bridges.push(toPlacement(island, best, width, cfg));
          fixed = true;
          break;
        }
      }
      if (!fixed) break;
    }
  }

  const reached = connectedIslands(regions, islands, bridges);
  const cutPaths = bridges.length ? difference(cutBase, bridges.map((b) => b.quad), scale) : cutBase;

  const islandInfo: IslandInfo[] = islands.map((island) => ({
    id: island.id,
    outline: island.outline,
    areaMm2: polygonsNetArea([island.outline]),
    bbox: bboxOf([island.outline]),
    bridgeCount: bridges.filter((b) => b.islandId === island.id).length,
    connected: options.skipBridges ? true : reached.has(island.id),
  }));

  const box = bboxOf(cutPaths);
  const sheet: Polygon = options.sheet ?? [
    [box.minX - 15, box.minY - 15], [box.maxX + 15, box.minY - 15], [box.maxX + 15, box.maxY + 15], [box.minX - 15, box.maxY + 15],
  ];

  return {
    cutPaths,
    islands: islandInfo,
    bridges,
    thinZones: cutPaths.length ? findThinZones(sheet, cutPaths, cfg) : [],
    cutLengthMm: polygonsPerimeter(cutPaths),
    openAreaMm2: polygonsNetArea(cutPaths),
    bbox: box,
  };
}

/** All polygons of a tree in drawing order (outer, holes, inner outer …). */
function collectPaths(nodes: TreeNode[]): Vec2[][] {
  const out: Vec2[][] = [];
  const walk = (list: TreeNode[]) => {
    for (const node of list) {
      out.push(node.polygon);
      walk(node.children);
    }
  };
  walk(nodes);
  return out;
}
