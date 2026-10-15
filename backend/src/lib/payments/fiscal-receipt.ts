// Fiscal receipt after an online payment: Medusa asks the storefront route
// POST {STOREFRONT_URL}/api/vchasno-kasa/receipt (web/services/vchasno-kasa.ts), which talks
// to Вчасно.Каса. Server-to-server, authorised with INTERNAL_API_TOKEN (the same value in
// backend/.env and web/.env.local). The receipt tag is derived from the order number, so a
// repeated call never issues a second receipt.

export interface ReceiptLine {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface ReceiptOutcome {
  status: "issued" | "not_configured" | "failed";
  fiscalNumber?: string;
  receiptUrl?: string;
  message?: string;
}

export async function requestFiscalReceipt(input: {
  orderNumber: string;
  payment: "card" | "privat";
  lines: ReceiptLine[];
  paymentRef?: { rrn?: string; cardMask?: string; authCode?: string; system?: string };
  customer?: { email?: string; phone?: string };
}): Promise<ReceiptOutcome> {
  const storefront = process.env.STOREFRONT_URL?.trim();
  const token = process.env.INTERNAL_API_TOKEN?.trim();
  if (!storefront || !token) return { status: "not_configured", message: "STOREFRONT_URL or INTERNAL_API_TOKEN is not set" };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 90_000);
  try {
    const response = await fetch(`${storefront.replace(/\/$/, "")}/api/vchasno-kasa/receipt`, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
      body: JSON.stringify(input),
      signal: controller.signal,
    });
    const data = (await response.json().catch(() => null)) as { fiscalNumber?: string; receiptUrl?: string; error?: string; message?: string } | null;
    if (response.ok && data?.fiscalNumber) return { status: "issued", fiscalNumber: data.fiscalNumber, receiptUrl: data.receiptUrl };
    if (data?.error === "not_configured") return { status: "not_configured", message: data.message };
    return { status: "failed", message: data?.message ?? `HTTP ${response.status}` };
  } catch (error) {
    return { status: "failed", message: (error as Error).message };
  } finally {
    clearTimeout(timer);
  }
}
