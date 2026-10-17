import type { Metadata, Viewport } from "next";
import { Inter, Unbounded, JetBrains_Mono } from "next/font/google";
import "../globals.css";
import { AssistantChat } from "@/components/chat/AssistantChat";
import { AnalyticsScripts } from "@/components/analytics/AnalyticsScripts";
import { AnalyticsListeners } from "@/components/analytics/AnalyticsListeners";
import { CookieBanner } from "@/components/analytics/CookieBanner";
import { siteUrl } from "@/lib/seo/site-url";
import { LocaleProvider } from "@/components/i18n/LocaleProvider";
import { LOCALE_TAGS, SITE_LOCALES, localeOf } from "@/lib/i18n/locales";
import type { LangParams } from "@/types/i18n";
import { HOME } from "@/lib/i18n/dictionaries/home";
import { tr } from "@/lib/i18n/translate";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

// Only Inter (body text, the first screen's largest text) is preloaded: preloading the
// heading and size-label fonts too took the phone's bandwidth before the first screen
// (Lighthouse mobile, QA 2026-10-16). They swap in with a size-matched fallback.
const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  display: "swap",
  preload: false,
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
  preload: false,
});

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  const locale = localeOf((await params).lang);
  const t = tr(HOME, locale);
  return {
    metadataBase: new URL(siteUrl()),
    openGraph: { type: "website", locale: LOCALE_TAGS[locale].og, siteName: "Trafaret Line" },
    twitter: { card: "summary_large_image" },
    title: { default: t.metaTitle, template: "%s · Trafaret Line" },
    description: t.metaDescription,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafa",
};

/** Every language of the site is built ahead; an unknown [lang] is a 404. */
export function generateStaticParams(): LangParams[] {
  return SITE_LOCALES.map((lang) => ({ lang }));
}

export const dynamicParams = false;

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<LangParams>;
}>) {
  const locale = localeOf((await params).lang);
  return (
    <html lang={LOCALE_TAGS[locale].html}>
      <body className={`${inter.variable} ${unbounded.variable} ${jetbrains.variable} antialiased`}>
        <AnalyticsScripts />
        <LocaleProvider locale={locale}>
          {children}
          <AssistantChat />
          <AnalyticsListeners />
          <CookieBanner />
        </LocaleProvider>
      </body>
    </html>
  );
}
