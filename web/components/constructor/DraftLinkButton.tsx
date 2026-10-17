"use client";

// «Посилання на макет»: copies the link that opens the same layout (lib/client/use-url-draft.ts),
// to send to a phone, a colleague or our manager.

import { useState } from "react";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";

export function DraftLinkButton({ link, note }: { link: () => string; note?: string }) {
  const t = tr(CONSTRUCTOR, useLocale());
  const [state, setState] = useState<"idle" | "copied" | "shown">("idle");
  const [shown, setShown] = useState("");
  const copy = async () => {
    const value = link();
    window.history.replaceState(window.history.state, "", value);
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setShown(value);
      setState("shown");
    }
  };
  return (
    <div className="grid gap-1.5">
      <button type="button" onClick={copy} className="h-11 justify-self-start rounded-full px-5 text-sm font-semibold shadow-[inset_0_0_0_1.5px_var(--line)]">
        {state === "copied" ? t.draftCopied : t.draftLink}
      </button>
      {state === "shown" && (
        <input readOnly value={shown} aria-label={t.draftLink} onFocus={(e) => e.currentTarget.select()}
          className="h-11 w-full rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-sm" />
      )}
      {note && <p className="m-0 text-[13px] text-[var(--muted)]">{note}</p>}
    </div>
  );
}
