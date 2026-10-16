// Check of a review before it is sent (form) and when it arrives (Medusa). Texts are trimmed,
// control characters dropped and spaces collapsed; messages are in Ukrainian for the form.

import type { ReviewInput, ReviewInputCheck, ReviewInputField } from "../../types/reviews";
import { base64Bytes } from "./base64-bytes";
import { cleanReviewText } from "./clean-review-text";
import { REVIEW_LIMITS } from "./review-limits";

const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export function validateReviewInput(raw: unknown): ReviewInputCheck {
  const body = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: Partial<Record<ReviewInputField, string>> = {};

  const key = typeof body.key === "string" ? body.key.trim() : "";
  if (!/^[a-z0-9][a-z0-9-]{0,199}$/.test(key)) errors.key = "Оберіть товар для відгуку";

  const name = cleanReviewText(body.name, false);
  if (name.length < REVIEW_LIMITS.nameMin || name.length > REVIEW_LIMITS.nameMax) errors.name = "Вкажіть імʼя (від 2 до 60 символів)";

  const city = cleanReviewText(body.city, false);
  if (city.length > REVIEW_LIMITS.cityMax) errors.city = "Назва міста до 60 символів";

  const rating = typeof body.rating === "number" ? body.rating : Number.NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) errors.rating = "Поставте оцінку від 1 до 5 зірок";

  const text = cleanReviewText(body.text, true);
  if (text.length < REVIEW_LIMITS.textMin) errors.text = "Напишіть хоча б кілька слів (від 10 символів)";
  else if (text.length > REVIEW_LIMITS.textMax) errors.text = "Відгук до 2000 символів";

  const photos = Array.isArray(body.photos) ? body.photos : [];
  if (photos.length > REVIEW_LIMITS.photosMax) errors.photos = "До 5 фото";
  else if (!photos.every((p) => typeof p === "string" && BASE64.test(p) && base64Bytes(p) > 0 && base64Bytes(p) <= REVIEW_LIMITS.photoBytesMax)) {
    errors.photos = "Фото пошкоджене або завелике, додайте інше";
  }

  if (Object.keys(errors).length) return { ok: false, errors };
  const value: ReviewInput = { key, name, city, rating, text, photos: photos as string[] };
  return { ok: true, value };
}
