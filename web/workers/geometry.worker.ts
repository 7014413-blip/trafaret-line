// Web Worker for the heavy Clipper2 work (bridges, thin zones, welding, canvas analysis), so typing
// in the constructor never freezes the page. Messages: GeometryRequest → GeometryResponse.

import { buildStencilCut } from "../lib/geometry/bridges";
import { analyzeCanvas } from "../lib/geometry/canvas-analysis";
import { weldAtWidth } from "../lib/geometry/weld-sizing";
import type { GeometryRequest, GeometryResponse } from "../types/geometry-worker";

const scope = self as unknown as {
  onmessage: ((event: MessageEvent<GeometryRequest>) => void) | null;
  postMessage: (message: GeometryResponse) => void;
};

scope.onmessage = (event) => {
  const request = event.data;
  try {
    if (request.type === "stencil") {
      scope.postMessage({ id: request.id, type: "stencil", cut: buildStencilCut(request.groups, request.options) });
    } else if (request.type === "weld") {
      scope.postMessage({ id: request.id, type: "weld", weld: weldAtWidth(request.glyphs, request.capUnits, request.widthMm, request.align, request.options) });
    } else {
      scope.postMessage({ id: request.id, type: "canvas", analysis: analyzeCanvas(request.elements, request.settings) });
    }
  } catch (error) {
    scope.postMessage({ id: request.id, type: "error", message: (error as Error).message });
  }
};
