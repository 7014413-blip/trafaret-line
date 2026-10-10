import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { Card, InfoPage } from "@/components/layout/InfoPage";
import { SITE } from "@/data/site";

export const metadata: Metadata = pageMeta({
  title: "Контакти",
  description: `Телефон ${SITE.phone}, Viber, Telegram. Бориспіль і Запоріжжя. ${SITE.hours}.`,
  path: "/kontakty",
});

export default function Contacts() {
  const ld = {
    "@context": "https://schema.org", "@type": "Organization", name: SITE.name, url: `https://${SITE.domain}/`, telephone: SITE.phoneHref, email: SITE.email,
    sameAs: Object.values(SITE.social),
    location: SITE.branches.filter((b) => !b.address.includes("уточн")).map((b) => ({ "@type": "LocalBusiness", name: `${SITE.name} — ${b.city}`, address: { "@type": "PostalAddress", addressLocality: b.city, streetAddress: b.address, addressCountry: "UA" }, telephone: SITE.phoneHref })),
  };
  return (
    <InfoPage title="Контакти" lead="Відповідаємо у робочий час протягом 15 хвилин.">
      <Card>
        <h2>Звʼязок</h2>
        <ul>
          <li>Телефон, Viber, Telegram: <b className="select-all">{SITE.phone}</b></li>
          <li>E-mail: <b className="select-all">{SITE.email}</b></li>
          <li>Графік: {SITE.hours}</li>
        </ul>
      </Card>
      <Card>
        <h2>Філіали</h2>
        <ul>{SITE.branches.map((b) => <li key={b.city}><b>{b.city}</b>, {b.address} — {b.note}</li>)}</ul>
      </Card>
      <Card>
        <h2>Ми в соцмережах</h2>
        <ul>{Object.entries(SITE.social).map(([k, v]) => <li key={k}><a href={v} target="_blank" rel="noopener" className="underline">{k[0].toUpperCase() + k.slice(1)}</a></li>)}</ul>
      </Card>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
    </InfoPage>
  );
}
