import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo/page-meta";
import { DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { OfficePlaqueConstructor } from "@/components/signage/OfficePlaqueConstructor";

export const metadata: Metadata = pageMeta({
  title: "Офісна табличка з гравіюванням — конструктор, ціна одразу",
  description: "Табличка на двері чи стіну: чорна або біла основа, дзеркальна пластина золото, срібло, бронзове золото чи сатин срібло з вашим написом. 21×6 см від 220 ₴, клейова основа 3M.",
  path: "/vyvisky/ofisni-tablychky",
});

export default function OfisniTablychkyPage() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <OfficePlaqueConstructor />
      <SiteFooter />
    </>
  );
}
