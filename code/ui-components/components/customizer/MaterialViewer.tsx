"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";
import { MATERIALS } from "../../lib/stencil-math";
import type { Locale, MaterialOption, MaterialType } from "../../types/customizer";
import { msg } from "../../lib/i18n";

/**
 * Material selector with a depth preview.
 *
 * Default renderer is a real CSS 3D box (front, back and four edge faces with
 * preserve-3d) plus a highlight that follows the pointer: about 3 KB, 60 fps on
 * budget Android phones, no WebGL. Thickness is exaggerated (x8 by default) and
 * the caption says so, because 0.5 mm vs 3 mm is not visible at true scale.
 *
 * Optional: a Three.js renderer can be added later as MaterialViewer3D and loaded with
 * next/dynamic({ ssr: false }) behind a "Подивитися в 3D" button on desktop only,
 * so three.js (~150 KB gzip) never ships in the initial bundle.
 */
export interface MaterialViewerProps {
  value: MaterialType;
  onChange: (id: MaterialType) => void;
  options?: MaterialType[];
  /** Cut pattern drawn on the front face, e.g. the constructor's SVG. */
  pattern?: ReactNode;
  exaggerate?: number;
  className?: string;
  /** Site language: uk (default), ru, en. */
  locale?: Locale;
}

const W = 220;
const H = 150;

export function MaterialViewer({
  value, onChange, options = ["pet_thin", "polystyrene", "acrylic", "magnetic", "plywood", "stainless_steel"], pattern, exaggerate = 8, className = "", locale = "uk",
}: MaterialViewerProps) {
  const L = msg(locale).material;
  const m: MaterialOption = MATERIALS[value];
  const reduce = useReducedMotion();
  const stage = useRef<HTMLDivElement>(null);

  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const spring = { stiffness: 180, damping: 18, mass: 0.6 };
  const rotX = useSpring(useTransform(py, [0, 1], [62, 38]), spring);
  const rotZ = useSpring(useTransform(px, [0, 1], [-48, 0]), spring);
  const glossX = useTransform(px, [0, 1], ["10%", "90%"]);
  const glossY = useTransform(py, [0, 1], ["10%", "90%"]);
  const gloss = useTransform([glossX, glossY], ([x, y]: string[]) =>
    `radial-gradient(circle at ${x} ${y}, rgba(255,255,255,${0.75 * m.look.gloss}) 0%, rgba(255,255,255,0) 45%)`);

  const t = Math.max(2, Math.min(28, m.thicknessMm * exaggerate));
  const mirror = m.finish === "mirror";

  const onMove = (e: React.PointerEvent) => {
    if (reduce || !stage.current) return;
    const r = stage.current.getBoundingClientRect();
    px.set((e.clientX - r.left) / r.width);
    py.set((e.clientY - r.top) / r.height);
  };
  const reset = () => { px.set(0.5); py.set(0.5); };

  const face = mirror
    ? `linear-gradient(135deg, ${m.look.face}, #ffffff 40%, ${m.look.edge} 60%, ${m.look.face})`
    : `color-mix(in srgb, ${m.look.face} ${Math.round(m.look.opacity * 100)}%, transparent)`;
  const faceStyle = { width: W, height: H, background: face, border: `1px solid ${m.look.edge}` } as const;
  const edge = { background: m.look.edge } as const;

  return (
    <div className={`rounded-[var(--radius)] border border-[var(--line)] p-4 ${className}`}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div
          ref={stage}
          onPointerMove={onMove}
          onPointerLeave={reset}
          aria-hidden="true"
          className="grid h-[200px] w-full max-w-[300px] flex-none cursor-grab place-items-center"
          style={{ perspective: 800, touchAction: "pan-y" }}
        >
          <motion.div
            className="relative"
            style={{ width: W, height: H, transformStyle: "preserve-3d", rotateX: reduce ? 52 : rotX, rotateZ: reduce ? -24 : rotZ }}
          >
            {/* front */}
            <div className="absolute inset-0 overflow-hidden rounded-[3px]" style={{ ...faceStyle, transform: `translateZ(${t / 2}px)` }}>
              {pattern}
              <motion.div className="absolute inset-0" style={{ background: gloss }} />
            </div>
            {/* back */}
            <div className="absolute inset-0 rounded-[3px]" style={{ ...faceStyle, transform: `rotateY(180deg) translateZ(${t / 2}px)` }} />
            {/* edges: each strip is centred on a border line, then turned 90° around its own centre */}
            <div className="absolute" style={{ ...edge, width: W, height: t, left: 0, top: -t / 2, transform: "rotateX(90deg)" }} />
            <div className="absolute" style={{ ...edge, width: W, height: t, left: 0, top: H - t / 2, transform: "rotateX(90deg)", filter: "brightness(.85)" }} />
            <div className="absolute" style={{ ...edge, width: t, height: H, left: -t / 2, top: 0, transform: "rotateY(90deg)", filter: "brightness(.92)" }} />
            <div className="absolute" style={{ ...edge, width: t, height: H, left: W - t / 2, top: 0, transform: "rotateY(90deg)", filter: "brightness(.78)" }} />
          </motion.div>
        </div>

        <div className="min-w-0 text-sm">
          <p className="font-semibold text-[var(--ink)]" style={{ fontFamily: "var(--font-spec)" }}>{m.name[locale]}</p>
          <p className="mt-1 text-[var(--muted)]">{m.note.uk}.</p>
          <p className="mt-1 text-[var(--muted)]">{L.exaggerated(exaggerate)}</p>
        </div>
      </div>

      <div role="radiogroup" aria-label={L.group} className="mt-4 flex flex-wrap gap-2">
        {options.map((id) => {
          const o = MATERIALS[id];
          const on = id === value;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => onChange(id)}
              className={`flex min-h-11 items-center gap-2 rounded-full border-[1.5px] px-3.5 text-sm transition-colors ${on ? "border-[var(--ink)] shadow-[inset_0_0_0_1px_var(--ink)]" : "border-[var(--line)] hover:border-[var(--muted)]"}`}
            >
              <span className="h-4 w-4 rounded-full border" style={{ background: o.look.face, borderColor: o.look.edge }} aria-hidden="true" />
              {o.name[locale]}
              {o.baseSquareMeterPrice == null && <span className="text-xs text-[var(--muted)]">{L.onRequest}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
