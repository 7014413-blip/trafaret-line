// «Подзвонити Наталі»: the manager's phone as a one-tap call link (tel:) in the header, on the
// contacts page and in the consultant chat. The number lives in data/site.ts (SITE.manager).

import { SITE, SITE_TEXT } from "@/data/site";
import { tr } from "@/lib/i18n/translate";
import type { Locale } from "@/types/customizer";
import type { Dictionary } from "@/types/i18n";

type Variant = "header" | "card" | "chat";

const TEXT: Dictionary<{ call: string; callManager: (name: string) => string; manager: string }> = {
  uk: { call: "Подзвонити", callManager: (name) => `Подзвонити менеджеру ${name}`, manager: "менеджер" },
  ru: { call: "Позвонить", callManager: (name) => `Позвонить менеджеру ${name}`, manager: "менеджер" },
};

function PhoneIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M5 4h3.5l1.6 4.2-2.2 1.5a11 11 0 0 0 6.4 6.4l1.5-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
    </svg>
  );
}

export function ManagerCallButton({ variant, locale = "uk" }: { variant: Variant; locale?: Locale }) {
  const t = tr(TEXT, locale);
  const people = tr(SITE_TEXT, locale);
  const callManager = t.callManager(people.managerNameDative);
  const label = `${callManager}, ${SITE.manager.phone}`;
  const href = `tel:${SITE.manager.phoneHref}`;
  if (variant === "chat") {
    return <a href={href} aria-label={label} className="text-sm font-semibold underline">{t.call}</a>;
  }
  if (variant === "card") {
    return (
      <a href={href} aria-label={label}
        className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)] no-underline hover:bg-[var(--buy-hover)]">
        <PhoneIcon className="h-5 w-5" />
        {callManager}
      </a>
    );
  }
  return (
    <a href={href} aria-label={label} className="flex items-center gap-2.5 whitespace-nowrap">
      <span className="grid h-11 w-11 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--line)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]">
        <PhoneIcon className="h-5 w-5" />
      </span>
      <span className="hidden leading-tight xl:grid">
        <b className="text-[15px]">{SITE.manager.phone}</b>
        <small className="text-[var(--muted)]">{people.managerName}, {t.manager} · Viber · Telegram</small>
      </span>
    </a>
  );
}
