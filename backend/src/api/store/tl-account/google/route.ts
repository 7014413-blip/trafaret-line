// POST /store/tl-account/google — sign-in with Google. The storefront's callback
// (/api/kabinet/google/callback) checked its state and sends the code with the same redirect
// address; the code is exchanged here with the client secret and the customer gets a session
// token. Requests per address are limited in api/middlewares.ts.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { Modules } from "@medusajs/framework/utils";
import { googleProfile } from "../../../../lib/account/google-login";
import { signIn } from "../../../../lib/account/sign-in";
import type { CustomerStore } from "../../../../types/account";

const CALLBACK_PATH = "/api/kabinet/google/callback";

function redirectOk(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 300) return false;
  try {
    const url = new URL(value);
    return (url.protocol === "https:" || url.protocol === "http:") && url.pathname === CALLBACK_PATH && !url.search && !url.hash;
  } catch {
    return false;
  }
}

export async function POST(req: MedusaRequest<{ code?: unknown; redirectUri?: unknown }>, res: MedusaResponse) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  const secret = process.env.INTERNAL_API_TOKEN?.trim();
  if (!clientId || !clientSecret || !secret) return res.status(503).json({ message: "Google sign-in is not set up" });
  const code = req.body?.code;
  const redirectUri = req.body?.redirectUri;
  if (typeof code !== "string" || !code || code.length > 2000 || !redirectOk(redirectUri)) return res.status(400).json({ message: "code and redirectUri are required" });
  const profile = await googleProfile(code, redirectUri, { clientId, clientSecret });
  if (!profile) return res.status(401).json({ message: "Google did not confirm the sign-in" });
  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerStore;
  return res.json(await signIn(customers, profile, secret));
}
