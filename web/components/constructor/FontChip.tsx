"use client";

// Font button that shows the customer's own text in that font.

import { useEffect, useState } from "react";
import { loadFont, type FontEntry } from "@/lib/text/font-loader";
import { textToDesign, type TextDesignResult } from "@/lib/text/text-layout";
import { useInView } from "@/lib/client/use-in-view";

export function FontChip({ entry, text, active, onPick }: { entry: FontEntry; text: string; active: boolean; onPick: () => void }) {
  const [result, setResult] = useState<TextDesignResult | null>(null);
  // The font file is downloaded only when its chip scrolls into view (QA m13).
  const [ref, visible] = useInView<HTMLButtonElement>();

  useEffect(() => {
    if (!visible && !active) return;
    let live = true;
    loadFont(entry)
      .then((font) => {
        if (live) setResult(textToDesign(font, text.split("\n")[0] || "Напис", { align: "center" }));
      })
      .catch(() => {
        if (live) setResult(null);
      });
    return () => {
      live = false;
    };
  }, [entry, text, visible, active]);

  const viewBox = result ? `-4 -4 ${result.design.bboxMm.w + 8} ${result.design.bboxMm.h + 8}` : "0 0 100 40";
  return (
    <button ref={ref} type="button" aria-pressed={active} onClick={onPick} title={entry.name}
      className={`flex h-16 w-40 flex-none flex-col items-center justify-center gap-1 rounded-xl border-[1.5px] px-2 ${active ? "border-[var(--ink)] bg-[var(--surface)]" : "border-[var(--line)] bg-[var(--card)]"}`}>
      <svg viewBox={viewBox} className="h-8 w-full" aria-hidden>{result && <path d={result.pathData} fill="currentColor" />}</svg>
      <span className="text-[11px] text-[var(--muted)]">{entry.name}</span>
    </button>
  );
}
