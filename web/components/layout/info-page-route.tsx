// Route exports of a translated trust page (about, delivery, returns): metadata and the page
// in the language of the [lang] segment, from the page content in every language.

import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { Dictionary, LangParams } from "@/types/i18n";
import type { InfoPageContent } from "@/types/info-page";
import { InfoPage } from "./InfoPage";

type Props = { params: Promise<LangParams> };

/** generateMetadata of the page at `path` (the Ukrainian path). */
export function infoPageMetadata(content: Dictionary<InfoPageContent>, path: string) {
  return async function generateMetadata({ params }: Props): Promise<Metadata> {
    const locale = localeOf((await params).lang);
    const page = tr(content, locale);
    return pageMeta({ title: page.metaTitle, description: page.metaDescription, path, locale });
  };
}

/** The page component. */
export function infoPageComponent(content: Dictionary<InfoPageContent>) {
  return async function InfoRoute({ params }: Props) {
    const locale = localeOf((await params).lang);
    const page = tr(content, locale);
    return <InfoPage title={page.title} lead={page.lead} locale={locale}>{page.body}</InfoPage>;
  };
}
