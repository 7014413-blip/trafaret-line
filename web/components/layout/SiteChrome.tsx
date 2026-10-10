"use client";

// Trust bar, sticky header (logo, catalog, search, phone, cart; the RU/EN switch returns
// together with the translated pages, QA 2026-10-10),
// direction tabs, footer and the mobile bottom navigation.

import Link from "next/link";
import { useEffect, useState } from "react";
import { DIRECTIONS } from "@/data/home";
import { SITE } from "@/data/site";
import { CartButton, CartHost } from "@/components/cart/CartHost";

const SEARCH_HINTS = ["мандала", "цифри 10 см", "напис на торт", "піксель ЗСУ", "акрил 3 мм коло", "номер підʼїзду"];
const INFO_LINKS = [
  ["Про нас", "/pro-nas"], ["Доставка і оплата", "/dostavka-i-oplata"], ["Обмін і повернення", "/povernennia"],
  ["Для бізнесу", "/business"], ["Контакти", "/kontakty"],
] as const;

export function TrustBar() {
  return (
    <div className="bg-[var(--ink)] text-[var(--bg)] text-[13px]">
      <div className="mx-auto flex min-h-[34px] max-w-[1320px] flex-wrap items-center justify-center gap-x-4 px-4 text-center lg:justify-between lg:px-8">
        <span>Виготовлення 3 робочі дні · Нова пошта по всій Україні · Оплата при отриманні</span>
        <nav aria-label="Інформація" className="hidden gap-5 lg:flex">
          {INFO_LINKS.map(([t, h]) => (
            <Link key={h} href={h} className="inline-flex min-h-[28px] items-center px-1 opacity-80 hover:opacity-100">{t}</Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function SiteHeader({ initialQuery = "" }: { initialQuery?: string }) {
  const [hint, setHint] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setHint((h) => (h + 1) % SEARCH_HINTS.length), 2500);
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setHidden(window.innerWidth < 768 && y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { clearInterval(id); window.removeEventListener("scroll", onScroll); };
  }, []);

  return (
    <header
      className="sticky top-[env(safe-area-inset-top,0px)] z-30 border-b border-[var(--line)] bg-[var(--bg)] transition-transform duration-200"
      style={{ transform: hidden ? "translateY(-60px)" : undefined }}
    >
      <div className="mx-auto grid max-w-[1320px] grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-2 md:grid-cols-[auto_auto_minmax(0,1fr)_auto] md:min-h-[68px] lg:px-8">
        <Link href="/" className="flex items-center gap-2 whitespace-nowrap font-[family-name:var(--font-display)] text-lg font-bold">
          <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-lg border-2 border-dashed border-[var(--ink)] text-sm">✂</span>
          Trafaret Line
        </Link>
        <Link href="/catalog" className="hidden h-11 items-center gap-2 rounded-full bg-[var(--buy)] px-[18px] font-bold text-[var(--buy-fg)] hover:bg-[var(--buy-hover)] md:flex">
          <span aria-hidden>▦</span> Каталог
        </Link>
        <form action="/poshuk" method="get" role="search" className="order-3 col-span-full flex h-[46px] w-full min-w-0 items-center gap-2.5 rounded-xl border-[1.5px] border-transparent bg-[var(--surface)] px-3.5 focus-within:border-[var(--ink)] focus-within:bg-[var(--card)] md:order-none md:col-span-1 md:max-w-[640px] md:justify-self-center">
          <span aria-hidden>🔍</span>
          <input
            type="search"
            name="q"
            defaultValue={initialQuery}
            minLength={2}
            maxLength={100}
            className="h-full w-full min-w-0 bg-transparent outline-none"
            placeholder={`Знайти трафарет: ${SEARCH_HINTS[hint]}`}
            aria-label="Пошук по каталогу"
          />
          <button type="submit" className="sr-only">Знайти</button>
        </form>
        <div className="flex items-center gap-3.5 whitespace-nowrap text-sm">
          <div className="hidden leading-tight xl:grid">
            <b className="text-[15px]">{SITE.phone}</b>
            <small className="text-[var(--muted)]">Viber · Telegram</small>
          </div>
          <CartButton />
        </div>
      </div>
      <CartHost />
    </header>
  );
}

export function DirectionTabs() {
  return (
    <nav aria-label="Напрямки" className="border-b border-[var(--line)]">
      <div className="mx-auto flex min-h-[50px] max-w-[1320px] items-center gap-1.5 overflow-x-auto px-4 [scrollbar-width:none] lg:px-8">
        <Link href="/" className="whitespace-nowrap rounded-full bg-[var(--ink)] px-3.5 py-2 font-bold text-[var(--bg)]">Трафарети</Link>
        <Link href="/blanks" className="whitespace-nowrap rounded-full px-3.5 py-2 font-bold hover:bg-[var(--surface)]">Акрил і ПЕТ</Link>
        <span aria-hidden className="mx-1.5 h-[22px] w-px flex-none bg-[var(--line)]" />
        {DIRECTIONS.map((d) => (
          <Link key={d.href} href={d.href} className="whitespace-nowrap rounded-full px-3.5 py-2 text-[15px] font-medium hover:bg-[var(--surface)]">{d.title}</Link>
        ))}
      </div>
    </nav>
  );
}

export function SiteFooter() {
  const col = (title: string, links: [string, string][]) => (
    <div>
      <h4 className="mb-2.5 text-[15px] font-bold">{title}</h4>
      {links.map(([t, h]) => <Link key={h} href={h} className="block py-1 opacity-80 hover:opacity-100">{t}</Link>)}
    </div>
  );
  return (
    <footer className="mt-5 bg-[var(--ink)] text-[15px] text-[var(--bg)]">
      <div className="mx-auto grid max-w-[1320px] grid-cols-2 gap-6 px-4 py-10 md:grid-cols-[1.4fr_repeat(3,1fr)] lg:px-8">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 font-[family-name:var(--font-display)] text-lg font-bold">
            <span aria-hidden className="grid h-[30px] w-[30px] place-items-center rounded-lg border-2 border-dashed border-[var(--bg)] text-sm">✂</span>
            Trafaret Line
          </div>
          <p className="mt-3 max-w-[34ch] opacity-80">Трафарети і заготовки від виробника. Бориспіль · Запоріжжя.</p>
          <p className="mt-2 text-[13px] opacity-70">{SITE.legal}, {SITE.tax}</p>
        </div>
        {col("Каталог", [["Трафарети", "/catalog"], ["Заготовки з акрилу і PET", "/blanks"], ["Свій напис", "/konstruktor"], ["Вільне полотно", "/konstruktor/polotno"]])}
        {col("Покупцям", [["Доставка і оплата", "/dostavka-i-oplata"], ["Обмін і повернення", "/povernennia"], ["За вашим макетом", "/na-zamovlennia"], ["Вивіски", "/vyvisky"], ["Таблички-вказівники", "/vyvisky/vkazivnyky"]])}
        {col("Компанія", [["Про нас", "/pro-nas"], ["Для бізнесу", "/business"], ["Контакти", "/kontakty"], ["Публічна оферта", "/oferta"], ["Політика конфіденційності", "/polityka-konfidentsiinosti"]])}
      </div>
    </footer>
  );
}

const Icon = ({ d }: { d: string }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden><path d={d} /></svg>
);

export function BottomNav() {
  const items: [string, string, string][] = [
    ["Головна", "/", "M3 11l9-7 9 7v9H5v-9"],
    ["Каталог", "/catalog", "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z"],
    ["Свій напис", "/konstruktor", "M4 20l4-1 11-11-3-3L5 16z"],
    ["Кошик", "/checkout", "M4 5h2l2 11h11l2-8H7"],
    ["Контакти", "/kontakty", "M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c1-4 4-6 8-6s7 2 8 6"],
  ];
  return (
    <nav aria-label="Мобільне меню" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-[var(--line)] bg-[var(--bg)] px-1 pt-1.5 pb-[calc(6px+env(safe-area-inset-bottom,0px))] lg:hidden">
      {items.map(([t, h, d], i) => (
        <Link key={h} href={h} className={`grid justify-items-center gap-0.5 text-[11px] ${i === 0 ? "font-bold text-[var(--ink)]" : "text-[var(--muted)]"}`}>
          <Icon d={d} />{t}
        </Link>
      ))}
    </nav>
  );
}
