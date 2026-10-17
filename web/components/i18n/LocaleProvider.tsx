"use client";

// Language of the page for client components: links (LocaleLink), router pushes and the
// dictionary texts read it from here. Set once by the root layout from the [lang] segment.

import { createContext, useContext, type ReactNode } from "react";
import type { Locale } from "@/types/customizer";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE);

export function LocaleProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}
