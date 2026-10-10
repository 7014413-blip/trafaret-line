"use client";

import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import type { Locale } from "../../types/customizer";
import { msg } from "../../lib/i18n";

/**
 * «Трафарет ↔ Результат», based on Денис's draft (2026-10-08).
 * Left: the stencil on the surface. Right: the applied result.
 *
 * Input:
 *  - mouse: the divider follows the cursor (as in the draft), click-drag also works;
 *  - touch/pen: drag anywhere on the image (pointer capture, vertical scroll still works);
 *  - keyboard: role="slider", ← → by 2 %, PageUp/PageDown by 10 %, Home/End.
 * Images go through next/image; the result image loads after first interaction or 1.2 s,
 * so it never competes with the LCP image.
 */
type Img = string | { src: string; alt: string };

export interface BeforeAfterProps {
  stencilImage?: Img;      // прозорий трафарет на поверхні
  resultImage?: Img;       // нанесений крем / фарба
  /** Live constructor output instead of photos (e.g. inline SVG). */
  stencilNode?: ReactNode;
  resultNode?: ReactNode;
  aspectRatio?: string;    // tailwind class, default as in the draft
  stencilLabel?: string;
  resultLabel?: string;
  ariaLabel?: string;
  initial?: number;
  priority?: boolean;
  hint?: boolean;
  followPointer?: boolean; // mouse hover moves the divider (draft behaviour)
  className?: string;
  /** Site language for default labels: uk (default), ru, en. */
  locale?: Locale;
}

const toImg = (v: Img | undefined, fallbackAlt: string) => (typeof v === "string" ? { src: v, alt: fallbackAlt } : v);
const clamp = (v: number) => Math.max(0, Math.min(100, v));

export function BeforeAfterSlider({
  stencilImage, resultImage, stencilNode, resultNode,
  aspectRatio = "aspect-square",
  locale = "uk",
  stencilLabel = msg(locale).slider.stencil, resultLabel = msg(locale).slider.result,
  ariaLabel = msg(locale).slider.aria,
  initial = 50, priority, hint = true, followPointer = true, className = "",
}: BeforeAfterProps) {
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const [loadResult, setLoadResult] = useState(!!resultNode);
  const touched = useRef(false);

  const stencil = toImg(stencilImage, msg(locale).slider.stencilAlt);
  const result = toImg(resultImage, msg(locale).slider.resultAlt);

  useEffect(() => {
    if (loadResult) return;
    const t = window.setTimeout(() => setLoadResult(true), 1200);
    return () => window.clearTimeout(t);
  }, [loadResult]);

  // One nudge 50 → 32 → 68 → 50 to show it moves; skipped after any interaction.
  useEffect(() => {
    if (!hint || reduce) return;
    const keys: [number, number][] = [[0, initial], [700, 32], [1500, 68], [2200, initial]];
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
    let raf = 0;
    let start = 0;
    const step = (now: number) => {
      if (touched.current) return;
      if (!start) start = now;
      const t = now - start;
      const i = keys.findIndex(([k]) => k > t);
      if (i <= 0) { setPos(initial); return; }
      const [ta, va] = keys[i - 1];
      const [tb, vb] = keys[i];
      setPos(va + (vb - va) * ease((t - ta) / (tb - ta)));
      raf = requestAnimationFrame(step);
    };
    const d = window.setTimeout(() => (raf = requestAnimationFrame(step)), 1000);
    return () => { window.clearTimeout(d); cancelAnimationFrame(raf); };
  }, [hint, reduce, initial]);

  const interact = () => { touched.current = true; setLoadResult(true); };
  const fromEvent = (e: PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return clamp(((e.clientX - r.left) / r.width) * 100);
  };

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    interact();
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    setPos(fromEvent(e));
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging || (followPointer && e.pointerType === "mouse")) {
      if (!dragging) interact();
      setPos(fromEvent(e));
    }
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step: Record<string, number> = { ArrowLeft: -2, ArrowDown: -2, ArrowRight: 2, ArrowUp: 2, PageDown: -10, PageUp: 10 };
    if (e.key in step) { e.preventDefault(); interact(); setPos((p) => clamp(p + step[e.key])); }
    if (e.key === "Home") { e.preventDefault(); interact(); setPos(0); }
    if (e.key === "End") { e.preventDefault(); interact(); setPos(100); }
  };

  const shown = Math.round(pos);

  return (
    <div
      ref={box}
      role="slider"
      tabIndex={0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={shown}
      aria-valuetext={`${stencilLabel} ${shown} %, ${resultLabel} ${100 - shown} %`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
      className={`relative cursor-ew-resize select-none overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface)] outline-none focus-visible:ring-4 focus-visible:ring-[var(--buy)] focus-visible:ring-offset-2 ${aspectRatio} ${className}`}
      style={{ touchAction: "pan-y" }}
    >
      {/* Result, full width underneath (right side) */}
      <div className="absolute inset-0">
        {loadResult && (resultNode ?? (result && <Image src={result.src} alt={result.alt} fill sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" draggable={false} />))}
      </div>

      {/* Stencil on top, clipped. clip-path keeps the image at full size: in the draft the
          image was inside a narrowing box and got squeezed while dragging. */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {stencilNode ?? (stencil && <Image src={stencil.src} alt={stencil.alt} fill priority={priority} sizes="(min-width: 1024px) 640px, 100vw" className="object-cover" draggable={false} />)}
      </div>

      <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0f1d33] shadow-sm">{stencilLabel}</span>
      <span className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#0f1d33] shadow-sm">{resultLabel}</span>

      {/* Divider and handle: white with a soft shadow on the light theme, safety yellow in B2B (--cut) */}
      <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-[var(--cut)] shadow-[0_0_0_1px_rgba(255,255,255,.8)]" style={{ left: `${pos}%` }}>
        <div className={`absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-[var(--cut)] bg-white text-[#0f1d33] shadow-lg transition-transform ${dragging ? "scale-110" : ""}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><path d="m9 6-6 6 6 6M15 6l6 6-6 6" /></svg>
        </div>
      </div>
    </div>
  );
}
