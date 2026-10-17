"use client";

// «УКР · РУС» in the trust bar: the same page in the other language.

import { usePathname } from "next/navigation";
import NextLink from "next/link";
import type { Locale } from "@/types/customizer";
import { localePath, splitLocalePath } from "@/lib/i18n/locale-path";
import { SITE_LOCALES } from "@/lib/i18n/locales";
import { useLocale } from "./LocaleProvider";

const LABELS: Record<Locale, string> = { uk: "УКР", ru: "РУС", en: "ENG" };

export function LanguageSwitch({ label }: { label: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  const { path } = splitLocalePath(pathname);
  return (
    <nav aria-label={label} className="flex gap-1">
      {SITE_LOCALES.map((other) => (
        <NextLink key={other} href={localePath(other, path)} hrefLang={other}
          aria-current={other === locale ? "true" : undefined}
          className={`inline-flex min-h-[28px] items-center rounded px-1.5 ${other === locale ? "font-bold" : "opacity-70 hover:opacity-100"}`}>
          {LABELS[other]}
        </NextLink>
      ))}
    </nav>
  );
}
