"use client";

// First-screen animation: a PET stencil on a wall is sprayed, then lifted off to
// reveal the pattern. Stands in for the production video until it is filmed.
// Shows the finished state first and starts moving only when the page is idle after load,
// so the animation never delays the first screen; pauses when hidden or scrolled away,
// and stays on the finished state for prefers-reduced-motion. The wall, the sheet and its
// shadow are drawn once per size, so a frame only sprays and copies a few layers and stays
// short on slow phones.

import { useEffect, useRef } from "react";

const PAINTS = ["#0f172a", "#9a3412", "#14532d", "#334155"];
const SPRAY = 3.6;
const LIFT = 1.1;
const HOLD = 2.6;

type Geo = { R: number; cx: number; cy: number; sx: number; sy: number; sw: number };

function drawPattern(g: CanvasRenderingContext2D, cx: number, cy: number, R: number) {
  g.beginPath();
  for (let ring = 0; ring < 5; ring++) {
    const n = 8 + ring * 4;
    const rr = R * (0.16 + ring * 0.17);
    const s = R * (0.055 + ring * 0.012);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + (ring % 2 ? Math.PI / n : 0);
      g.save();
      g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
      g.rotate(a);
      g.moveTo(s * 1.7, 0);
      g.ellipse(0, 0, s * 1.7, s * 0.62, 0, 0, Math.PI * 2);
      g.restore();
    }
  }
  g.moveTo(cx + R * 0.08, cy);
  g.arc(cx, cy, R * 0.08, 0, Math.PI * 2);
  g.fill();
}

