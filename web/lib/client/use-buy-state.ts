"use client";

// State of the «В кошик» button of a constructor: idle, uploading the customer's logo first,
// added (shown for 1.5 s, then idle again) or failed with a message for the customer.

import { useCallback, useEffect, useRef, useState } from "react";
import type { BuyState } from "../../types/constructor-ui";

const ADDED_FOR_MS = 1500;

export interface BuyStateControls {
  state: BuyState;
  message: string;
  uploading: () => void;
  added: () => void;
  failed: (message: string) => void;
}

export function useBuyState(): BuyStateControls {
  const [state, setState] = useState<BuyState>("idle");
  const [message, setMessage] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const uploading = useCallback(() => {
    setMessage("");
    setState("uploading");
  }, []);
  const added = useCallback(() => {
    setMessage("");
    setState("added");
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), ADDED_FOR_MS);
  }, []);
  const failed = useCallback((text: string) => {
    setState("error");
    setMessage(text);
  }, []);

  return { state, message, uploading, added, failed };
}
