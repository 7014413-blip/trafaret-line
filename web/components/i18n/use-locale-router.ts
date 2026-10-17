"use client";

// useRouter whose push and replace keep the page language (see LocaleLink).

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { localePath } from "@/lib/i18n/locale-path";
import { useLocale } from "./LocaleProvider";

export function useLocaleRouter() {
  const router = useRouter();
  const locale = useLocale();
  return useMemo(() => ({
    ...router,
    push: (href: string, options?: Parameters<typeof router.push>[1]) => router.push(localePath(locale, href), options),
    replace: (href: string, options?: Parameters<typeof router.replace>[1]) => router.replace(localePath(locale, href), options),
  }), [router, locale]);
}
