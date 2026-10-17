"use client";

// Live preview of a business sign, as close to the real thing as a drawing gets:
// the base with its visible edge (thickness) and a soft wall shadow, gloss highlights, frosted
// and clear sheets, mirror gradients, the raised overlay (text lines, edge text, logo, frame)
// with its own small shadow, and the metal standoff caps. Every text line may have its own
// sheet. The logo picture is tinted with its sheet: dark parts of the picture (or light parts
// when inverted) become the overlay. Two views: the sign close up, and the sign on a wall next
// to a person 1.75 m tall, so the size reads at a glance.

import { useId } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { PlacedLinePaths } from "@/components/signage/PlacedLinePaths";
import { PreviewSvg } from "@/components/signage/PreviewSvg";
import { findBusinessSignSheet } from "@/lib/business-sign/palette";
import { shadeHex } from "@/lib/business-sign/shade-hex";
import { SIGNAGE_SIGN } from "@/lib/i18n/dictionaries/signage-sign";
import { tr } from "@/lib/i18n/translate";
import type { BusinessSignDesign, BusinessSignLayout } from "@/types/business-sign";
import type { AcrylicSheet } from "@/types/signage";

export type BusinessSignView = "close" | "wall";

/** Person drawn next to the sign in the wall view, mm. */
const PERSON_HEIGHT_MM = 1750;

const points = (list: [number, number][]) => list.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(" ");

function SheetPaint({ id, sheet }: { id: string; sheet: AcrylicSheet }) {
  if (sheet.finish === "mirror") {
    return (
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#f8fafc" />
        <stop offset=".42" stopColor={sheet.hex} />
        <stop offset=".58" stopColor="#f8fafc" />
        <stop offset="1" stopColor={sheet.hex} />
      </linearGradient>
    );
  }
  if (sheet.finish === "matte") {
    // Frosted sheet: soft light in the middle, slightly darker towards the edges.
    return (
      <radialGradient id={id} cx=".45" cy=".4" r=".75">
        <stop offset="0" stopColor={shadeHex(sheet.hex, 1.04)} />
        <stop offset="1" stopColor={shadeHex(sheet.hex, 0.94)} />
      </radialGradient>
    );
  }
  return null;
}

function SignGraphic({ design, layout, linePaths, logoUrl, uid }: {
  design: BusinessSignDesign;
  layout: BusinessSignLayout;
  linePaths: Map<number, string>;
  logoUrl: string | null;
  uid: string;
}) {
  const w = layout.widthMm;
  const h = layout.heightMm;
  const baseSheet = findBusinessSignSheet(design.baseMaterialId);
  const fill = (id: string) => {
    const sheet = findBusinessSignSheet(id);
    return sheet.finish === "mirror" || sheet.finish === "matte" ? `url(#m${uid}-${sheet.id})` : sheet.hex;
  };
  const arcFill = design.arc ? fill(design.arc.materialId) : "none";
  const capR = Math.max(4, Math.min(w, h) * 0.016);
  // The edge is drawn a little thicker than life so a 3 mm sheet still reads as a plate.
  const edge = Math.max(design.baseThicknessMm * 1.4, Math.min(w, h) * 0.008);
  const clear = baseSheet.finish === "clear";
  const outline = points(layout.outline);

  return (
    <g>
      <polygon points={outline} transform={`translate(0 ${edge})`} fill={clear ? "rgba(148,163,184,.35)" : shadeHex(baseSheet.hex, baseSheet.finish === "mirror" ? 0.55 : 0.7)} filter={`url(#s${uid})`} />
      <polygon points={outline} fill={fill(baseSheet.id)} fillOpacity={clear ? 0.45 : 1} stroke={clear ? "rgba(100,116,139,.6)" : "rgba(15,23,42,.18)"} strokeWidth={Math.max(0.3, w / 700)} />
      {(baseSheet.finish === "gloss" || clear) && <polygon points={outline} fill={`url(#g${uid})`} />}

      <g filter={`url(#r${uid})`}>
        {layout.frame && design.frameMaterialId && (layout.frame.kind === "circle"
          ? <circle cx={0} cy={0} r={layout.frame.r} fill="none" stroke={fill(design.frameMaterialId)} strokeWidth={layout.frame.stroke} />
          : <rect x={layout.frame.x} y={layout.frame.y} width={layout.frame.width} height={layout.frame.height} rx={layout.frame.corner}
              fill="none" stroke={fill(design.frameMaterialId)} strokeWidth={layout.frame.stroke} />)}
        {layout.innerRing && <circle cx={0} cy={0} r={layout.innerRing.r} fill="none" stroke={arcFill} strokeWidth={layout.innerRing.stroke} />}
        {layout.arcs.map((arc) => <path key={arc.position} d={arc.pathData} fill={arcFill} />)}
        <PlacedLinePaths lines={layout.lines} paths={linePaths} fill={(line) => { const source = design.lines[line.index]; return source ? fill(source.materialId) : null; }} />
        {layout.logo && logoUrl && (
          <image href={logoUrl} x={layout.logo.x} y={layout.logo.y} width={layout.logo.width} height={layout.logo.height}
            preserveAspectRatio="xMidYMid meet" filter={`url(#l${uid})`} />
        )}
      </g>

      {layout.holes.map((p, i) => (
        <g key={i}>
          <circle cx={p.x + capR * 0.25} cy={p.y + capR * 0.35} r={capR} fill="rgba(0,0,0,.3)" />
          <circle cx={p.x} cy={p.y} r={capR} fill={`url(#cap${uid})`} stroke="rgba(15,23,42,.35)" strokeWidth={Math.max(0.3, capR / 10)} />
        </g>
      ))}
    </g>
  );
}

