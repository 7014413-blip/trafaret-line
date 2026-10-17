// Telegram's sign-in page for the cabinet (the page behind the Telegram login widget). After the
// person confirms in Telegram it returns to /kabinet/vhid-telegram with #tgAuthResult=<data>.
// No third-party script runs on the site. The bot's domain must be the site's (/setdomain).

export const TELEGRAM_AUTH_URL = "https://oauth.telegram.org/auth";
export const TELEGRAM_RETURN_PATH = "/kabinet/vhid-telegram";

export function telegramAuthUrl(botId: string, siteUrl: string): string {
  const params = new URLSearchParams({
    bot_id: botId,
    origin: siteUrl,
    request_access: "write",
    return_to: `${siteUrl}${TELEGRAM_RETURN_PATH}`,
  });
  return `${TELEGRAM_AUTH_URL}?${params}`;
}
