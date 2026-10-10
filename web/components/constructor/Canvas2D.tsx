"use client";

// Free canvas on Fabric.js 7: the stencil sheet with a millimetre grid, the safe margin,
// the live cut (bridges are real gaps from lib/geometry/bridges.ts) and markers of every
// problem from lib/geometry/canvas-analysis.ts. Elements are moved, scaled (uniformly)
// and rotated with the mouse or a finger; the parent keeps the state and re-runs the
// analysis after each change, the canvas only draws and reports transforms.
//
// Coordinates: the state is in mm, Fabric works in px; k = px per mm. Element objects use
// Fabric's centre origin, so the stored top-left (x, y) is converted through the centre.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Canvas as FabricCanvas, FabricObject } from "fabric";
import type { CanvasAnalysis, CanvasElement, CanvasSettings, CanvasTransform } from "@/types/canvas";
import { MATERIALS } from "@/lib/materials";
import { polygonsToPathData } from "@/lib/geometry/svg-path";

type FabricModule = typeof import("fabric");

export interface Canvas2DProps {
  settings: CanvasSettings;
  elements: CanvasElement[];
  analysis: CanvasAnalysis | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onTransform: (id: string, transform: CanvasTransform) => void;
  className?: string;
}

const COLORS = {
  backdrop: "#1e293b",
  grid: "rgba(15, 23, 42, 0.08)",
  gridMajor: "rgba(15, 23, 42, 0.18)",
  margin: "#2563eb",
  handle: "#0f172a",
  error: "#dc2626",
  warning: "#d97706",
};

/** Snaps a value in mm to the grid. */
export function snapMm(value: number, gridMm: number): number {
  return Math.round(value / gridMm) * gridMm;
}

/** Fabric object of an element → transform in mm. */
function readTransform(obj: FabricObject, element: CanvasElement, k: number): CanvasTransform {
  const scale = (obj.scaleX ?? 1) / k;
  const centre = obj.getCenterPoint();
  const w = element.widthMm * scale;
  const h = element.heightMm * scale;
  return { x: centre.x / k - w / 2, y: centre.y / k - h / 2, scale, angle: ((obj.angle ?? 0) % 360 + 360) % 360 };
}

