// 404 page with the site header, search and the main sections (QA 2026-10-10, m8), in the
// page language. The title stays Ukrainian: a not-found route gets no [lang] for metadata,
// and the page is not indexed anyway.

import type { Metadata } from "next";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { NotFoundBody } from "@/components/layout/NotFoundBody";
import { PAGES } from "@/lib/i18n/dictionaries/pages";

export const metadata: Metadata = { title: PAGES.uk.notFoundTitle, robots: { index: false, follow: true } };

export default function NotFound() {
  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <NotFoundBody />
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
