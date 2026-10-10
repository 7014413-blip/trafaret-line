"use client";

// State with undo / redo (ТЗ v0.9 §5.2: Ctrl+Z / Ctrl+Shift+Z, at least 50 steps).
// Every change made through `set` is one step; `replace` changes the value without a step
// (loading a saved layout).

import { useCallback, useRef, useState } from "react";

export interface History<T> {
  value: T;
  set: (next: T | ((prev: T) => T)) => void;
  replace: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function useHistory<T>(initial: T, limit = 50): History<T> {
  const [state, setState] = useState<{ past: T[]; present: T; future: T[] }>({ past: [], present: initial, future: [] });
  const limitRef = useRef(limit);
  limitRef.current = limit;

  const set = useCallback((next: T | ((prev: T) => T)) => {
    setState((s) => {
      const value = typeof next === "function" ? (next as (prev: T) => T)(s.present) : next;
      if (Object.is(value, s.present)) return s;
      return { past: [...s.past, s.present].slice(-limitRef.current), present: value, future: [] };
    });
  }, []);

  const replace = useCallback((next: T) => setState({ past: [], present: next, future: [] }), []);

  const undo = useCallback(() => {
    setState((s) => (s.past.length ? { past: s.past.slice(0, -1), present: s.past[s.past.length - 1], future: [s.present, ...s.future] } : s));
  }, []);

  const redo = useCallback(() => {
    setState((s) => (s.future.length ? { past: [...s.past, s.present], present: s.future[0], future: s.future.slice(1) } : s));
  }, []);

  return { value: state.present, set, replace, undo, redo, canUndo: state.past.length > 0, canRedo: state.future.length > 0 };
}
