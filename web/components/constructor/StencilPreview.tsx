"use client";

// Stencil preview from the real cut (bridges are gaps in the cut regions, exactly as
// the laser will cut them). Views: the stencil itself, paint on a wall, sugar on a cake.
// Problem places are marked: islands without bridges and too-thin zones.

import type { MaterialOption, SheetSize } from "@/types/customizer";
import type { StencilCutResult } from "@/types/geometry";
import { polygonsToPathData } from "@/lib/geometry/svg-path";

export type StencilView = "stencil" | "wall" | "cake";

const BACKDROP = "#1e293b";
const PAINT: Record<Exclude<StencilView, "stencil">, { surface: string; paint: string }> = {
  wall: { surface: "#e9e4dc", paint: "#0f172a" },
  cake: { surface: "#f3e4cc", paint: "#5b331e" },
};

export function StencilPreview({ sheet, cut, material, view, showIssues }: {
  sheet: SheetSize;
  cut: StencilCutResult;
  material: MaterialOption;
  view: StencilView;
  showIssues: boolean;
}) {
  const pad = Math.max(sheet.widthMm, sheet.heightMm) * 0.06;
  const box = { x: -pad, y: -pad, w: sheet.widthMm + pad * 2, h: sheet.heightMm + pad * 2 };
  const d = polygonsToPathData(cut.cutPaths);
  const marker = Math.max(2, Math.max(sheet.widthMm, sheet.heightMm) / 120);
  const lost = cut.islands.filter((i) => !i.connected);
  const isCircle = sheet.shape === "circle";

  return (
    <svg viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`} className="block h-auto max-h-[60vh] w-full" role="img"
      aria-label={`Превʼю трафарету ${Math.round(sheet.widthMm / 10)}×${Math.round(sheet.heightMm / 10)} см`}>
      {view === "stencil" ? (
        <>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={BACKDROP} />
          {isCircle
            ? <circle cx={sheet.widthMm / 2} cy={sheet.widthMm / 2} r={sheet.widthMm / 2} fill={material.look.face} fillOpacity={Math.max(0.6, material.look.opacity)} />
            : <rect x="0" y="0" width={sheet.widthMm} height={sheet.heightMm} fill={material.look.face} fillOpacity={Math.max(0.6, material.look.opacity)} />}
          <path d={d} fill={BACKDROP} fillRule="nonzero" />
          {isCircle
            ? <circle cx={sheet.widthMm / 2} cy={sheet.widthMm / 2} r={sheet.widthMm / 2} fill="none" stroke={material.look.edge} strokeWidth={Math.max(1, sheet.widthMm / 400)} />
            : <rect x="0" y="0" width={sheet.widthMm} height={sheet.heightMm} fill="none" stroke={material.look.edge} strokeWidth={Math.max(1, sheet.widthMm / 400)} />}
        </>
      ) : (
        <>
          <rect x={box.x} y={box.y} width={box.w} height={box.h} fill={PAINT[view].surface} />
          <path d={d} fill={PAINT[view].paint} fillRule="nonzero" />
        </>
      )}
      {showIssues && (
        <g aria-hidden>
          {lost.map((island) => (
            <path key={`i${island.id}`} d={polygonsToPathData([island.outline])} fill="none" stroke="#dc2626" strokeWidth={marker / 3} strokeDasharray={`${marker} ${marker / 2}`} />
          ))}
          {cut.thinZones.map((zone, i) => (
            <circle key={`z${i}`} cx={zone.at[0]} cy={zone.at[1]} r={marker * 1.6} fill="none" stroke={zone.kind === "material" ? "#dc2626" : "#d97706"} strokeWidth={marker / 3} />
          ))}
        </g>
      )}
    </svg>
  );
}
