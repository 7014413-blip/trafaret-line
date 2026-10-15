"use client";

// Size of a plaque constructor: one of the fixed sizes or the customer's own size, clamped to
// the constructor's limits. A size code in the link (?size=21x6, from a product page) opens the
// constructor with that size.

import { useEffect, useMemo, useState } from "react";
import { readPlaqueSizeParam } from "./plaque-size-param";
import type { CustomSizeCm, PresetSizeState, SizePresetOption } from "../../types/constructor-ui";

export function usePresetSize(
  presets: SizePresetOption[],
  startCustomCm: CustomSizeCm,
  clamp: (widthMm: number, heightMm: number) => { widthMm: number; heightMm: number },
): PresetSizeState {
  const [sizeCode, setSizeCode] = useState(presets[0].code);
  const [customCm, setCustomCm] = useState<CustomSizeCm>(startCustomCm);

  useEffect(() => {
    const fromLink = readPlaqueSizeParam(presets.map((p) => p.code));
    if (fromLink) setSizeCode(fromLink);
  }, [presets]);

  const size = useMemo(() => {
    const preset = presets.find((p) => p.code === sizeCode);
    if (preset) return { widthMm: preset.widthMm, heightMm: preset.heightMm };
    return clamp(customCm.w * 10, customCm.h * 10);
  }, [presets, sizeCode, customCm, clamp]);

  return { sizeCode, setSizeCode, customCm, setCustomCm, size };
}
