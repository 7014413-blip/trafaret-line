"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { formatUAH } from "../../lib/stencil-math";
import { isLatinWord, translit } from "../../lib/search";
import type { Locale, ProductHit } from "../../types/customizer";
import { msg } from "../../lib/i18n";
import { useFocusTrap } from "../../lib/useFocusTrap";

/**
 * Spotlight search, based on Денис's draft (2026-10-08).
 * Opens with Ctrl/Cmd + K (toggle, works in the Ukrainian keyboard layout too, where
 * the key gives "л"), "/" or the header search button (the only way on phones).
 *
 * Data comes from Meilisearch through the injected `search` function, so the
 * component does not know about the client or index names. Typos, uk/ru synonyms
 * ("капучино" → "кава") and standards (ГОСТ/ДСТУ/ISO as a searchable `standards`
 * attribute) are configured on the index. Latin input is transliterated here as a
 * second query, because Meilisearch does not transliterate.
 *
 * Without Meilisearch (dev, small catalogues):
 *   import { localSearch } from "@/lib/search";
 *   const search = async (q) => ({ products: localSearch(allHits, q), categories: [] });
 *
 * Example Meilisearch adapter:
 *   const index = new MeiliSearch({ host, apiKey: SEARCH_ONLY_KEY }).index("products_uk");
 *   const search = async (q, signal) => {
 *     const r = await index.search(q, { limit: 6, attributesToHighlight: ["title", "sku", "standards"] }, { signal });
 *     return { products: r.hits.map(toProductHit), categories: [] };
 *   };
 */
export interface SpotlightResults {
  products: ProductHit[];
  categories: { title: string; href: string; subtitle?: string }[];
}

export interface SpotlightSearchProps {
  search: (q: string, signal: AbortSignal) => Promise<SpotlightResults>;
  popular?: ProductHit[];
  suggestions?: string[];
  /** Where "make my own stencil with this text" goes. */
  customizerHref?: (text: string) => string;
  /** Text on the header button. */
  placeholder?: string;
  /** Text inside the search field. */
  inputPlaceholder?: string;
  /** Site language: uk (default), ru, en. Pass the matching Meilisearch index in `search`. */
  locale?: Locale;
}

type Item =
  | { kind: "product"; hit: ProductHit }
  | { kind: "category"; title: string; href: string; subtitle?: string }
  | { kind: "custom"; text: string };