export function StencilSprayHero({ className, label }: { className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(1.5, window.devicePixelRatio || 1);
    let W = 0, H = 0, raf = 0, t0 = performance.now(), ci = 0;
    let geo: Geo;
    let mask: HTMLCanvasElement, paint: HTMLCanvasElement, sheet: HTMLCanvasElement, shadow: HTMLCanvasElement, layer: HTMLCanvasElement, bg: HTMLCanvasElement;
    let idle = false, visible = true, inView = true;

    const make = () => Object.assign(document.createElement("canvas"), { width: W, height: H });

    const setup = () => {
      const r = cv.getBoundingClientRect();
      W = Math.round(r.width * dpr);
      H = Math.round(r.height * dpr);
      cv.width = W;
      cv.height = H;
      const R = Math.min(W, H) * 0.42, cx = W / 2, cy = H / 2;
      geo = { R, cx, cy, sx: cx - R * 1.12, sy: cy - R * 1.12, sw: R * 2.24 };
      mask = make();
      const m = mask.getContext("2d")!;
      m.fillStyle = "#000";
      drawPattern(m, cx, cy, R);
      sheet = make();
      const s = sheet.getContext("2d")!;
      s.fillStyle = "rgba(214,236,242,.78)";
      s.fillRect(geo.sx, geo.sy, geo.sw, geo.sw);
      s.strokeStyle = "rgba(120,160,175,.9)";
      s.lineWidth = 2 * dpr;
      s.strokeRect(geo.sx, geo.sy, geo.sw, geo.sw);
      s.globalCompositeOperation = "destination-out";
      s.drawImage(mask, 0, 0);
      shadow = make();
      const sh = shadow.getContext("2d")!;
      sh.shadowColor = "rgba(15,23,42,.2)";
      sh.shadowBlur = 24 * dpr;
      sh.shadowOffsetY = 10 * dpr;
      sh.drawImage(sheet, 0, 0);
      paint = make();
      layer = make();
      bg = make();
      const b = bg.getContext("2d")!;
      const g = b.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "#f4f1ec");
      g.addColorStop(1, "#e9e4dc");
      b.fillStyle = g;
      b.fillRect(0, 0, W, H);
    };

    const wall = () => ctx.drawImage(bg, 0, 0);

    const sprayAt = (x: number, y: number, col: string) => {
      const p = paint.getContext("2d")!;
      const rr = geo.R * 0.34;
      const gr = p.createRadialGradient(x, y, 0, x, y, rr);
      gr.addColorStop(0, col);
      gr.addColorStop(0.55, col);
      gr.addColorStop(1, "rgba(0,0,0,0)");
      p.globalAlpha = 0.22;
      p.fillStyle = gr;
      p.beginPath();
      p.arc(x, y, rr, 0, Math.PI * 2);
      p.fill();
      p.fillStyle = col;
      for (let i = 0; i < 40; i++) {
        const a = Math.random() * Math.PI * 2, r = Math.pow(Math.random(), 0.6) * geo.R * 0.32;
        p.globalAlpha = 0.25;
        p.beginPath();
        p.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, (1 + Math.random() * 2.2) * dpr, 0, Math.PI * 2);
        p.fill();
      }
      p.globalAlpha = 1;
    };

    const painted = () => {
      const g = layer.getContext("2d")!;
      g.globalCompositeOperation = "source-over";
      g.clearRect(0, 0, W, H);
      g.drawImage(paint, 0, 0);
      g.globalCompositeOperation = "destination-in";
      g.drawImage(mask, 0, 0);
      return layer;
    };

    const drawSheet = (alpha: number, lift: number) => {
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(0, -lift * H * 0.25);
      ctx.rotate(-lift * 0.04);
      ctx.drawImage(shadow, 0, 0);
      ctx.globalAlpha = alpha * 0.35;
      ctx.beginPath();
      ctx.rect(geo.sx, geo.sy, geo.sw, geo.sw);
      ctx.clip();
      ctx.drawImage(paint, 0, 0);
      ctx.restore();
    };

    const frame = (now: number) => {
      const col = PAINTS[ci % PAINTS.length];
      const t = (now - t0) / 1000;
      wall();
      if (t < SPRAY) {
        const k = t / SPRAY, rows = 5, row = Math.floor(k * rows), f = (k * rows) % 1;
        const x = geo.cx + (row % 2 ? 1 - 2 * f : -1 + 2 * f) * geo.R * 1.05;
        const y = geo.cy - geo.R * 0.95 + row * ((geo.R * 1.9) / (rows - 1));
        sprayAt(x, y, col);
        ctx.drawImage(painted(), 0, 0);
        drawSheet(1, 0);
      } else if (t < SPRAY + LIFT) {
        const k = (t - SPRAY) / LIFT, e = k * k * (3 - 2 * k);
        ctx.drawImage(painted(), 0, 0);
        drawSheet(1 - e, e);
      } else if (t < SPRAY + LIFT + HOLD) {
        ctx.drawImage(painted(), 0, 0);
      } else {
        ci++;
        t0 = now;
        paint.getContext("2d")!.clearRect(0, 0, W, H);
      }
      raf = requestAnimationFrame(frame);
    };

    const still = () => {
      const p = paint.getContext("2d")!;
      p.fillStyle = PAINTS[0];
      p.fillRect(0, 0, W, H);
      wall();
      ctx.drawImage(painted(), 0, 0);
    };

    const start = () => {
      cancelAnimationFrame(raf);
      setup();
      t0 = performance.now();
      if (reduce || !idle || !visible || !inView) still();
      else raf = requestAnimationFrame(frame);
    };

    const onIdle = () => {
      idle = true;
      start();
    };
    let idleHandle = 0;
    const scheduleIdle = () => {
      if ("requestIdleCallback" in window) idleHandle = window.requestIdleCallback(onIdle, { timeout: 4000 });
      else idleHandle = globalThis.setTimeout(onIdle, 1500) as unknown as number;
    };
    const cancelIdle = () => {
      if ("cancelIdleCallback" in window) window.cancelIdleCallback(idleHandle);
      else globalThis.clearTimeout(idleHandle);
    };
    const onLoad = () => scheduleIdle();

    start();
    if (!reduce) {
      if (document.readyState === "complete") scheduleIdle();
      else window.addEventListener("load", onLoad, { once: true });
    }
    const ro = new ResizeObserver(() => start());
    ro.observe(cv);
    const io = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView) start();
      else cancelAnimationFrame(raf);
    });
    io.observe(cv);
    const onVis = () => {
      visible = !document.hidden;
      if (visible) start();
      else cancelAnimationFrame(raf);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancelAnimationFrame(raf);
      cancelIdle();
      window.removeEventListener("load", onLoad);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return <canvas ref={ref} className={className} role="img" aria-label={label} />;
}
