"use client";

// «Свій шрифт»: the customer uploads TTF/OTF/WOFF/WOFF2 fonts, confirms the right to use them and
// sees which letters are missing. Uploaded fonts appear among the constructor fonts and go
// to production with the order; nobody else sees them.

import { useId, useRef, useState } from "react";
import type { FontFileCheck, LoadedFont } from "@/types/text";
import { addCustomFont, removeCustomFont } from "@/lib/client/custom-fonts";
import { MAX_CUSTOM_FONTS, unsupportedChars } from "@/lib/text/font-check";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";

const short = (chars: string[]) => (chars.length > 12 ? `${chars.slice(0, 12).join(" ")} … (${chars.length})` : chars.join(" "));

export function CustomFontPanel({ fonts, text, onAdded, onRemoved }: {
  fonts: LoadedFont[];
  text: string;
  onAdded: (font: LoadedFont) => void;
  onRemoved: (id: string) => void;
}) {
  const t = tr(CONSTRUCTOR, useLocale());
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [lastCheck, setLastCheck] = useState<FontFileCheck | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError("");
    const result = await addCustomFont(file, rights);
    setBusy(false);
    setLastCheck(result.check ?? null);
    if (!result.ok) { setError(t.fontErrors[result.error] ?? result.error); return; }
    onAdded(result.font);
  };

  return (
    <details className="rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 py-3">
      <summary className="cursor-pointer font-semibold">{t.customFontSummary}</summary>
      <div className="mt-3 grid gap-2.5 text-sm">
        <label htmlFor={`${id}-rights`} className="flex items-start gap-2">
          <input id={`${id}-rights`} type="checkbox" checked={rights} onChange={(e) => setRights(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ink)]" />
          <span>{t.customFontRights}</span>
        </label>
        <input ref={input} type="file" accept=".ttf,.otf,.woff,.woff2,font/ttf,font/otf,font/woff,font/woff2" hidden onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        {fonts.length >= MAX_CUSTOM_FONTS && <span className="text-[13px] text-[var(--muted)]">{t.customFontLimit(MAX_CUSTOM_FONTS)}</span>}
        <button type="button" disabled={!rights || busy || fonts.length >= MAX_CUSTOM_FONTS} onClick={() => input.current?.click()}
          className="h-11 justify-self-start rounded-full px-5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)] disabled:opacity-50">
          {busy ? t.customFontChecking : t.customFontUpload}
        </button>
        {!rights && <span className="text-[13px] text-[var(--muted)]">{t.customFontNeedRights}</span>}
        {error && <p role="alert" className="m-0 text-[var(--danger)]">{error}</p>}
        {lastCheck?.ok && (
          <div role="status" className="grid gap-1 rounded-lg bg-[var(--surface)] p-2.5">
            <span>
              «{lastCheck.familyName}»: {t.cyrillic} {lastCheck.missingCyrillic.length ? "✗" : "✓"} · {t.latin} {lastCheck.missingLatin.length ? "✗" : "✓"} · {t.digits} {lastCheck.missingDigits.length ? "✗" : "✓"}
            </span>
            {[
              [t.ukrainianLetters, lastCheck.missingCyrillic], [t.latinLetters, lastCheck.missingLatin], [t.digits, lastCheck.missingDigits],
              [t.russianLetters, lastCheck.missingRussian], [t.signs, lastCheck.missingSigns],
            ].filter(([, list]) => (list as string[]).length > 0).map(([label, list]) => (
              <span key={label as string} className="text-[13px]">{t.missingGroup(label as string, short(list as string[]))}</span>
            ))}
            {lastCheck.embeddingRestricted && (
              <span className="text-[13px] text-[var(--danger)]">{t.embeddingRestricted}</span>
            )}
          </div>
        )}
        {fonts.length > 0 && (
          <ul className="m-0 grid list-none gap-1.5 p-0">
            {fonts.map((font) => {
              const missing = font.faces[0] ? unsupportedChars(font.faces[0], text) : [];
              return (
                <li key={font.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[var(--surface)] px-3 py-2">
                  <span><b>{font.name}</b>{missing.length > 0 && <span className="text-[var(--danger)]">{t.noLetters(short(missing))}</span>}</span>
                  <button type="button" className="text-[13px] underline" onClick={async () => { await removeCustomFont(font.id); onRemoved(font.id); }}>{t.remove}</button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </details>
  );
}