export function BusinessSignPreview({ design, layout, linePaths, logoUrl, label, view = "close" }: {
  design: BusinessSignDesign;
  layout: BusinessSignLayout;
  /** SVG path of every text line in layout units, by line index. */
  linePaths: Map<number, string>;
  logoUrl: string | null;
  label: string;
  view?: BusinessSignView;
}) {
  const t = tr(SIGNAGE_SIGN, useLocale());
  const uid = useId().replace(/:/g, "");
  const w = layout.widthMm;
  const h = layout.heightMm;
  const shadow = Math.max(0.6, Math.min(w, h) * 0.008);

  // Every sheet used on the sign, once, with its gradient when it has one.
  const used = new Set<string>([design.baseMaterialId, ...design.lines.map((l) => l.materialId)]);
  if (design.logo) used.add(design.logo.materialId);
  if (design.arc) used.add(design.arc.materialId);
  if (design.frameMaterialId) used.add(design.frameMaterialId);
  const sheets = [...used].map(findBusinessSignSheet);
  const logoSheet = design.logo ? findBusinessSignSheet(design.logo.materialId) : null;
  // Alpha from luminance: dark pixels opaque (normal) or light pixels opaque (inverted).
  const alphaRow = design.logo?.invert ? "0.2126 0.7152 0.0722 1 -1" : "-0.2126 -0.7152 -0.0722 1 0";

  const defs = (
    <defs>
      {sheets.map((s) => <SheetPaint key={s.id} id={`m${uid}-${s.id}`} sheet={s} />)}
      <linearGradient id={`g${uid}`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#fff" stopOpacity=".22" />
        <stop offset=".35" stopColor="#fff" stopOpacity=".04" />
        <stop offset=".36" stopColor="#fff" stopOpacity="0" />
        <stop offset="1" stopColor="#fff" stopOpacity="0" />
      </linearGradient>
      <radialGradient id={`cap${uid}`} cx=".35" cy=".35" r=".75">
        <stop offset="0" stopColor="#fff7dd" />
        <stop offset=".5" stopColor="#c9a24a" />
        <stop offset="1" stopColor="#7a5a1c" />
      </radialGradient>
      <filter id={`s${uid}`} x="-15%" y="-15%" width="130%" height="140%">
        <feDropShadow dx="0" dy={h * 0.02} stdDeviation={Math.min(w, h) * 0.025} floodOpacity=".3" />
      </filter>
      <filter id={`r${uid}`} x="-5%" y="-5%" width="110%" height="115%">
        <feDropShadow dx={shadow * 0.5} dy={shadow} stdDeviation={shadow * 0.6} floodColor="#000" floodOpacity=".45" />
      </filter>
      {logoSheet && (
        <filter id={`l${uid}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  ${alphaRow}`} result="a" />
          <feComponentTransfer in="a" result="m"><feFuncA type="linear" slope="2.4" intercept="-0.6" /></feComponentTransfer>
          <feFlood floodColor={logoSheet.hex} result="c" />
          <feComposite in="c" in2="m" operator="in" />
        </filter>
      )}
      <linearGradient id={`wall${uid}`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#f1ede6" />
        <stop offset="1" stopColor="#e4ded4" />
      </linearGradient>
    </defs>
  );
  const graphic = <SignGraphic design={design} layout={layout} linePaths={linePaths} logoUrl={logoUrl} uid={uid} />;

  if (view === "wall") {
    // Floor at y = 0, up is negative. The sign hangs with its centre at 1.5 m (higher when tall).
    const wallH = Math.max(2400, h + 900);
    const signCy = -Math.max(1500, h / 2 + 450);
    const personGap = Math.max(350, w * 0.15);
    const personW = 480;
    const right = w / 2 + personGap + personW + 400;
    // Landscape wall (about 4:3), the extra width goes to the left of the sign.
    const left = Math.min(-w / 2 - Math.max(300, w * 0.35), right - (wallH + 120) * 1.35);
    const wallW = right - left;
    const px = w / 2 + personGap + personW / 2;
    const head = 115;
    return (
      <svg viewBox={`${left} ${-wallH} ${wallW} ${wallH + 120}`} className="block h-auto max-h-[62vh] w-full" role="img" aria-label={t.onWallLabel(label)}>
        {defs}
        <rect x={left} y={-wallH} width={wallW} height={wallH} fill={`url(#wall${uid})`} />
        <rect x={left} y={0} width={wallW} height={120} fill="#cfc6b8" />
        <g transform={`translate(0 ${signCy})`}>{graphic}</g>
        <g fill="#94a3b8" opacity=".55" aria-hidden="true">
          <circle cx={px} cy={-PERSON_HEIGHT_MM + head} r={head} />
          <rect x={px - personW / 2} y={-PERSON_HEIGHT_MM + head * 2 + 40} width={personW} height={720} rx={150} />
          <rect x={px - personW / 2 + 40} y={-PERSON_HEIGHT_MM + head * 2 + 600} width={170} height={PERSON_HEIGHT_MM - head * 2 - 600} rx={70} />
          <rect x={px + personW / 2 - 210} y={-PERSON_HEIGHT_MM + head * 2 + 600} width={170} height={PERSON_HEIGHT_MM - head * 2 - 600} rx={70} />
        </g>
        <text x={px} y={-PERSON_HEIGHT_MM - 60} textAnchor="middle" fontSize={90} fill="#64748b">1,75 м</text>
      </svg>
    );
  }

  const pad = Math.max(w, h) * 0.08;
  return (
    <PreviewSvg viewBox={[-w / 2 - pad, -h / 2 - pad, w + pad * 2, h + pad * 2]} label={label}>
      {defs}
      {graphic}
    </PreviewSvg>
  );
}
