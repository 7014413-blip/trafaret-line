// Shape chosen on a product page (?shape=arrow), so the pointer sign constructor opens with
// the classic arrow. Only known shapes are accepted.

import type { PointerShape } from "../../types/pointer-sign";

export function readPointerShapeParam(): PointerShape | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("shape");
  return value === "arrow" || value === "pointer" ? value : null;
}
