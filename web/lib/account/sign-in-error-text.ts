// What the cabinet page says when a sign-in did not work (/kabinet?pomylka=…).

import type { AccountSignInError } from "../../types/account";

const TEXT: Record<AccountSignInError, string> = {
  google: "Google не підтвердив вхід. Спробуйте ще раз.",
  telegram: "Telegram не підтвердив вхід. Спробуйте ще раз.",
  expired: "Сесія закінчилась. Увійдіть ще раз.",
  unavailable: "Вхід зараз не працює. Спробуйте трохи пізніше або напишіть нам.",
};

export function signInErrorText(value: string | undefined): string | null {
  return value && value in TEXT ? TEXT[value as AccountSignInError] : null;
}
