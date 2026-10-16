// POST /store/tl-account/telegram — sign-in with Telegram. The storefront sends the data that
// oauth.telegram.org returned to /kabinet/vhid-telegram (#tgAuthResult); it is checked with the
// bot token (TELEGRAM_LOGIN_BOT_TOKEN) and the customer gets a session token.
// Requests per address are limited in api/middlewares.ts.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { verifyTelegramLogin } from "../../../../lib/account/verify-telegram-login";
import { telegramProfile } from "../../../../lib/account/telegram-profile";
import { signIn } from "../../../../lib/account/sign-in";
import type { CustomerStore } from "../../../../types/account";

export async function POST(req: MedusaRequest<{ data?: unknown }>, res: MedusaResponse) {
  const botToken = process.env.TELEGRAM_LOGIN_BOT_TOKEN?.trim();
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  if (!botToken || !secret) return res.status(503).json({ message: "Telegram sign-in is not set up" });
  const login = verifyTelegramLogin(req.body?.data, botToken);
  if (!login) return res.status(401).json({ message: "Telegram login is not valid" });
  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerStore;
  return res.json(await signIn(customers, telegramProfile(login), secret));
}
