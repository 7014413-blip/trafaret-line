// Background of a colour swatch: mirror sheets get a light diagonal gradient, others the plain colour.

export function swatchBackground(hex: string, mirror: boolean): string {
  return mirror ? `linear-gradient(135deg, #f8fafc, ${hex} 45%, #f8fafc 60%, ${hex})` : hex;
}
