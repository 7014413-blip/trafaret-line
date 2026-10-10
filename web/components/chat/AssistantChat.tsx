"use client";

// Shop assistant (ТЗ §17): a round button above the bottom bars (menu and the sticky buy bar) opens a small chat that
// talks to POST /api/google-ai/chat. The conversation lives in sessionStorage for the
// visit. Without the Google AI Studio key, or when the visitor sends too many messages,
// the chat says so and offers Viber and the phone instead of failing silently.

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { postJson } from "@/lib/client/api-client";
import { SITE } from "@/data/site";
import { useCart } from "@/store/cart-store";
import type { ChatMessage, ChatResponseBody } from "@/types/integrations";

const STORAGE_KEY = "tl-assistant-v1";
const GREETING = "Вітаю! Допоможу обрати трафарет, розмір і матеріал або порахувати свій напис. Що плануєте прикрасити?";
const STICKY_BAR_PATHS = ["/konstruktor", "/p", "/vyvisky", "/na-zamovlennia"];
const QUICK = ["Трафарет на торт з написом", "Що краще для штукатурки?", "Скільки коштує A4?", "Як швидко відправите?"];

function readHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return Array.isArray(parsed) ? parsed.filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string") : [];
  } catch {
    return [];
  }
}

export function AssistantChat() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const cartOpen = useCart((state) => state.open);

  useEffect(() => setMessages(readHistory()), []);
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30)));
    } catch {
      // Private mode: the chat simply is not remembered between pages.
    }
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, open]);

  const send = async (text: string) => {
    const clean = text.trim().slice(0, 2000);
    if (!clean || sending) return;
    const next: ChatMessage[] = [...messages, { role: "user", text: clean }];
    setMessages(next);
    setDraft("");
    setSending(true);
    setNotice("");
    const result = await postJson<ChatResponseBody>("/api/google-ai/chat", { messages: next, page: pathname });
    setSending(false);
    if (result.ok) {
      setMessages([...next, { role: "assistant", text: result.data.reply }]);
      return;
    }
    const code = result.error?.error;
    setNotice(code === "not_configured"
      ? "Консультант ще вчиться. Напишіть нам у Viber або зателефонуйте, відповімо швидко."
      : code === "rate_limited"
        ? "Забагато повідомлень підряд. Напишіть у Viber, менеджер продовжить розмову."
        : "Не вдалося отримати відповідь. Спробуйте ще раз або напишіть у Viber.");
  };

  // Never on top of the cart's «Оформити» (QA M11) or on checkout and invoices.
  if (cartOpen || pathname?.startsWith("/checkout") || pathname?.startsWith("/rakhunok")) return null;
  // Pages with a sticky buy bar on phones: the button is shown on desktop only, so it does not cover the bar.
  const stickyBar = STICKY_BAR_PATHS.some((p) => pathname === p || pathname?.startsWith(`${p}/`));

  return (
    <>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-controls="assistant-panel"
        className={`fixed right-4 bottom-[calc(132px+env(safe-area-inset-bottom,0px))] z-30 h-14 w-14 place-items-center rounded-full bg-[var(--buy)] text-[var(--buy-fg)] shadow-[0_10px_28px_rgba(15,23,42,.25)] lg:bottom-6 ${stickyBar && !open ? "hidden lg:grid" : "grid"}`}>
        <span className="sr-only">{open ? "Закрити консультанта" : "Запитати консультанта"}</span>
        <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 5h16v11H9l-5 4z" />}
        </svg>
      </button>

      {open && (
        <section id="assistant-panel" role="dialog" aria-label="Консультант Trafaret Line"
          className="fixed right-4 bottom-[calc(196px+env(safe-area-inset-bottom,0px))] z-40 flex max-h-[min(560px,70vh)] w-[min(380px,calc(100vw-32px))] flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-[0_18px_48px_rgba(15,23,42,.22)] lg:bottom-24">
          <header className="flex items-center justify-between gap-2 border-b border-[var(--line)] px-4 py-3">
            <b>Консультант</b>
            <a href={SITE.viber} className="text-sm font-semibold underline">Viber</a>
          </header>
          <div ref={listRef} className="grid flex-1 content-start gap-2 overflow-y-auto px-4 py-3 text-[15px]">
            <p className="m-0 max-w-[85%] rounded-2xl rounded-tl-sm bg-[var(--surface)] px-3 py-2">{GREETING}</p>
            {messages.map((m, i) => (
              <p key={i} className={`m-0 max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 ${m.role === "user" ? "justify-self-end rounded-tr-sm bg-[var(--ink)] text-[var(--bg)]" : "rounded-tl-sm bg-[var(--surface)]"}`}>{m.text}</p>
            ))}
            {sending && <p className="m-0 text-sm text-[var(--muted)]">Пишу відповідь…</p>}
            {notice && <p role="status" className="m-0 rounded-xl bg-[var(--surface)] p-3 text-sm">{notice} <a href={`tel:${SITE.phoneHref}`} className="font-semibold underline">{SITE.phone}</a></p>}
            {!messages.length && (
              <div className="flex flex-wrap gap-1.5">
                {QUICK.map((q) => <button key={q} type="button" onClick={() => send(q)} className="rounded-full border border-[var(--line)] px-3 py-1.5 text-sm">{q}</button>)}
              </div>
            )}
          </div>
          <form onSubmit={(e) => { e.preventDefault(); void send(draft); }} className="flex gap-2 border-t border-[var(--line)] p-2.5">
            <input id="assistant-input" value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={2000} placeholder="Ваше питання" aria-label="Ваше питання"
              className="h-11 min-w-0 flex-1 rounded-full border border-[var(--line)] bg-[var(--bg)] px-4 text-[15px]" />
            <button type="submit" disabled={sending || !draft.trim()} className="h-11 rounded-full bg-[var(--buy)] px-4 font-bold text-[var(--buy-fg)] disabled:opacity-50">Надіслати</button>
          </form>
        </section>
      )}
    </>
  );
}
