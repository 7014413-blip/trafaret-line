// Customer profile of a Telegram sign-in. Telegram gives no e-mail, so the account gets a
// cabinet address of its own that no real mailbox has: tg<id>@telegram.trafaret-line.com.ua.

import type { LoginProfile, TelegramLogin } from "../../types/account";

export const TELEGRAM_EMAIL_DOMAIN = "telegram.trafaret-line.com.ua";

export function telegramProfile(login: TelegramLogin): LoginProfile {
  return {
    provider: "telegram",
    email: `tg${login.id}@${TELEGRAM_EMAIL_DOMAIN}`,
    firstName: login.firstName,
    lastName: login.lastName,
    telegramId: login.id,
    telegramUsername: login.username,
  };
}

/** True for the cabinet address of a Telegram account (not a mailbox to write to). */
export const isTelegramEmail = (email: string | null | undefined): boolean => !!email && email.endsWith(`@${TELEGRAM_EMAIL_DOMAIN}`);
