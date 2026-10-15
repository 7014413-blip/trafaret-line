// Settings of the two-layer plaques (admin). Prices of floor and number plaques are Денис's
// (2026-10-10). [default] Claude 2026-10-10: door sign sizes and prices (the office plaque
// rate, 220 UAH per 126 cm², at least 220 UAH) until Денис confirms them; custom sizes of
// floor and number plaques follow his prices by area; frames, corners and offsets as on his photos.

import type { LayeredPlaqueConfig, LayeredPlaqueKind } from "../../types/layered-plaque";

const t = (uk: string, ru: string, en: string) => ({ uk, ru, en });

export const FLOOR_PLAQUE_CONFIG: LayeredPlaqueConfig = {
  kind: "floor",
  title: t("Табличка поверху", "Табличка этажа", "Floor sign"),
  presets: [
    { code: "13x18", widthMm: 130, heightMm: 180, price: 360 },   // Денис
    { code: "15x20", widthMm: 150, heightMm: 200, price: 480 },   // Денис
    { code: "25x20", widthMm: 250, heightMm: 200, price: 850 },   // Денис
  ],
  customRatePerCm2: null,
  minPrice: 360,
  roundTo: 10,
  minWidthMm: 100, maxWidthMm: 500, minHeightMm: 100, maxHeightMm: 600,
  cornerShare: 0,
  frameInsetShare: 0.05, frameWidthShare: 0.012, frameMinWidthMm: 2,
  backOffsetShare: 0,
  maxLines: 3, maxLineChars: 30,
  seriesLine: 1, maxSeries: 100,
  minLetterMm: 10,
  defaultLines: [
    { text: "ПОВЕРХ", fontId: "montserrat", size: 0.7 },
    { text: "1", fontId: "montserrat", size: 1.6 },
  ],
  defaultBaseId: "black", defaultOverlayId: "mirror-gold", defaultFrame: true,
  baseIds: ["black", "white"],
  overlayIds: ["mirror-gold", "mirror-silver"],
};

export const DOOR_PLAQUE_CONFIG: LayeredPlaqueConfig = {
  kind: "door",
  title: t("Табличка на двері", "Табличка на дверь", "Door sign"),
  presets: [
    { code: "25x8", widthMm: 250, heightMm: 80, price: 350 },     // [default]
    { code: "30x10", widthMm: 300, heightMm: 100, price: 530 },   // [default]
    { code: "35x12", widthMm: 350, heightMm: 120, price: 740 },   // [default]
  ],
  customRatePerCm2: 220 / 126,                                    // [default] office plaque rate
  minPrice: 220,
  roundTo: 10,
  minWidthMm: 150, maxWidthMm: 800, minHeightMm: 50, maxHeightMm: 300,
  cornerShare: 0.16,
  frameInsetShare: 0.06, frameWidthShare: 0.025, frameMinWidthMm: 2,
  backOffsetShare: 0,
  maxLines: 3, maxLineChars: 40,
  seriesLine: null, maxSeries: 1,
  minLetterMm: 8,
  defaultLines: [{ text: "Косметологія", fontId: "montserrat", size: 1 }],
  defaultBaseId: "black", defaultOverlayId: "mirror-gold", defaultFrame: true,
  baseIds: ["black", "white", "cream", "sage"],
  overlayIds: ["mirror-gold", "mirror-silver", "white"],
};

export const NUMBER_PLAQUE_CONFIG: LayeredPlaqueConfig = {
  kind: "number",
  title: t("Номерок", "Номерок", "Number plaque"),
  presets: [
    { code: "8x8", widthMm: 80, heightMm: 80, price: 65 },        // Денис
    { code: "10x10", widthMm: 100, heightMm: 100, price: 110 },   // Денис
    { code: "15x15", widthMm: 150, heightMm: 150, price: 160 },   // Денис
  ],
  customRatePerCm2: null,
  minPrice: 65,
  roundTo: 5,
  minWidthMm: 60, maxWidthMm: 300, minHeightMm: 60, maxHeightMm: 300,
  cornerShare: 0.14,
  frameInsetShare: 0, frameWidthShare: 0, frameMinWidthMm: 0,
  backOffsetShare: 0.07,
  maxLines: 2, maxLineChars: 12,
  seriesLine: 0, maxSeries: 300,
  minLetterMm: 10,
  defaultLines: [{ text: "100", fontId: "rubik", size: 1 }],
  defaultBaseId: "white", defaultOverlayId: "black", defaultFrame: false,
  baseIds: ["white", "black"],
  overlayIds: ["black", "white"],
};

export const LAYERED_PLAQUE_CONFIGS: Record<LayeredPlaqueKind, LayeredPlaqueConfig> = {
  floor: FLOOR_PLAQUE_CONFIG,
  door: DOOR_PLAQUE_CONFIG,
  number: NUMBER_PLAQUE_CONFIG,
};
