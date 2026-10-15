"use client";

// Logo of a sign constructor: an empty dashed button to add the file, or the file name with
// «Замінити» and «Прибрати» and the constructor's own logo options under it. The file input is
// cleared after every pick, so the same file can be picked again.

import { useRef } from "react";

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
  const input = useRef<HTMLInputElement>(null);
  const open = () => input.current?.click();
  return (
    <>
      <input ref={input} id={inputId} type="file" accept={accept} className="sr-only" onChange={(e) => { onPick(e.target.files?.[0]); e.target.value = ""; }} />
      {fileName != null ? (
        <div className="grid min-w-0 gap-2 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-3">
          <div className="flex items-center justify-between gap-2">
            <b className="min-w-0 truncate text-sm">{fileName}</b>
            <div className="flex shrink-0 gap-2">
              <button type="button" onClick={open} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Замінити</button>
              <button type="button" onClick={onRemove} className="h-9 rounded-full border border-[var(--line)] px-3 text-sm">Прибрати</button>
            </div>
          </div>
          {children}
        </div>
      ) : (
        <>
          <button type="button" onClick={open} className="grid justify-items-center gap-1 rounded-xl border-2 border-dashed border-[var(--line)] bg-[var(--card)] p-5 text-center">
            <b>Додати логотип</b>
            <span className="text-[13px] text-[var(--muted)]">{emptyHint}</span>
          </button>
          {after}
        </>
      )}
      {error && <p role="alert" className="m-0 text-sm text-[var(--danger)]">{error}</p>}
    </>
  );
}
