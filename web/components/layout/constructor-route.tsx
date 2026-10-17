// generateMetadata of a translated constructor page: title and description in the language of
// the [lang] segment, canonical and hreflang for every language.

import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import { CONSTRUCTOR_PAGES, type ConstructorPagePath } from "@/lib/i18n/dictionaries/constructor-pages";
import type { LangParams } from "@/types/i18n";

export function constructorMetadata(path: ConstructorPagePath) {
  return async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
    const locale = localeOf((await params).lang);
    const page = tr(CONSTRUCTOR_PAGES, locale)[path];
    return pageMeta({ title: page.title, description: page.description, path, locale });
  };
}
