// Before the checkout sends the order: the short account token of a signed-in buyer
// (/api/kabinet/checkout-token), so the order lands in their cabinet. A guest, or a storefront
// that cannot answer, gets null and the order goes as a guest order.

export async function checkoutAccountToken(): Promise<string | null> {
  try {
    const response = await fetch("/api/kabinet/checkout-token", { cache: "no-store" });
    if (!response.ok) return null;
    const { token } = (await response.json()) as { token?: unknown };
    return typeof token === "string" ? token : null;
  } catch {
    return null;
  }
}
