"use client";

// Keeps a constructor's layout in the address (?draft=…): on opening, a draft from the link is
// read, checked and applied once; after the customer changes something, the address follows
// the layout, so copying it (or the «Посилання на макет» button) opens the same layout on
// another device. An untouched constructor keeps a clean address.

import { useCallback, useEffect, useRef, useState } from "react";
import { decodeDraft, encodeDraft } from "../draft/draft-codec";

const PARAM = "draft";
const WRITE_DELAY_MS = 400;

function addressWith(encoded: string | null): string {
  const url = new URL(window.location.href);
  if (encoded) url.searchParams.set(PARAM, encoded);
  else url.searchParams.delete(PARAM);
  return `${url.pathname}${url.search}${url.hash}`;
}

export interface UrlDraft {
  /** A draft from the link was applied. */
  restored: boolean;
  /** Full link to the current layout. */
  link: () => string;
}

export function useUrlDraft<T>(parse: (raw: unknown) => T | null, apply: (draft: T) => void, current: T): UrlDraft {
  const [ready, setReady] = useState(false);
  const [restored, setRestored] = useState(false);
  const untouched = useRef<string | null>(null);
  const encoded = encodeDraft(current);

  // Read once after mounting: the server renders the default layout.
  useEffect(() => {
    const draft = parse(decodeDraft(new URLSearchParams(window.location.search).get(PARAM) ?? ""));
    if (draft) { apply(draft); setRestored(true); }
    setReady(true);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!ready) return;
    if (untouched.current === null) { untouched.current = encoded; return; }
    if (!restored && encoded === untouched.current) return;
    const timer = window.setTimeout(() => window.history.replaceState(window.history.state, "", addressWith(encoded)), WRITE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [ready, restored, encoded]);

  const link = useCallback(() => `${window.location.origin}${addressWith(encoded)}`, [encoded]);
  return { restored, link };
}
