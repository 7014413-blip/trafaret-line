// Sign-in buttons of the cabinet: each one shows when its key is set on this storefront
// (GOOGLE_CLIENT_ID; TELEGRAM_BOT_ID, the number before ":" in the bot token on Medusa).

import type { LoginProviders } from "../../types/account";

export function loginProviders(env: Record<string, string | undefined> = process.env): LoginProviders {
  const botId = env.TELEGRAM_BOT_ID?.trim() ?? "";
  return {
    google: !!env.GOOGLE_CLIENT_ID?.trim(),
    telegramBotId: /^\d{5,15}$/.test(botId) ? botId : null,
  };
}
