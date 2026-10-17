import type { Metadata } from "next";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { TelegramReturn } from "@/components/account/TelegramReturn";
import { ACCOUNT } from "@/lib/i18n/dictionaries/account";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  return { title: tr(ACCOUNT, localeOf((await params).lang)).telegramMetaTitle, robots: { index: false, follow: false } };
}

export default function TelegramSignIn() {
  return (
    <>
      <TrustBar />
      <SiteHeader />
      <main className="mx-auto grid max-w-[640px] gap-3 px-4 py-14">
        <TelegramReturn />
      </main>
      <SiteFooter />
    </>
  );
}
