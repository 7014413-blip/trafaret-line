"use client";

// Logo of a sign constructor: an empty dashed button to add the file, or the file name with
// «Замінити» and «Прибрати» and the constructor's own logo options under it. The file input is
// cleared after every pick, so the same file can be picked again; the buttons are the controls,
// the hidden input only carries a name for screen readers and stays out of the tab order.

import { useRef } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { SIGNAGE } from "@/lib/i18n/dictionaries/signage";
import { tr } from "@/lib/i18n/translate";

export function LogoFileField({ inputId, accept, fileName, onPick, onRemove, emptyHint, error, children, after }: {
  inputId: string;
  accept: string;
  /** Name of the chosen file; null when there is no logo. */
  fileName: string | null;
  onPick: (file: File | undefined) => void;
  onRemove: () => void;
  /** Formats and size limit under «Додати логотип». */
  emptyHint: string;
  error: string;
  /** Options of the chosen logo (place, size, colour). */
  children?: React.ReactNode;
  /** More controls under the field while there is no logo (a sample, logo design). */
  after?: React.ReactNode;
}) {
  const t = tr(SIGNAGE, useLocale());
  const shownError = error ? t.logoErrors[error] ?? error : "";
  const input = useRef<HTMLInputElement>(null);
  const open = () => input.current?.click();
  return (
    <>
      <input ref={input} id={inputId} type="file" accept={accept} aria-label={t.logoFile} tabIndex={-1} className="sr-only" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
      {fileName != null ? (
        <div className="grid min-w-0 gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
          <div className="flex items-center justify-between gap-2">
            <b className="min-w-0 truncate text-sm">{fileName}</b>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={open} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">{t.replace}</button>
              <button type="button" onClick={onRemove} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">{t.remove}</button>
            </div>
          </div>
          {children}
        </div>
      ) : (
        <>
          <button type="button" onClick={open} className="grid justify-items-center gap-1 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-5 text-center">
            <b>{t.addLogo}</b>
            <span className="text-[13px] text-[var(--muted)]">{emptyHint}</span>
          </button>
          {after}
        </>
      )}
      {shownError && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{shownError}</p>}
    </>
  );
}