export function Canvas2D({ settings, elements, analysis, selectedId, onSelect, onTransform, className }: Canvas2DProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const moduleRef = useRef<FabricModule | null>(null);
  const objectsRef = useRef(new Map<string, FabricObject>());
  const drawingRef = useRef(false);
  const selectedRef = useRef(selectedId);
  const [ready, setReady] = useState(false);
  const [widthPx, setWidthPx] = useState(0);

  // Latest props for the Fabric event handlers (registered once).
  const latest = useRef({ settings, elements, onSelect, onTransform, k: 1 });
  const k = widthPx > 0 ? widthPx / settings.sheetWidthMm : 1;
  latest.current = { settings, elements, onSelect, onTransform, k };

  // Container width → canvas size.
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const observer = new ResizeObserver(([entry]) => setWidthPx(Math.floor(entry.contentRect.width)));
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  // Fabric is loaded in the browser only (it touches the DOM on import).
  useEffect(() => {
    let disposed = false;
    const objects = objectsRef.current;
    import("fabric").then((fabric) => {
      if (disposed || !canvasElRef.current) return;
      moduleRef.current = fabric;
      const canvas = new fabric.Canvas(canvasElRef.current, {
        selection: false,
        preserveObjectStacking: true,
        uniformScaling: true,
        backgroundColor: COLORS.backdrop,
      });
      fabricRef.current = canvas;

      const idOf = (obj: FabricObject | undefined) => {
        if (!obj) return null;
        for (const [id, o] of objectsRef.current) if (o === obj) return id;
        return null;
      };

      canvas.on("object:moving", ({ target }) => {
        const { settings: s, elements: list, k: px } = latest.current;
        const id = idOf(target);
        const element = list.find((e) => e.id === id);
        if (!element || !s.snapToGrid) return;
        const t = readTransform(target, element, px);
        const x = snapMm(t.x, s.gridMm);
        const y = snapMm(t.y, s.gridMm);
        const w = element.widthMm * t.scale;
        const h = element.heightMm * t.scale;
        target.setPositionByOrigin(new fabric.Point((x + w / 2) * px, (y + h / 2) * px), "center", "center");
      });
      canvas.on("object:modified", ({ target }) => {
        const { elements: list, k: px, onTransform: report } = latest.current;
        const id = idOf(target);
        const element = list.find((e) => e.id === id);
        if (element && target) report(element.id, readTransform(target, element, px));
      });
      // Selection changes made by draw() itself are not user actions.
      canvas.on("selection:created", ({ selected }) => { if (!drawingRef.current) latest.current.onSelect(idOf(selected?.[0])); });
      canvas.on("selection:updated", ({ selected }) => { if (!drawingRef.current) latest.current.onSelect(idOf(selected?.[0])); });
      canvas.on("selection:cleared", () => { if (!drawingRef.current) latest.current.onSelect(null); });
      setReady(true);
    });
    return () => {
      disposed = true;
      const canvas = fabricRef.current;
      fabricRef.current = null;
      objects.clear();
      if (canvas) void canvas.dispose();
    };
  }, []);

  const draw = useCallback(() => {
    const canvas = fabricRef.current;
    const fabric = moduleRef.current;
    if (!canvas || !fabric || widthPx <= 0) return;
    drawingRef.current = true;
    const heightPx = Math.round(settings.sheetHeightMm * k);
    canvas.setDimensions({ width: widthPx, height: heightPx });
    canvas.discardActiveObject();
    canvas.clear();
    canvas.backgroundColor = COLORS.backdrop;
    objectsRef.current.clear();

    const still = { selectable: false, evented: false, objectCaching: false, originX: "left" as const, originY: "top" as const };
    const material = MATERIALS[settings.materialId];

    // Sheet.
    canvas.add(new fabric.Rect({ ...still, left: 0, top: 0, width: settings.sheetWidthMm * k, height: heightPx, fill: material.look.face, opacity: Math.max(0.75, material.look.opacity) }));

    // Grid: thin line every step, stronger every 5 steps.
    if (settings.showGrid && settings.gridMm > 0 && settings.gridMm * k >= 4) {
      for (let x = settings.gridMm, i = 1; x < settings.sheetWidthMm; x += settings.gridMm, i++) {
        canvas.add(new fabric.Line([x * k, 0, x * k, heightPx], { ...still, stroke: i % 5 === 0 ? COLORS.gridMajor : COLORS.grid, strokeWidth: 1 }));
      }
      for (let y = settings.gridMm, i = 1; y < settings.sheetHeightMm; y += settings.gridMm, i++) {
        canvas.add(new fabric.Line([0, y * k, settings.sheetWidthMm * k, y * k], { ...still, stroke: i % 5 === 0 ? COLORS.gridMajor : COLORS.grid, strokeWidth: 1 }));
      }
    }

    // Safe margin.
    const m = settings.marginMm * k;
    canvas.add(new fabric.Rect({
      ...still, left: m, top: m, width: settings.sheetWidthMm * k - 2 * m, height: heightPx - 2 * m,
      fill: "transparent", stroke: COLORS.margin, strokeWidth: 1, strokeDashArray: [6, 4],
    }));

    // Live cut: what the laser removes (bridges are the gaps).
    if (analysis && analysis.cut.cutPaths.length) {
      const scaled = analysis.cut.cutPaths.map((p) => p.map(([x, y]) => [x * k, y * k] as const));
      canvas.add(new fabric.Path(polygonsToPathData(scaled, 1), { ...still, left: undefined, top: undefined, fill: COLORS.backdrop, fillRule: "nonzero" }));
    }

    // Element handles: transparent outlines that carry the controls.
    for (const element of elements) {
      const d = polygonsToPathData(element.groups.flat(), 2);
      if (!d) continue;
      const obj = new fabric.Path(d, {
        originX: "center",
        originY: "center",
        fill: "rgba(37, 99, 235, 0.04)",
        stroke: element.id === selectedRef.current ? COLORS.margin : "transparent",
        strokeWidth: 1,
        strokeUniform: true,
        objectCaching: false,
        lockScalingFlip: true,
        lockMovementX: element.locked,
        lockMovementY: element.locked,
        lockRotation: element.locked,
        lockScalingX: element.locked,
        lockScalingY: element.locked,
        cornerColor: COLORS.handle,
        borderColor: COLORS.margin,
        cornerSize: 12,
        transparentCorners: false,
        perPixelTargetFind: false,
      });
      obj.setControlsVisibility({ mt: false, mb: false, ml: false, mr: false });
      const scale = element.transform.scale * k;
      obj.set({ scaleX: scale, scaleY: scale, angle: element.transform.angle });
      const cx = (element.transform.x + (element.widthMm * element.transform.scale) / 2) * k;
      const cy = (element.transform.y + (element.heightMm * element.transform.scale) / 2) * k;
      obj.setPositionByOrigin(new fabric.Point(cx, cy), "center", "center");
      obj.setCoords();
      canvas.add(obj);
      objectsRef.current.set(element.id, obj);
    }

    // Problem markers.
    if (analysis) {
      const r = Math.max(6, 3 * k);
      for (const issue of analysis.issues) {
        if (!issue.at) continue;
        canvas.add(new fabric.Circle({
          ...still, originX: "center", originY: "center", left: issue.at[0] * k, top: issue.at[1] * k, radius: r,
          fill: "transparent", stroke: issue.level === "error" ? COLORS.error : COLORS.warning, strokeWidth: 2,
        }));
      }
    }

    const active = selectedRef.current ? objectsRef.current.get(selectedRef.current) : undefined;
    if (active) canvas.setActiveObject(active);
    canvas.requestRenderAll();
    drawingRef.current = false;
  }, [analysis, elements, k, settings, widthPx]);

  useEffect(() => {
    if (ready) draw();
  }, [ready, draw]);

  // Selection changes only restyle the outlines: rebuilding the objects here would cancel
  // the drag that the same mouse press has just started.
  useEffect(() => {
    selectedRef.current = selectedId;
    const canvas = fabricRef.current;
    if (!canvas) return;
    for (const [id, obj] of objectsRef.current) obj.set({ stroke: id === selectedId ? COLORS.margin : "transparent" });
    const target = selectedId ? objectsRef.current.get(selectedId) : undefined;
    if (target && canvas.getActiveObject() !== target) {
      drawingRef.current = true;
      canvas.setActiveObject(target);
      drawingRef.current = false;
    }
    canvas.requestRenderAll();
  }, [selectedId]);

  return (
    <div ref={wrapRef} className={className}>
      <canvas ref={canvasElRef} aria-label={`Полотно трафарету ${Math.round(settings.sheetWidthMm / 10)}×${Math.round(settings.sheetHeightMm / 10)} см`} />
      {!ready && <div className="grid aspect-[3/2] place-items-center text-[var(--muted)]">Завантаження полотна…</div>}
    </div>
  );
}
