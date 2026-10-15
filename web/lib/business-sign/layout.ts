// Places everything on a business sign (mm, origin at the sign centre, Y down): base outline,
// frame, mounting holes, edge text of round signs, the logo and the text lines. Pure function:
// the preview, the checks and the order use the same numbers. The logo sits above the text or
// to its left; logo and text together are centred in the content area.

import type {
  BusinessSignArcMeasure, BusinessSignArcPlacement, BusinessSignConfig, BusinessSignDesign, BusinessSignLayout,
  BusinessSignLinePlacement, BusinessSignZone,
} from "../../types/business-sign";
import type { PlaqueLineInput } from "../../types/plaques";
import type { SignPricingConfig } from "../../types/signage";
import { DEFAULT_SIGN_PRICING, signHoles, signOutline } from "../calculators/signage";
import type { MeasuredPlaqueLine } from "../plaques/measure-line";
import { fitPlaqueLines } from "../plaques/fit-lines";
import { DEFAULT_BUSINESS_SIGN_CONFIG } from "./config";
import { businessSignContent } from "./content-zone";
import { businessSignFrame, businessSignFrameSize } from "./frame";
import { placeArcText } from "./place-arc";

type LayoutDesign = Pick<BusinessSignDesign, "shape" | "widthMm" | "heightMm" | "direction" | "lines" | "logo" | "frameMaterialId" | "holes">;

/** Text lines fitted into a zone; empty lines are skipped. */
function fitLines(design: LayoutDesign, measured: (MeasuredPlaqueLine | null)[], zone: BusinessSignZone) {
  const active: PlaqueLineInput[] = [];
  design.lines.forEach((line, index) => {
    const m = measured[index];
    if (m) active.push({ index, size: line.size, measure: m.measure });
  });
  if (!active.length) return { placements: [] as BusinessSignLinePlacement[], blockHeight: 0, blockWidth: 0 };
  const fit = fitPlaqueLines(active, zone);
  const placements = fit.slots.map((slot): BusinessSignLinePlacement => {
    const m = measured[slot.index] as MeasuredPlaqueLine;
    const width = m.measure.widthUnits * slot.scale;
    const height = m.measure.heightUnits * slot.scale;
    return { index: slot.index, x: slot.groupLeft, y: slot.rowTop, width, height, capMm: slot.capMm, scale: slot.scale };
  });
  const blockWidth = Math.max(0, ...placements.map((p) => p.width));
  return { placements, blockHeight: fit.blockHeight, blockWidth };
}

const shift = (lines: BusinessSignLinePlacement[], dx: number, dy: number) => lines.map((l) => ({ ...l, x: l.x + dx, y: l.y + dy }));

export function computeBusinessSignLayout(
  design: LayoutDesign,
  measured: (MeasuredPlaqueLine | null)[],
  arcs: { top: BusinessSignArcMeasure | null; bottom: BusinessSignArcMeasure | null },
  cfg: BusinessSignConfig = DEFAULT_BUSINESS_SIGN_CONFIG,
  signCfg: SignPricingConfig = DEFAULT_SIGN_PRICING,
): BusinessSignLayout {
  const square = design.shape === "circle" || design.shape === "square";
  const w = design.widthMm;
  const h = square ? design.widthMm : design.heightMm;
  const base = { shape: design.shape, widthMm: w, heightMm: h, direction: design.direction, materialId: "", thicknessMm: 0 };
  const outline = signOutline(base).map(([x, y]) => [x - w / 2, y - h / 2] as [number, number]);
  const holes = signHoles(base, design.holes, signCfg);
  const short = Math.min(w, h);
  const padding = short * cfg.paddingShare;

  const frameSize = businessSignFrameSize(w, h, design.holes, cfg, signCfg);
  const frame = design.frameMaterialId ? businessSignFrame(design.shape, w, h, frameSize) : null;
  // Content starts inside the frame, or inside the hole ring when there is no frame.
  const holeRing = design.holes > 0 ? signCfg.holeEdgeOffsetMm + signCfg.holeDiameterMm / 2 + 8 : 0;
  const edge = frame ? frameSize.inset + frameSize.stroke + padding : Math.max(padding * 1.4, signCfg.edgeClearanceMm, holeRing);
  const hasArc = design.shape === "circle" && !!(arcs.top || arcs.bottom);
  const content = businessSignContent(design.shape, w, h, design.direction, edge, hasArc, frameSize.stroke, cfg);
  const zone = content.zone;

  const arcPlacements: BusinessSignArcPlacement[] = [];
  if (content.arcBand) {
    const { inner, outer } = content.arcBand;
    if (arcs.top) arcPlacements.push(placeArcText(arcs.top, "top", inner, outer, cfg.arcCapShare, cfg.arcMaxSpanDeg));
    if (arcs.bottom) arcPlacements.push(placeArcText(arcs.bottom, "bottom", inner, outer, cfg.arcCapShare, cfg.arcMaxSpanDeg));
  }

  const zoneW = Math.max(0, zone.right - zone.left);
  const zoneH = Math.max(0, zone.bottom - zone.top);
  const centreX = (zone.left + zone.right) / 2;
  const centreY = (zone.top + zone.bottom) / 2;
  const hasText = measured.some(Boolean);
  let logo: BusinessSignLayout["logo"] = null;
  let lines: BusinessSignLinePlacement[] = [];

  if (design.logo && !hasText) {
    // Logo alone: as large as the content area allows.
    const width = Math.min(zoneW, zoneH * design.logo.aspect);
    const height = width / design.logo.aspect;
    logo = { x: centreX - width / 2, y: centreY - height / 2, width, height };
  } else if (design.logo && design.logo.place === "above") {
    const gap = zoneH * cfg.logoGapShare;
    const band = zoneH * design.logo.share;
    const width = Math.min(zoneW, band * design.logo.aspect);
    const height = width / design.logo.aspect;
    const text = fitLines(design, measured, { left: zone.left, right: zone.right, top: zone.top + band + gap, bottom: zone.bottom });
    const groupHeight = height + gap + text.blockHeight;
    const top = centreY - groupHeight / 2;
    logo = { x: centreX - width / 2, y: top, width, height };
    const firstTop = text.placements.length ? Math.min(...text.placements.map((p) => p.y)) : 0;
    lines = shift(text.placements, 0, top + height + gap - firstTop);
  } else if (design.logo) {
    const gap = zoneW * cfg.logoGapShare;
    const band = zoneW * design.logo.share;
    const height = Math.min(zoneH, band / design.logo.aspect);
    const width = height * design.logo.aspect;
    const text = fitLines(design, measured, { left: zone.left + band + gap, right: zone.right, top: zone.top, bottom: zone.bottom });
    const groupWidth = width + gap + text.blockWidth;
    const left = centreX - groupWidth / 2;
    logo = { x: left, y: centreY - height / 2, width, height };
    // Lines keep their centring among themselves; the block moves next to the logo.
    const blockLeft = text.placements.length ? Math.min(...text.placements.map((p) => p.x)) : 0;
    lines = shift(text.placements, left + width + gap - blockLeft, 0);
  } else {
    lines = fitLines(design, measured, zone).placements;
  }

  return {
    widthMm: w,
    heightMm: h,
    outline,
    frame,
    innerRing: content.innerRing,
    zone,
    logo,
    lines,
    arcs: arcPlacements,
    holes,
  };
}
