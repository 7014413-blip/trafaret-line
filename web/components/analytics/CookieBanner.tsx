"use client";

// Cookie banner (Consent Mode v2, ТЗ §15.17): shown once when the site has analytics tags.
// «Прийняти» turns on GA4, Google Ads and Meta cookies; «Лише необхідні» keeps them off and
// Google gets only cookieless pings. The footer button «Налаштування cookies» opens it again.

import Link from "@/components/i18n/LocaleLink";
import { useEffect, useState } from "react";
import type { ConsentChoice } from "@/types/analytics";
import { siteAnalyticsConfig } from "@/lib/analytics/analytics-config";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CHROME } from "@/lib/i18n/dictionaries/chrome";
import { tr } from "@/lib/i18n/translate";
import { applyConsent, CONSENT_OPEN_EVENT, currentConsent } from "@/lib/client/consent-choice";

export function CookieBanner() {
  const t = tr(CHROME, useLocale()).cookies;
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
    <section role="region" aria-label={t.settings}
      className="fixed inset-x-3 bottom-[88px] z-40 mx-auto grid max-w-[560px] gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 shadow-[0_12px_40px_rgba(15,23,42,.18)] lg:bottom-5">
      <p className="m-0 text-sm leading-relaxed">
        {t.text}{" "}
        <Link href="/polityka-konfidentsiinosti" className="underline">{t.more}</Link>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => choose("granted")} className="h-11 rounded-full bg-[var(--buy)] px-5 font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)]">{t.accept}</button>
        <button type="button" onClick={() => choose("denied")} className="h-11 rounded-full px-5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)]">{t.necessaryOnly}</button>
      </div>
    </section>
  );
}

/** Footer link that opens the banner again; hidden when the site has no tags. */
export function CookieSettingsButton() {
  const t = tr(CHROME, useLocale()).cookies;
  const { gtmId, metaPixelId } = siteAnalyticsConfig();
  if (!gtmId && !metaPixelId) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className="text-left underline-offset-2 hover:underline">
      {t.settings}
    </button>
  );
}
