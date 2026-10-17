// Clicks on contact links become «phone_click» or «messenger_click» (ТЗ §15.17): tel: links,
// Viber, Telegram and WhatsApp. Any other link is not an event.

import type { AnalyticsEventName } from "../../types/analytics";

export function linkEvent(href: string): { name: AnalyticsEventName; linkType: string } | null {
  const value = href.trim().toLowerCase();
  if (value.startsWith("tel:")) return { name: "phone_click", linkType: "phone" };
  if (value.startsWith("viber:")) return { name: "messenger_click", linkType: "viber" };
  if (/^https?:\/\/(t\.me|telegram\.me)\//.test(value) || value.startsWith("tg:")) return { name: "messenger_click", linkType: "telegram" };
  if (/^https?:\/\/(wa\.me|api\.whatsapp\.com)\//.test(value) || value.startsWith("whatsapp:")) return { name: "messenger_click", linkType: "whatsapp" };
  return null;
}
