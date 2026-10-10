// Free canvas analysis: places every element on the sheet, builds the common cut with
// bridges (Clipper2), and lists the problems the customer must see before buying:
// elements outside the safe margin or the sheet, islands without bridges, long bridges,
// thin material, thin slots, letters too small for the material.

import type { CanvasAnalysis, CanvasElement, CanvasIssue, CanvasSettings } from "../../types/canvas";
import type { LaserConfig, Polygon, StencilCutResult, Vec2, WeldResult } from "../../types/geometry";
import { bboxOf, pointInPolygon } from "../calculators/geometry";
import { MATERIALS } from "../materials";
import { buildStencilCut } from "./bridges";
import { minCapHeightMm, minMaterialMm } from "./config";
import { bridgeWidthFor, DEFAULT_LASER, laserFor } from "./laser-config";
import { solidConnectorMm, solidPiece } from "./solid-piece";
import { thinParts } from "./thin-zones";
import { placePolygons } from "./transform";

/** Smallest cap height among text elements, mm (drives the bridge width). */
function smallestCapMm(elements: CanvasElement[]): number {
  const caps = elements.filter((e) => e.kind === "text").map((e) => (e.kind === "text" ? e.capMm * e.transform.scale : 0));
  return caps.length ? Math.min(...caps) : 40;
}

/** Element whose placed outline contains the point (last drawn wins). */
function elementAt(point: Vec2, placed: CanvasAnalysis["placed"]): string | undefined {
  for (let i = placed.length - 1; i >= 0; i--) {
    const box = bboxOf(placed[i].groups.flat());
    if (point[0] >= box.minX - 1 && point[0] <= box.maxX + 1 && point[1] >= box.minY - 1 && point[1] <= box.maxY + 1) return placed[i].elementId;
  }
  return undefined;
}

/** Smallest placed element height, mm (drives the connector width of the solid piece). */
function smallestElementMm(placed: CanvasAnalysis["placed"]): number {
  const heights = placed.map((p) => { const b = bboxOf(p.groups.flat()); return b.maxY - b.minY; }).filter((h) => h > 0);
  return heights.length ? Math.min(...heights) : 30;
}

/** «Цілим шматком»: the united piece, its loose parts and its thin strokes. */
function analyzePiece(placed: CanvasAnalysis["placed"], settings: CanvasSettings, laser: LaserConfig, issues: CanvasIssue[]): WeldResult {
  const piece = solidPiece(placed.flatMap((p) => p.groups), solidConnectorMm(smallestElementMm(placed)), settings.autoJoin === true, laser.clipperScale);
  if (piece.pieces > 1) {
    issues.push({
      kind: "pieces_apart", level: "error", at: [piece.bbox.minX, piece.bbox.minY],
      message: `Виріб розпадеться на ${piece.pieces} частини. Увімкніть «З'єднати автоматично» або зсуньте елементи до дотику`,
    });
  }
  for (const zone of thinParts(piece.shapes, laser.minPartMm, "material", laser)) {
    issues.push({ kind: "thin_part", level: "warning", at: zone.at, elementId: elementAt(zone.at, placed), message: `Тонке місце, менше ${laser.minPartMm} мм: може зламатися` });
  }
  return piece;
}

export function analyzeCanvas(elements: CanvasElement[], settings: CanvasSettings, baseLaser: LaserConfig = DEFAULT_LASER): CanvasAnalysis {
  const material = MATERIALS[settings.materialId];
  // Minimum material between cuts / minimum stroke follows the material (ТЗ v0.9 table 2).
  const laser = laserFor(minMaterialMm(settings.materialId), baseLaser);
  const minCap = Math.max(material.minLetterMm, minCapHeightMm(settings.materialId));
  const placed = elements.map((element) => ({
    elementId: element.id,
    groups: element.groups.map((group) => placePolygons(group, element.widthMm, element.heightMm, element.transform)),
  }));

  const sheet: Polygon = [[0, 0], [settings.sheetWidthMm, 0], [settings.sheetWidthMm, settings.sheetHeightMm], [0, settings.sheetHeightMm]];
  const issues: CanvasIssue[] = [];
  const pieceMode = settings.result === "piece";
  const piece = pieceMode ? analyzePiece(placed, settings, laser, issues) : undefined;
  const cut: StencilCutResult = piece
    ? {
      cutPaths: piece.shapes, islands: [], bridges: [], thinZones: [],
      cutLengthMm: piece.cutLengthMm, openAreaMm2: piece.areaMm2, bbox: piece.bbox,
    }
    : buildStencilCut(placed.flatMap((p) => p.groups), {
      bridgeWidthMm: bridgeWidthFor(smallestCapMm(elements), laser),
      sheet,
      config: laser,
    });
  const m = settings.marginMm;
  for (const item of placed) {
    const box = bboxOf(item.groups.flat());
    const outsideSheet = box.minX < 0 || box.minY < 0 || box.maxX > settings.sheetWidthMm || box.maxY > settings.sheetHeightMm;
    const outsideMargin = box.minX < m || box.minY < m || box.maxX > settings.sheetWidthMm - m || box.maxY > settings.sheetHeightMm - m;
    if (outsideSheet) {
      issues.push({ kind: "overlap_sheet_edge", level: "error", elementId: item.elementId, at: [box.minX, box.minY], message: "Елемент виходить за край аркуша" });
    } else if (outsideMargin) {
      issues.push({ kind: "out_of_margin", level: "warning", elementId: item.elementId, at: [box.minX, box.minY], message: `Елемент ближче ${m} мм до краю: трафарет може порватися` });
    }
  }

  for (const element of elements) {
    if (element.kind !== "text") continue;
    const cap = element.capMm * element.transform.scale;
    if (cap < minCap) {
      issues.push({
        kind: "letter_too_small", level: "warning", elementId: element.id, at: [element.transform.x, element.transform.y],
        message: `Літери ${Math.round(cap)} мм, для матеріалу «${material.name.uk}» краще від ${minCap} мм`,
      });
    }
  }

  for (const island of cut.islands.filter((i) => !i.connected)) {
    const at: Vec2 = [(island.bbox.minX + island.bbox.maxX) / 2, (island.bbox.minY + island.bbox.maxY) / 2];
    issues.push({ kind: "island_unbridged", level: "error", at, elementId: elementAt(at, placed), message: "Внутрішня деталь не тримається: збільште елемент" });
  }
  for (const bridge of cut.bridges.filter((b) => b.lengthMm > laser.maxBridgeLengthMm)) {
    issues.push({ kind: "bridge_long", level: "warning", at: bridge.from, elementId: elementAt(bridge.from, placed), message: `Перемичка ${Math.round(bridge.lengthMm)} мм: деталь може прогинатися` });
  }
  for (const zone of cut.thinZones) {
    const inside = placed.some((p) => p.groups.flat().some((poly) => pointInPolygon(zone.at, poly)));
    issues.push({
      kind: zone.kind === "material" ? "thin_part" : "thin_slot",
      level: "warning",
      at: zone.at,
      elementId: inside ? elementAt(zone.at, placed) : undefined,
      message: zone.kind === "material" ? `Тонке місце, менше ${laser.minPartMm} мм: може зламатися` : `Вузький проріз, менше ${laser.minSlotMm} мм: фарба може не пройти`,
    });
  }

  return { cut, issues, placed, piece };
}
