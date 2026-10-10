// Size chosen on the product page (/p/…?size=30x12 → constructor ?size=30x12), so the
// constructor opens with the same size. Unknown values are ignored.

export function readPointerSizeParam(codes: string[]): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("size");
  return value && codes.includes(value) ? value : null;
}
