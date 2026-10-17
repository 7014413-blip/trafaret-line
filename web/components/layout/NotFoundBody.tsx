"use client";

// Body of the 404 page in the page language. The not-found route gets no [lang] params, so the
// language comes from the LocaleProvider of the root layout.

import Link from "@/components/i18n/LocaleLink";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { PAGES } from "@/lib/i18n/dictionaries/pages";
import { tr } from "@/lib/i18n/translate";

export function NotFoundBody() {
  const t = tr(PAGES, useLocale());
  return (
    <main className="mx-auto grid max-w-[760px] justify-items-start gap-4 px-4 py-12 lg:px-8">
      <p className="m-0 text-sm font-bold uppercase tracking-widest text-[var(--muted)]">{t.notFoundCode}</p>
      <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,38px)] font-bold leading-tight">{t.notFoundHeading}</h1>
      <p className="m-0 text-lg text-[var(--muted)]">{t.notFoundText}</p>
      <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
        {t.notFoundLinks.map(([title, href]) => (
          <li key={href}><Link href={href} className="inline-flex min-h-11 items-center font-semibold underline">{title}</Link></li>
        ))}
      </ul>
      <Link href="/" className="mt-2 inline-flex h-12 items-center rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)]">{t.toHome}</Link>
    </main>
  );
}
