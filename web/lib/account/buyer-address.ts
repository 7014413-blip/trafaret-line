// The buyer's address for Medusa's limits on cabinet calls that the storefront makes from its
// server: nginx's x-real-ip, otherwise the last x-forwarded-for entry (the one nginx added;
// earlier entries come from the browser). Same rule as backend/src/lib/rate-limit.ts.

export function buyerAddress(headers: Headers): string | null {
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const last = headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean).pop();
  return last ?? null;
}
