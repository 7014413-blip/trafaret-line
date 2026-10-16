// The constructor's picture of an order line (the cart thumbnail), sent with the order so the
// workshop gets a PNG preview of lines the server does not rebuild (signs, plaques, letters).
// Only a plain SVG of limited size is kept; the server draws it without scripts or links.

export const MAX_PREVIEW_SVG_CHARS = 100_000;

export function previewSvgOf(value: unknown): string | null {
  if (typeof value !== "string" || value.length > MAX_PREVIEW_SVG_CHARS) return null;
  return /^<svg[\s>]/.test(value.trimStart()) ? value : null;
}
