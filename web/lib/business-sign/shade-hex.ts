// Lighter or darker version of a sheet colour for the preview: the edge of a plate, the frosted
// gradient. factor < 1 darkens, > 1 lightens; channels stay within 0…255.

export function shadeHex(hex: string, factor: number): string {
  const value = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  const channel = (shift: number) => {
    const c = (value >> shift) & 255;
    const next = factor <= 1 ? c * factor : c + (255 - c) * (factor - 1);
    return Math.max(0, Math.min(255, Math.round(next)));
  };
  return `#${[channel(16), channel(8), channel(0)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}