export function SpotlightSearch({
  search, popular = [], locale = "uk", suggestions = msg(locale).search.suggestions,
  customizerHref = (t) => `/constructor?text=${encodeURIComponent(t)}`, placeholder = msg(locale).search.placeholder,
  inputPlaceholder = msg(locale).search.input,
}: SpotlightSearchProps) {
  const L = msg(locale).search;
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<SpotlightResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const dialog = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();

  const close = useCallback(() => setOpen(false), []);
  useFocusTrap(dialog, open, close, input);

  // Global shortcuts.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // e.code is the physical key, so the shortcut works in any keyboard layout.
      if ((e.ctrlKey || e.metaKey) && (e.code === "KeyK" || e.key.toLowerCase() === "k")) { e.preventDefault(); setOpen((o) => !o); }
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (e.key === "/" && tag !== "INPUT" && tag !== "TEXTAREA") { e.preventDefault(); setOpen(true); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Debounced search with abort; Latin words also searched transliterated.
  useEffect(() => {
    const text = q.trim();
    if (!text) { setRes(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(async () => {
      try {
        const queries = isLatinWord(text) ? [text, translit(text)] : [text];
        const all = await Promise.all(queries.map((x) => search(x, ctrl.signal)));
        const seen = new Set<string>();
        const products = all.flatMap((r) => r.products).filter((p) => !seen.has(p.id) && seen.add(p.id)).slice(0, 6);
        const categories = all.flatMap((r) => r.categories).slice(0, 3);
        setRes({ products, categories });
        setActive(0);
      } catch (e) {
        if ((e as Error).name !== "AbortError") setRes({ products: [], categories: [] });
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 120);
    return () => { ctrl.abort(); window.clearTimeout(t); };
  }, [q, search]);

  const text = q.trim();
  const items: Item[] = text
    ? [
        ...(res?.products ?? []).map((hit) => ({ kind: "product" as const, hit })),
        ...(res?.categories ?? []).map((c) => ({ kind: "category" as const, ...c })),
        { kind: "custom" as const, text },
      ]
    : popular.map((hit) => ({ kind: "product" as const, hit }));

  const go = (it: Item) => {
    setOpen(false);
    if (it.kind === "product") router.push(`/products/${it.hit.handle}`);
    if (it.kind === "category") router.push(it.href);
    if (it.kind === "custom") router.push(customizerHref(it.text));
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    if (e.key === "Enter" && items[active]) { e.preventDefault(); go(items[active]); }
  };

  useEffect(() => {
    document.getElementById(`${listId}-${active}`)?.scrollIntoView({ block: "nearest" });
  }, [active, listId]);

  const optionClass = (i: number) =>
    `grid cursor-pointer items-center gap-3 rounded-xl px-2.5 py-2 ${i === active ? "bg-[var(--surface)] shadow-[inset_3px_0_0_var(--buy)]" : ""}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border-[1.5px] border-[var(--line)] bg-[var(--surface)] pl-3.5 pr-2.5 text-left text-[var(--muted)] hover:border-[var(--muted)]"
      >
        <SearchIcon />
        <span className="min-w-0 flex-1 truncate">{placeholder}</span>
        <kbd className="hidden rounded-md border border-b-2 border-[var(--line)] bg-[var(--bg)] px-1.5 font-mono text-xs text-[var(--ink)] sm:inline">Ctrl K</kbd>
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-[#0f1d33]/45" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
            <div className="pointer-events-none fixed inset-x-0 top-[10vh] z-50 flex justify-center px-4">
            <motion.div
              ref={dialog}
              role="dialog"
              aria-modal="true"
              aria-label={L.button}
              initial={{ y: -12, scale: 0.98, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
              className="pointer-events-auto flex max-h-[76vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl bg-[var(--bg)] text-[var(--ink)] shadow-2xl"
            >
              <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4">
                <SearchIcon />
                <input
                  ref={input}
                  value={q}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder={inputPlaceholder}
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listId}
                  aria-activedescendant={items.length ? `${listId}-${active}` : undefined}
                  aria-autocomplete="list"
                  className="h-14 min-w-0 flex-1 bg-transparent text-lg outline-none"
                />
                {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-[var(--line)] border-t-[var(--buy)]" aria-label={L.loading} />}
                <button type="button" onClick={close} className="rounded-md border border-[var(--line)] px-1.5 font-mono text-xs">Esc</button>
              </div>

              <div id={listId} role="listbox" aria-label={L.results} className="overflow-auto p-2">
                {!text && (
                  <p className="px-2.5 pb-1 pt-2 text-sm text-[var(--muted)]">{L.hint}</p>
                )}
                {!text && suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-2.5 pb-2 pt-1">
                    {suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => { setQ(s); input.current?.focus(); }} className="h-9 rounded-full border-[1.5px] border-[var(--line)] px-3 text-sm">{s}</button>
                    ))}
                  </div>
                )}
                {text && res && res.products.length === 0 && !loading && (
                  <p className="px-2.5 py-2 text-sm text-[var(--muted)]">{L.notFound}</p>
                )}
                {items.map((it, i) => (
                  <div key={i} id={`${listId}-${i}`} role="option" aria-selected={i === active} onMouseMove={() => setActive(i)} onClick={() => go(it)}
                    className={`${optionClass(i)} ${it.kind === "product" ? "grid-cols-[64px_minmax(0,1fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"}`}>
                    {it.kind === "product" && (
                      <>
                        <div className="relative aspect-[4/3] w-16 overflow-hidden rounded-lg border border-[var(--line)]">
                          <Image src={it.hit.thumbnail} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-[15px] font-semibold">{it.hit.title}</div>
                          <div className="truncate font-mono text-xs text-[var(--muted)]">
                            {[it.hit.sku, ...(it.hit.standards ?? []), it.hit.categoryTitle].join(" · ")}
                          </div>
                        </div>
                        <div className="whitespace-nowrap font-bold tabular-nums">{L.from(formatUAH(it.hit.priceFrom))}</div>
                      </>
                    )}
                    {it.kind === "category" && (
                      <><div><div className="font-semibold">{it.title}</div>{it.subtitle && <div className="text-xs text-[var(--muted)]">{it.subtitle}</div>}</div><span aria-hidden="true">→</span></>
                    )}
                    {it.kind === "custom" && (
                      <><div><div className="font-semibold">{L.makeCustom(it.text)}</div><div className="text-xs text-[var(--muted)]">{L.makeCustomSub}</div></div><span aria-hidden="true">✎</span></>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
      <circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" />
    </svg>
  );
}
