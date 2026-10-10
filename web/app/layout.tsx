import type { Metadata, Viewport } from "next";
import { Inter, Unbounded, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AssistantChat } from "@/components/chat/AssistantChat";
import { siteUrl } from "@/lib/seo/site-url";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

const unbounded = Unbounded({
  variable: "--font-unbounded",
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "cyrillic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  openGraph: { type: "website", locale: "uk_UA", siteName: "Trafaret Line" },
  twitter: { card: "summary_large_image" },
  title: {
    default: "Trafaret Line — трафарети від виробника",
    template: "%s · Trafaret Line",
  },
  description:
    "Трафарети для стін, штукатурки, тортів і бізнесу від виробника. Свій напис з превʼю, заготовки з акрилу та ПЕТ. Виготовлення 3 робочі дні.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#fafafa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="uk">
      <body className={`${inter.variable} ${unbounded.variable} ${jetbrains.variable} antialiased`}>
        {children}
        <AssistantChat />
      </body>
    </html>
  );
}
