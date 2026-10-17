import Link from "@/components/i18n/LocaleLink";
import type { ReactNode } from "react";
import { BottomNav, DirectionTabs, SiteFooter, SiteHeader, TrustBar } from "./SiteChrome";

/** Shared layout for trust pages: about, delivery, returns, contacts, business. */
export function InfoPage({ title, lead, children }: { title: string; lead?: string; children: ReactNode }) {
  return (
    <div className="pb-[76px] lg:pb-0">
      <TrustBar />
      <SiteHeader />
      <DirectionTabs />
      <main className="mx-auto max-w-[860px] px-4 py-6 lg:px-8">
        <nav aria-label="Хлібні крихти" className="mb-3 flex gap-1.5 text-[13px] text-[var(--muted)]"><Link href="/" className="hover:text-[var(--ink)]">Головна</Link>›<span>{title}</span></nav>
        <h1 className="m-0 font-[family-name:var(--font-display)] text-[clamp(26px,3.4vw,38px)] font-bold leading-tight [text-wrap:balance]">{title}</h1>
        {lead && <p className="mt-3 mb-6 max-w-[65ch] text-lg text-[var(--muted)]">{lead}</p>}
        <div className="grid gap-6 [&_h2]:m-0 [&_h2]:text-xl [&_h2]:font-bold [&_p]:m-0 [&_ul]:m-0 [&_ul]:grid [&_ul]:gap-1.5 [&_ul]:pl-5">{children}</div>
      </main>
      <SiteFooter />
      <BottomNav />
    </div>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return <section className="grid gap-2.5 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">{children}</section>;
}
