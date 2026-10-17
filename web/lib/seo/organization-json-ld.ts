// Schema.org data of the shop: Organization with its contacts and social pages, and a
// LocalBusiness for each shipping branch (Бориспіль, Запоріжжя). A branch whose street is not
// known yet is marked by its city only. Used on the home page and on «Контакти».

import { SITE } from "../../data/site";

export function organizationJsonLd(base: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: SITE.name,
    url: `${base}/`,
    logo: `${base}/logo.png`,
    telephone: SITE.phoneHref,
    email: SITE.email,
    sameAs: Object.values(SITE.social),
    location: SITE.branches.map((branch) => {
      const streetKnown = !branch.address.includes("уточн");
      return {
        "@type": "LocalBusiness",
        name: `${SITE.name} — ${branch.city}`,
        description: branch.note,
        telephone: SITE.phoneHref,
        parentOrganization: { "@id": `${base}/#organization` },
        address: {
          "@type": "PostalAddress",
          addressLocality: branch.city,
          ...(streetKnown ? { streetAddress: branch.address } : {}),
          addressCountry: "UA",
        },
      };
    }),
  };
}

/** WebSite with the catalogue search, so Google can show a search box for the shop. */
export function websiteJsonLd(base: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${base}/#website`,
    name: SITE.name,
    url: `${base}/`,
    inLanguage: "uk-UA",
    publisher: { "@id": `${base}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: { "@type": "EntryPoint", urlTemplate: `${base}/poshuk?q={search_term_string}` },
      "query-input": "required name=search_term_string",
    },
  };
}
