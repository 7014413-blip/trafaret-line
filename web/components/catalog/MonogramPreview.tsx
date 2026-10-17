"use client";

// Live preview of a wedding monogram stencil: the real cut with bridges (the same
// buildStencilCut the laser file uses, in the geometry worker) for the chosen size,
// design and initials. Two views: the stencil sheet and the print on an iced cookie.

import { useLocale } from "@/components/i18n/LocaleProvider";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { units } from "@/lib/i18n/dictionaries/units";
import { useEffect, useMemo, useRef, useState } from "react";
import type { MonogramFontRole, MonogramInput, MonogramStyle } from "@/types/monogram";
import type { StencilCutResult } from "@/types/geometry";
import type { LoadedFont } from "@/types/text";
import { buildMonogramDesign, fontRolesOf } from "@/lib/monogram/build-design";
import { MONOGRAM_CONFIG, monogramLaser } from "@/lib/monogram/config";
import { loadMonogramFonts } from "@/lib/client/monogram-fonts";
import { computeStencilCut } from "@/lib/client/geometry-client";
import { polygonsToPathData } from "@/lib/geometry/svg-path";

export type MonogramView = "stencil" | "cookie";

const LOOK = {
  backdrop: "#e9e4dc",
  sheet: "#f4f7fa",
  sheetEdge: "#c9d3dc",
  hole: "#5b2a35",
  icing: "#fffdf9",
  cookieEdge: "#e6c79a",
  paint: "#b88a9a",
};

interface Preview {
  key: string;
  cut: StencilCutResult;
  dateCapMm: number | null;
  missing: string[];
}

export function MonogramPreview({ style, input, sheetMm, view }: {
  style: MonogramStyle;
  input: MonogramInput;
  sheetMm: [number, number];
  view: MonogramView;
}) {
  const locale = useLocale();
  const t = tr(CATALOG, locale);
  const [fonts, setFonts] = useState<Partial<Record<MonogramFontRole, LoadedFont>> | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(0);
  const roles = useMemo(() => fontRolesOf(style), [style]);
  const [width, height] = sheetMm;
  const key = `${style.id}|${input.first}|${input.second}|${input.date}|${width}x${height}`;

  useEffect(() => {
    let alive = true;
    loadMonogramFonts(roles)
      .then((loaded) => alive && setFonts((current) => ({ ...current, ...loaded })))
      .catch(() => alive && setError(t.monogramFontsFailed));
    return () => {
      alive = false;
    };
  }, [roles, t.monogramFontsFailed]);

  useEffect(() => {
    if (!fonts || !roles.every((role) => fonts[role])) return;
    const ticket = ++latest.current;
    // Short pause while the buyer types, then one cut for the latest text.
    const timer = setTimeout(() => {
      const design = buildMonogramDesign(style, input, fonts, { width, height });
      computeStencilCut(design.groups, {
        bridgeWidthMm: design.bridgeWidthMm,
        config: monogramLaser(),
        sheet: [[0, 0], [width, 0], [width, height], [0, height]],
      })
        .then((cut) => {
          if (ticket !== latest.current) return;
          setPreview({ key, cut, dateCapMm: design.dateCapMm, missing: design.missing });
          setError(null);
        })
        .catch(() => ticket === latest.current && setError(t.monogramPreviewFailed));
    }, 250);
    return () => clearTimeout(timer);
  }, [fonts, roles, style, input, width, height, key, t.monogramPreviewFailed]);

  const pad = Math.max(width, height) * 0.08;
  const d = preview ? polygonsToPathData(preview.cut.cutPaths) : "";
  const busy = !preview || preview.key !== key;
  const smallDate = preview?.dateCapMm != null && preview.dateCapMm < MONOGRAM_CONFIG.smallDateCapMm;
  const label = t.monogramPreviewLabel(Math.round(width / 10), Math.round(height / 10), `${[input.first, input.second].filter(Boolean).join(" & ")}${input.date ? `, ${input.date}` : ""}`);

  return (
    <div className="grid gap-2">
      <div className="relative aspect-square overflow-hidden rounded-[20px] border border-[var(--line)]" style={{ background: LOOK.backdrop }}>
        <svg viewBox={`${-pad} ${-pad} ${width + pad * 2} ${height + pad * 2}`} className="block h-full w-full" role="img" aria-label={label}>
          {view === "stencil" ? (
            <>
              <rect x={0} y={0} width={width} height={height} rx={Math.min(width, height) * 0.015} fill={LOOK.sheet} fillOpacity={0.92} stroke={LOOK.sheetEdge} strokeWidth={Math.max(0.3, width / 300)} />
              <path d={d} fill={LOOK.hole} fillRule="nonzero" />
            </>
          ) : (
            <>
              <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.5 + pad * 0.6} fill={LOOK.cookieEdge} />
              <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) * 0.5 + pad * 0.3} fill={LOOK.icing} />
              <path d={d} fill={LOOK.paint} fillRule="nonzero" />
            </>
          )}
        </svg>
        {busy && <span className="absolute top-3 left-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#0f172a]">{t.monogramBuilding}</span>}
        <span className="absolute right-3 bottom-3 rounded-full bg-white/90 px-2.5 py-1 text-xs text-[#0f172a] tabular-nums">{Math.round(width / 10)} × {Math.round(height / 10)} {units(locale).cm}</span>
      </div>
      {error && <p role="alert" className="m-0 text-sm text-[var(--danger,#b91c1c)]">{error}</p>}
      {preview && preview.missing.length > 0 && (
        <p role="status" className="m-0 text-sm">{t.monogramMissing(preview.missing.join(" "))}</p>
      )}
      {smallDate && (
        <p role="status" className="m-0 text-sm text-[var(--muted)]">{t.monogramSmallDate}</p>
      )}
    </div>
  );
}
