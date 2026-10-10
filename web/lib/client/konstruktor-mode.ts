// Mode of the «Свій напис» constructor in the address bar (?mode=weld), so a reload or a
// shared link opens the same mode (QA 2026-10-10, m4). «Трафарет» is the default and keeps
// the address clean.

export type KonstruktorMode = "stencil" | "weld";

const PARAM = "mode";

export function readKonstruktorMode(): KonstruktorMode {
  if (typeof window === "undefined") return "stencil";
  return new URLSearchParams(window.location.search).get(PARAM) === "weld" ? "weld" : "stencil";
}

export function writeKonstruktorMode(mode: KonstruktorMode): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (mode === "weld") url.searchParams.set(PARAM, "weld");
  else url.searchParams.delete(PARAM);
  window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
}
