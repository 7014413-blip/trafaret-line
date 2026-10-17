// Ukrainian 404 page with the site header, search and the main sections (QA 2026-10-10, m8).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";

export const metadata: Metadata = { title: "Сторінку не знайдено", robots: { index: false, follow: true } };

const LINKS: [string, string][] = [
  ["Каталог трафаретів", "/catalog"],
  ["Свій напис на трафареті", "/konstruktor"],
  ["Трафарет за вашим макетом", "/na-zamovlennia"],
  ["Вивіски з акрилу", "/vyvisky"],
  ["Доставка і оплата", "/dostavka-i-oplata"],
  ["Контакти", "/kontakty"],
];

export default function NotFound() {
  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <main className="mx-auto grid max-w-[760px] justify-items-start gap-4 px-4 py-12 lg:px-8">
        <p className="m-0 text-sm font-bold uppercase tracking-widest text-[var(--muted)]">Помилка 404</p>
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,38px)] font-bold leading-tight">Такої сторінки немає</h1>
        <p className="m-0 text-lg text-[var(--muted)]">Можливо, товар перейменували або адресу введено з помилкою. Скористайтеся пошуком угорі або оберіть розділ.</p>
        <ul className="m-0 grid list-none gap-2 p-0 sm:grid-cols-2">
          {LINKS.map(([title, href]) => (
            <li key={href}><Link href={href} className="inline-flex min-h-11 items-center font-semibold underline">{title}</Link></li>
          ))}
        </ul>
        <Link href="/" className="mt-2 inline-flex h-12 items-center rounded-full bg-[var(--buy)] px-6 font-bold text-[var(--buy-fg)]">На головну</Link>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}
