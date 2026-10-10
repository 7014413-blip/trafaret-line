"use client";

// Text lines of the plaque constructors: text, font (shop fonts and the customer's own) and
// letter size of every line, add / remove lines, upload a font. State: lib/client/use-plaque-lines.ts.

import { CustomFontPanel } from "@/components/constructor/CustomFontPanel";
import type { PlaqueLinesState } from "@/lib/client/use-plaque-lines";

const SIZE_STEPS: [number, string][] = [[0.8, "Малий"], [1, "Середній"], [1.3, "Великий"], [1.6, "Найбільший"]];
const input = "h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

export function PlaqueLinesEditor({ state, legend, idPrefix, maxChars, capByLine, onRemove }: {
  state: PlaqueLinesState;
  legend: string;
  idPrefix: string;
  maxChars: number;
  /** Cap height of every placed line, mm, by line index. */
  capByLine: Map<number, number>;
  onRemove?: (index: number) => void;
}) {
  const { lines, setLine, addLine, removeLine, maxLines, allFonts, customFonts, onFontAdded, onFontRemoved } = state;
  const fontOptions = (value: string) => allFonts.length
    ? allFonts.map((f) => <option key={f.id} value={f.id}>{f.custom ? `Ваш: ${f.name}` : f.name}</option>)
    : <option value={value}>Шрифти завантажуються…</option>;

  return (
    <fieldset className="grid min-w-0 grid-cols-[minmax(0,1fr)] gap-3">
      <legend className="mb-1 text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{legend}</legend>
      {lines.map((line, i) => {
        const cap = capByLine.get(i);
        return (
          <div key={i} className="grid grid-cols-[minmax(0,1fr)] gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
            <div className="flex items-center gap-2">
              <input id={`${idPrefix}-line-${i}`} aria-label={`Рядок ${i + 1}`} value={line.text} maxLength={maxChars} placeholder={`Рядок ${i + 1}`}
                onChange={(e) => setLine(i, { text: e.target.value })} className={`${input} h-12 min-w-0 flex-1 text-lg`} />
              {lines.length > 1 && (
                <button type="button" aria-label={`Прибрати рядок ${i + 1}`} onClick={() => { removeLine(i); onRemove?.(i); }}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-[var(--line)] text-xl">×</button>
              )}
            </div>
            <div className="grid grid-cols-[minmax(0,1fr)] gap-2 sm:grid-cols-2">
              <label className="grid gap-1 text-sm text-[var(--muted)]">Шрифт
                <select id={`${idPrefix}-font-${i}`} value={line.fontId} onChange={(e) => setLine(i, { fontId: e.target.value })} className={`${input} w-full min-w-0`}>{fontOptions(line.fontId)}</select>
              </label>
              <label className="grid gap-1 text-sm text-[var(--muted)]">Розмір літер
                <select id={`${idPrefix}-lsize-${i}`} value={line.size} onChange={(e) => setLine(i, { size: Number(e.target.value) })} className={`${input} w-full min-w-0`}>
                  {SIZE_STEPS.map(([v, name]) => <option key={v} value={v}>{name}</option>)}
                </select>
              </label>
            </div>
            {cap != null && <span className="text-[13px] text-[var(--muted)] tabular-nums">Висота великих літер ≈ {cm(cap)} см</span>}
          </div>
        );
      })}
      {lines.length < maxLines && (
        <button id={`${idPrefix}-add-line`} type="button" onClick={addLine} className="h-11 justify-self-start rounded-full border-[1.5px] border-dashed border-[var(--line)] px-4 text-sm font-semibold">+ Додати рядок</button>
      )}
      <CustomFontPanel fonts={customFonts} text={lines.map((l) => l.text).join(" ")} onAdded={onFontAdded} onRemoved={onFontRemoved} />
    </fieldset>
  );
}
