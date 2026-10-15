// Monogram design → contour groups in millimetres on the sheet, ready for buildStencilCut
// (lib/geometry/bridges.ts adds the bridges). The 100-unit design box is centred on the
// sheet; strokes and hairlines that would be narrower than the slot limit at this size
// are widened, so a 5 × 5 cm stencil still lets sugar through every line.

import type { Polygon, Vec2 } from "../../types/geometry";
import type { MonogramDesign, MonogramFontRole, MonogramGlyphElement, MonogramInput, MonogramStyle } from "../../types/monogram";
import type { LoadedFont } from "../../types/text";
import { FillRule, simplify, union } from "../geometry/clipper";
import { growPolygons } from "../geometry/grow";
import { unionSolids } from "../geometry/union-solids";
import { CONSTRUCTOR_CONFIG } from "../geometry/config";
import { DEFAULT_LASER } from "../geometry/laser-config";
import { orientContours } from "../geometry/orient-contours";
import { MONOGRAM_CONFIG, monogramBridgeWidth } from "./config";
import { placeText } from "./glyph-outline";
import { knockOut } from "./knockout";
import { arcOutline, branchOutline, heartOutline, lineOutline } from "./ornaments";
import { MONOGRAM_HAIRLINE_SHARE } from "./styles";

const SCALE = DEFAULT_LASER.clipperScale;

/** Font roles a design needs (to load only those fonts). */
export function fontRolesOf(style: MonogramStyle): MonogramFontRole[] {
  const roles = new Set<MonogramFontRole>();
  for (const element of style.elements) if ("font" in element) roles.add(element.font);
  return [...roles];
}

function textFor(element: MonogramGlyphElement, input: MonogramInput): string {
  if (element.kind === "amp") return "&";
  if (element.kind === "date") return input.date;
  return input[element.kind];
}

/**
 * On small sheets the date and the ampersand would be too small to cut: they get a
 * minimum capital height in mm, within the width of their place in the design.
 */
function readable(element: MonogramGlyphElement, mmPerUnit: number): MonogramGlyphElement {
  const minMm = element.kind === "date" ? MONOGRAM_CONFIG.minDateCapMm : element.kind === "amp" ? MONOGRAM_CONFIG.minAmpCapMm : 0;
  const minCap = minMm / mmPerUnit;
  if (element.cap >= minCap) return element;
  // The width limit stays: the text grows only as far as its place in the design allows.
  return { ...element, cap: minCap };
}

export function buildMonogramDesign(
  style: MonogramStyle,
  input: MonogramInput,
  fonts: Partial<Record<MonogramFontRole, LoadedFont>>,
  sheetMm: { width: number; height: number },
): MonogramDesign {
  const s = (Math.min(sheetMm.width, sheetMm.height) * MONOGRAM_CONFIG.designShare) / 100;
  const ox = (sheetMm.width - 100 * s) / 2;
  const oy = (sheetMm.height - 100 * s) / 2;
  const toMm = (polygon: Polygon): Vec2[] => polygon.map(([x, y]) => [ox + x * s, oy + y * s] as Vec2);
  const minUnits = MONOGRAM_CONFIG.minSlotMm / s;
  const width = (w: number) => Math.max(w, minUnits);

  const groups: Polygon[][] = [];
  const missing = new Set<string>();
  // Indexes in `groups`: the letters and the ampersand that lies on top of them.
  const letterGroups: number[] = [];
  const overGroups: number[] = [];
  let initialsCapMm = 0;
  let dateCapMm: number | null = null;

  for (const element of style.elements) {
    switch (element.kind) {
      case "arc":
        groups.push(unionSolids(arcOutline(element, width(element.width)).map(toMm), SCALE));
        break;
      case "line":
        groups.push(unionSolids(lineOutline(element, width(element.width)).map(toMm), SCALE));
        break;
      case "heart":
        groups.push(unionSolids(heartOutline(element).map(toMm), SCALE));
        break;
      case "branch":
        groups.push(unionSolids(branchOutline(element, width(element.width), minUnits * 1.6).map(toMm), SCALE));
        break;
      default: {
        const font = fonts[element.font];
        const text = textFor(element, input);
        if (!font || !text) break;
        const placed = placeText(font, text, readable(element, s));
        placed.missing.forEach((ch) => missing.add(ch));
        const capMm = placed.cap * s;
        if (element.kind === "first" || element.kind === "second") initialsCapMm = Math.max(initialsCapMm, capMm);
        if (element.kind === "date") dateCapMm = capMm;
        // Hairlines of small letters are widened up to the slot limit, nothing else changes.
        const grow = Math.min(
          MONOGRAM_CONFIG.maxGrowShareOfCap * capMm,
          Math.max(0, (MONOGRAM_CONFIG.minSlotMm - MONOGRAM_HAIRLINE_SHARE[element.font] * capMm) / 2),
        );
        for (const group of placed.groups) {
          // Font outlines may overlap inside one glyph and holes may run either way:
          // orientContours fixes the winding, NonZero then merges overlaps and keeps counters.
          const solid = union(orientContours(group.map(toMm)), SCALE, FillRule.NonZero);
          if (element.kind === "first" || element.kind === "second") letterGroups.push(groups.length);
          if (element.kind === "amp" && element.overLetters) overGroups.push(groups.length);
          groups.push(grow > 0 ? growPolygons(solid, grow, SCALE) : solid);
        }
      }
    }
  }

  const bridgeWidthMm = monogramBridgeWidth(initialsCapMm);
  if (overGroups.length && letterGroups.length) {
    // The strip between the ampersand and a letter is as wide as a bridge, so it holds as well.
    const cut = knockOut(
      letterGroups.map((i) => groups[i]),
      overGroups.flatMap((i) => groups[i]),
      bridgeWidthMm,
      MONOGRAM_CONFIG.minSlotMm ** 2,
      SCALE,
    );
    letterGroups.forEach((i, k) => {
      groups[i] = cut[k];
    });
  }

  // Dense outlines (font curves, widened hairlines) are thinned out to the curve tolerance:
  // the cut looks the same and bridges and thin-zone checks run several times faster.
  const tolerance = Math.min(CONSTRUCTOR_CONFIG.curveToleranceMm, s * 0.05);
  const lean = groups.map((group) => simplify(group, tolerance, SCALE)).filter((group) => group.length);
  return { groups: lean, capMm: initialsCapMm, dateCapMm, bridgeWidthMm, missing: [...missing] };
}
