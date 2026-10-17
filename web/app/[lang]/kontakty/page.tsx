import { InfoPage } from "@/components/layout/InfoPage";
import { infoPageMetadata } from "@/components/layout/info-page-route";
import { CONTACTS_PAGE } from "@/data/pages/kontakty";
import { organizationJsonLd } from "@/lib/seo/organization-json-ld";
import { jsonLdText } from "@/lib/seo/json-ld";
import { siteUrl } from "@/lib/seo/site-url";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

type Props = { params: Promise<LangParams> };

export const generateMetadata = infoPageMetadata(CONTACTS_PAGE, "/kontakty");

export default async function Contacts({ params }: Props) {
  const locale = localeOf((await params).lang);
  const page = tr(CONTACTS_PAGE, locale);
  const ld = organizationJsonLd(siteUrl());
  return (
    <InfoPage title={page.title} lead={page.lead} locale={locale}>
      {page.body}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdText(ld) }} />
    </InfoPage>
  );
}
