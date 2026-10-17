import type { Metadata } from "next";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { TelegramReturn } from "@/components/account/TelegramReturn";

export const metadata: Metadata = { title: "Вхід через Telegram", robots: { index: false, follow: false } };

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
