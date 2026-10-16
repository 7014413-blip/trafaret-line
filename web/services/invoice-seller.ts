// Seller requisites for B2B invoices. The name, phone and email come from the site data;
// the tax number, IBAN, bank and legal address are set on the server (they are not
// published anywhere else on the site).

import "server-only";
import type { InvoiceSeller } from "../types/invoice";
import { SITE } from "../data/site";
import { SELLER } from "../lib/knowledge-base/seller-rules";
import { requireEnv } from "./config";

export function invoiceSeller(): InvoiceSeller {
  const env = requireEnv("internal", SELLER.requisitesEnv);
  return {
    name: SITE.legal,
    code: env.SELLER_CODE,
    address: env.SELLER_ADDRESS,
    iban: env.SELLER_IBAN,
    bank: env.SELLER_BANK,
    taxNote: SITE.tax,
    phone: SITE.phone,
    email: SITE.email,
  };
}
