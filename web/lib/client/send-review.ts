// Sends one review of an order to Medusa (POST /store/tl-reviews/order/:id?t=).

import type { ReviewInput, ReviewInputField } from "../../types/reviews";

export type SendReviewResult =
  | { ok: true }
  | { ok: false; message: string; errors?: Partial<Record<ReviewInputField, string>>; alreadySent?: boolean };

export async function sendReview(orderId: string, token: string, input: ReviewInput): Promise<SendReviewResult> {
  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-reviews/order/${encodeURIComponent(orderId)}?t=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
      body: JSON.stringify(input),
    });
  } catch {
    return { ok: false, message: "Немає звʼязку з сервером. Перевірте інтернет і спробуйте ще раз." };
  }
  if (response.ok) return { ok: true };
  const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Partial<Record<ReviewInputField, string>> };
  if (response.status === 429) return { ok: false, message: "Забагато спроб. Спробуйте трохи пізніше." };
  return { ok: false, message: body.message || "Не вдалося надіслати відгук. Спробуйте ще раз.", errors: body.errors, alreadySent: response.status === 409 };
}
