"use client";

// Text lines of the plaque constructors (pointer signs, office plaques): the lines, the shop
// fonts and the customer's own fonts, loading every font a line uses and measuring each line
// in its own font (lib/plaques/measure-line.ts).

import { useCallback, useEffect, useMemo, useState } from "react";
import { listCustomFonts } from "./custom-fonts";
import { measurePlaqueLine, type MeasuredPlaqueLine } from "../plaques/measure-line";
import { fontEntry } from "../text/font-entry";
import { loadFont, loadFontManifest, registerLoadedFont } from "../text/font-loader";
import type { PlaqueTextLine } from "../../types/plaques";
import type { FontEntry, LoadedFont } from "../../types/text";

/** Font a line falls back to when its font is removed. */
const FALLBACK_FONT = "montserrat";

export interface PlaqueLinesState {
  lines: PlaqueTextLine[];
  setLine: (index: number, patch: Partial<PlaqueTextLine>) => void;
  /** Replaces every line at once (a layout opened from a link). */
  replaceLines: (lines: PlaqueTextLine[]) => void;
  addLine: () => void;
  removeLine: (index: number) => void;
  maxLines: number;
  allFonts: FontEntry[];
  customFonts: LoadedFont[];
  /** The shop fonts and the customer's fonts are both listed (a font id missing from them is unknown here). */
  fontsListed: boolean;
  onFontAdded: (font: LoadedFont) => void;
  onFontRemoved: (id: string) => void;
  measured: (MeasuredPlaqueLine | null)[];
  /** Every line with text has its font loaded. */
  fontsReady: boolean;
  /** A loaded font by id (to measure other texts in a line's font). */
  fontFor: (id: string) => LoadedFont | undefined;
}

export function usePlaqueLines(initial: PlaqueTextLine[], maxLines: number): PlaqueLinesState {
  const [lines, setLines] = useState<PlaqueTextLine[]>(initial);
  const [shopFonts, setShopFonts] = useState<FontEntry[]>([]);
  const [customFonts, setCustomFonts] = useState<LoadedFont[]>([]);
  const [loaded, setLoaded] = useState<Record<string, LoadedFont>>({});
  const [shopListed, setShopListed] = useState(false);
  const [customListed, setCustomListed] = useState(false);

  useEffect(() => {
    loadFontManifest().then(setShopFonts).catch(() => setShopFonts([])).finally(() => setShopListed(true));
    listCustomFonts().then((list) => { list.forEach(registerLoadedFont); setCustomFonts(list); }).catch(() => setCustomFonts([])).finally(() => setCustomListed(true));
  }, []);
  const fontsListed = shopListed && customListed;

  // A line whose font is not on this device (the customer's own font in a link opened elsewhere)
  // gets the fallback font, so the line is measured and the layout can be bought.
  useEffect(() => {
    if (!fontsListed || !shopFonts.length) return;
    const known = (id: string) => shopFonts.some((f) => f.id === id) || customFonts.some((f) => f.id === id);
    if (lines.every((l) => known(l.fontId))) return;
    setLines((list) => list.map((l) => (known(l.fontId) ? l : { ...l, fontId: FALLBACK_FONT })));
  }, [fontsListed, shopFonts, customFonts, lines]);

  // Load every font a line uses (each line may have its own).
  useEffect(() => {
    for (const id of new Set(lines.map((l) => l.fontId))) {
      if (loaded[id]) continue;
      const custom = customFonts.find((f) => f.id === id);
      if (custom) { setLoaded((map) => ({ ...map, [id]: custom })); continue; }
      const entry = shopFonts.find((f) => f.id === id);
      if (entry) loadFont(entry).then((font) => setLoaded((map) => ({ ...map, [id]: font }))).catch(() => undefined);
    }
  }, [lines, shopFonts, customFonts, loaded]);

  const allFonts = useMemo<FontEntry[]>(
    () => [...shopFonts, ...customFonts.map(fontEntry)],
    [shopFonts, customFonts],
  );
  const measured = useMemo(
    () => lines.map((line) => { const font = loaded[line.fontId]; return font ? measurePlaqueLine(font, line.text) : null; }),
    [lines, loaded],
  );

  const fontFor = useCallback((id: string) => loaded[id], [loaded]);
  // Stable, so constructors can call it from effects.
  const setLine = useCallback((index: number, patch: Partial<PlaqueTextLine>) => {
    setLines((list) => list.map((l, k) => (k === index ? { ...l, ...patch } : l)));
  }, []);

  const replaceLines = useCallback((next: PlaqueTextLine[]) => {
    if (next.length) setLines(next.slice(0, maxLines));
  }, [maxLines]);

  return {
    lines,
    setLine,
    replaceLines,
    addLine: () => setLines((list) => (list.length >= maxLines ? list : [...list, { text: "", fontId: list[list.length - 1]?.fontId ?? FALLBACK_FONT, size: 0.8 }])),
    removeLine: (index) => setLines((list) => (list.length > 1 ? list.filter((_, k) => k !== index) : list)),
    maxLines,
    allFonts,
    customFonts,
    fontsListed,
    onFontAdded: (font) => { registerLoadedFont(font); setCustomFonts((list) => [...list.filter((f) => f.id !== font.id), font]); },
    onFontRemoved: (id) => {
      setCustomFonts((list) => list.filter((f) => f.id !== id));
      setLines((list) => list.map((l) => (l.fontId === id ? { ...l, fontId: FALLBACK_FONT } : l)));
      setLoaded((map) => { const next = { ...map }; delete next[id]; return next; });
    },
    measured,
    fontsReady: lines.every((l) => !l.text.trim() || !!loaded[l.fontId]),
    fontFor,
  };
}
