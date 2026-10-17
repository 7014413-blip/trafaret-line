"use client";

// Cookie banner (Consent Mode v2, ТЗ §15.17): shown once when the site has analytics tags.
// «Прийняти» turns on GA4, Google Ads and Meta cookies; «Лише необхідні» keeps them off and
// Google gets only cookieless pings. The footer button «Налаштування cookies» opens it again.

import Link from "@/components/i18n/LocaleLink";
import { useEffect, useState } from "react";
import type { ConsentChoice } from "@/types/analytics";
import { siteAnalyticsConfig } from "@/lib/analytics/analytics-config";
import { applyConsent, CONSENT_OPEN_EVENT, currentConsent } from "@/lib/client/consent-choice";

export function CookieBanner() {
  const [open, setOpen] = useState(false);
  const { gtmId, metaPixelId } = siteAnalyticsConfig();
  const enabled = !!(gtmId || metaPixelId);

  useEffect(() => {
    if (!enabled) return;
    if (!currentConsent()) setOpen(true);
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, [enabled]);

  if (!open) return null;
  const choose = (choice: ConsentChoice) => {
    applyConsent(choice);
    setOpen(false);
  };
  return (
    <section role="region" aria-label="Налаштування cookies"
      className="fixed inset-x-3 bottom-[88px] z-40 mx-auto grid max-w-[560px] gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[0_12px_40px_rgba(15,23,42,.18)] lg:bottom-5">
      <p className="m-0 text-sm leading-relaxed">
        Ми використовуємо cookies для аналітики та реклами, щоб показувати вам доречні товари. Необхідні cookies (кошик, вхід) працюють завжди.{" "}
        <Link href="/polityka-konfidentsiinosti" className="underline">Докладніше</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("granted")} className="h-11 rounded-full bg-[var(--buy)] px-5 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)]">Прийняти</button>
        <button type="button" onClick={() => choose("denied")} className="h-11 rounded-full px-5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">Лише необхідні</button>
      </div>
    </section>
  );
}

/** Footer link that opens the banner again; hidden when the site has no tags. */
export function CookieSettingsButton() {
  const { gtmId, metaPixelId } = siteAnalyticsConfig();
  if (!gtmId && !metaPixelId) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className="text-left underline-offset-2 hover:underline">
      Налаштування cookies
    </button>
  );
}
