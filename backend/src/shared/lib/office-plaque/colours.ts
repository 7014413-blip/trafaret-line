// Colours of the office plaque: base acrylic and mirror plates. Hex values are swatch tones
// for the preview; satin silver is brushed (matte) mirror.

import type { PlaqueBaseColour, PlaquePlateColour } from "../../types/office-plaque";

export const PLAQUE_BASE_COLOURS: PlaqueBaseColour[] = [
  { id: "black", name: { uk: "Чорна", ru: "Чёрная", en: "Black" }, hex: "#111214" },
  { id: "white", name: { uk: "Біла", ru: "Белая", en: "White" }, hex: "#f4f4f1" },
];

export const PLAQUE_PLATE_COLOURS: PlaquePlateColour[] = [
  { id: "gold", name: { uk: "Золото", ru: "Золото", en: "Gold" }, hex: "#d4af37", highlight: "#fbf3c8", satin: false, engraveHex: "#1a1a1a" },
  { id: "silver", name: { uk: "Срібло", ru: "Серебро", en: "Silver" }, hex: "#c9ccd0", highlight: "#f8fafc", satin: false, engraveHex: "#1a1a1a" },
  { id: "bronze-gold", name: { uk: "Бронзове золото", ru: "Бронзовое золото", en: "Bronze gold" }, hex: "#b08d57", highlight: "#ead8b4", satin: false, engraveHex: "#1a1a1a" },
  { id: "satin-silver", name: { uk: "Сатин срібло", ru: "Сатин серебро", en: "Satin silver" }, hex: "#b9bdc2", highlight: "#dfe2e6", satin: true, engraveHex: "#1f2328" },
];

export function findPlaqueBase(id: string): PlaqueBaseColour {
  const colour = PLAQUE_BASE_COLOURS.find((c) => c.id === id);
  if (!colour) throw new Error(`Unknown plaque base colour: ${id}`);
  return colour;
}

export function findPlaquePlate(id: string): PlaquePlateColour {
  const colour = PLAQUE_PLATE_COLOURS.find((c) => c.id === id);
  if (!colour) throw new Error(`Unknown plaque plate colour: ${id}`);
  return colour;
}
