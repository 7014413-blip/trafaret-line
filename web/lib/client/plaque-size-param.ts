// Size chosen on a product page (?size=21x6), so a plaque constructor opens with the same
// size. Only known codes are accepted.

export function readPlaqueSizeParam(codes: string[]): string | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("size");
  return value && codes.includes(value) ? value : null;
}
