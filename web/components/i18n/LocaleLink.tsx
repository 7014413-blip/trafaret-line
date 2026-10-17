"use client";

// next/link that keeps the page language: on a Russian page "/catalog" leads to "/ru/catalog".
// Every internal link of the site uses it instead of next/link.

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localePath } from "@/lib/i18n/locale-path";
import { useLocale } from "./LocaleProvider";

type Props = ComponentProps<typeof NextLink>;

export default function LocaleLink({ href, ...rest }: Props) {
  const locale = useLocale();
  const target = typeof href === "string" ? localePath(locale, href) : href.pathname ? { ...href, pathname: localePath(locale, href.pathname) } : href;
  return <NextLink href={target} {...rest} />;
}
