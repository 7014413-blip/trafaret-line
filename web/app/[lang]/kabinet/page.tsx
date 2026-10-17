// «Мій кабінет» (ТЗ §4.9): sign-in with Google or Telegram, then «Мої замовлення» with status,
// parcel number and «Повторити замовлення». The session lives in an HttpOnly cookie; the orders
// come from Medusa for that session on every visit (never cached, never indexed).

import type { Metadata } from "next";
import Link from "@/components/i18n/LocaleLink";
import { cookies, headers } from "next/headers";
import { SiteFooter, SiteHeader, TrustBar } from "@/components/layout/SiteChrome";
import { LoginPanel } from "@/components/account/LoginPanel";
import { OrderCard } from "@/components/account/OrderCard";
import { loadAccountOrders } from "@/services/medusa-account";
import { loginProviders } from "@/lib/account/login-providers";
import { buyerAddress } from "@/lib/account/buyer-address";
import { SESSION_COOKIE } from "@/lib/account/session-cookie";
import { signInErrorText } from "@/lib/account/sign-in-error-text";
import { siteUrl } from "@/lib/seo/site-url";
import { ACCOUNT } from "@/lib/i18n/dictionaries/account";
import { tr } from "@/lib/i18n/translate";
import { localeOf } from "@/lib/i18n/locales";
import type { AccountOrdersResponse } from "@/types/account";
import type { LangParams } from "@/types/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<LangParams> }): Promise<Metadata> {
  return { title: tr(ACCOUNT, localeOf((await params).lang)).metaTitle, robots: { index: false, follow: false } };
}

async function signedIn(session: string | undefined): Promise<AccountOrdersResponse | "expired" | "unavailable" | null> {
  if (!session) return null;
  try {
    return (await loadAccountOrders(session, buyerAddress(await headers()))) ?? "expired";
  } catch {
    return "unavailable";
  }
}

export default async function Cabinet({ params, searchParams }: { params: Promise<LangParams>; searchParams: Promise<{ pomylka?: string }> }) {
  const locale = localeOf((await params).lang);
  const t = tr(ACCOUNT, locale);
  const { pomylka } = await searchParams;
  const account = await signedIn((await cookies()).get(SESSION_COOKIE)?.value);
  const error = signInErrorText(typeof account === "string" ? account : pomylka, locale);

  return (
    <>
      <TrustBar />
      <SiteHeader />
      <main className="mx-auto grid max-w-[860px] gap-5 px-4 py-10">
        {account && typeof account === "object" ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h1 className="m-0 font-[family-name:var(--font-display)] text-3xl font-bold">{t.myOrders}</h1>
                <p className="m-0 text-[var(--muted)]">
                  {[account.customer.firstName, account.customer.lastName].filter(Boolean).join(" ") || t.yourCabinet}
                  {account.customer.email ? ` · ${account.customer.email}` : ""}
                </p>
              </div>
              <form action="/api/kabinet/logout" method="post">
                <button type="submit" className="h-11 rounded-full border-[1.5px] border-[var(--ink)] px-5 font-bold hover:bg-[var(--surface)]">{t.logout}</button>
              </form>
            </div>
            {account.orders.length ? (
              account.orders.map((order) => <OrderCard key={order.id} order={order} locale={locale} />)
            ) : (
              <section className="grid justify-items-start gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-6">
                <p className="m-0">{t.noOrders}</p>
                <Link href="/catalog" className="rounded-full bg-[var(--buy)] px-6 py-3 font-bold text-[var(--buy-fg)]">{t.toCatalog}</Link>
              </section>
            )}
          </>
        ) : (
          <LoginPanel providers={loginProviders()} siteUrl={siteUrl()} error={error} locale={locale} />
        )}
      </main>
      <SiteFooter />
    </>
  );
}
