"use client";

// Page side of workers/geometry.worker.ts: one shared worker, promise per request.
// Callers keep only the newest answer (see the `latest` guard in the components).

import type { CanvasAnalysis, CanvasElement, CanvasSettings } from "../../types/canvas";
import type { PlacedGlyph, Polygon, StencilCutOptions, StencilCutResult, TextAlign, WeldOptions } from "../../types/geometry";
import type { GeometryRequest, GeometryResponse, SizedWeld } from "../../types/geometry-worker";

type Pending = { resolve: (r: GeometryResponse) => void; reject: (e: Error) => void };

let worker: Worker | null = null;
let nextId = 1;
const pending = new Map<number, Pending>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL("../../workers/geometry.worker.ts", import.meta.url));
  worker.onmessage = (event: MessageEvent<GeometryResponse>) => {
    const job = pending.get(event.data.id);
    if (!job) return;
    pending.delete(event.data.id);
    if (event.data.type === "error") job.reject(new Error(event.data.message));
    else job.resolve(event.data);
  };
  worker.onerror = (event) => {
    for (const job of pending.values()) job.reject(new Error(event.message || "geometry worker failed"));
    pending.clear();
    worker?.terminate();
    worker = null;
  };
  return worker;
}

function send(request: GeometryRequest): Promise<GeometryResponse> {
  return new Promise((resolve, reject) => {
    pending.set(request.id, { resolve, reject });
    getWorker().postMessage(request);
  });
}

export async function computeStencilCut(groups: Polygon[][], options: StencilCutOptions): Promise<StencilCutResult> {
  const response = await send({ id: nextId++, type: "stencil", groups, options });
  if (response.type !== "stencil") throw new Error("unexpected answer");
  return response.cut;
}

export async function computeCanvasAnalysis(elements: CanvasElement[], settings: CanvasSettings): Promise<CanvasAnalysis> {
  const response = await send({ id: nextId++, type: "canvas", elements, settings });
  if (response.type !== "canvas") throw new Error("unexpected answer");
  return response.analysis;
}

export async function computeWeld(glyphs: PlacedGlyph[], capUnits: number, widthMm: number, align: TextAlign, options: WeldOptions): Promise<SizedWeld | null> {
  const response = await send({ id: nextId++, type: "weld", glyphs, capUnits, widthMm, align, options });
  if (response.type !== "weld") throw new Error("unexpected answer");
  return response.weld;
}