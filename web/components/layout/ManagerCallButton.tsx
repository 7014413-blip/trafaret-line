// «Подзвонити Наталі»: the manager's phone as a one-tap call link (tel:) in the header, on the
// contacts page and in the consultant chat. The number lives in data/site.ts (SITE.manager).

import { SITE } from "@/data/site";

type Variant = "header" | "card" | "chat";

const LABEL = `Подзвонити менеджеру ${SITE.manager.nameDative}, ${SITE.manager.phone}`;

function PhoneIcon({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden>
      <path d="M5 4h3.5l1.6 4.2-2.2 1.5a11 11 0 0 0 6.4 6.4l1.5-2.2L20 15.5V19a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.6 1.5 1.5 0 0 1 5 4z" />
    </svg>
  );
}

export function ManagerCallButton({ variant }: { variant: Variant }) {
  const href = `tel:${SITE.manager.phoneHref}`;
  if (variant === "chat") {
    return <a href={href} aria-label={LABEL} className="text-sm font-semibold underline">Подзвонити</a>;
  }
  if (variant === "card") {
    return (
      <a href={href} aria-label={LABEL}
        className="inline-flex h-12 items-center gap-2.5 rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)] no-underline hover:bg-[var(--buy-hover)]">
        <PhoneIcon className="h-5 w-5" />
        Подзвонити менеджеру {SITE.manager.nameDative}
      </a>
    );
  }
  return (
    <a href={href} aria-label={LABEL} className="flex items-center gap-2.5 whitespace-nowrap">
      <span className="grid h-11 w-11 place-items-center rounded-full shadow-[inset_0_0_0_1.5px_var(--line)] hover:shadow-[inset_0_0_0_1.5px_var(--ink)]">
        <PhoneIcon className="h-5 w-5" />
      </span>
      <span className="hidden leading-tight xl:grid">
        <b className="text-[15px]">{SITE.manager.phone}</b>
        <small className="text-[var(--muted)]">{SITE.manager.name}, менеджер · Viber · Telegram</small>
      </span>
    </a>
  );
}
