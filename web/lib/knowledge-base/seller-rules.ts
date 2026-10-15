// Reads data/knowledge_base/rules_fop.json: the one seller of the site (ФОП, tax group,
// VAT status, receipt tax group) and the names of the server variables that hold the bank
// requisites. A wrong file stops the build with the field name.

import raw from "../../data/knowledge_base/rules_fop.json";
import type { FopRules, SellerRequisiteEnv, SellerRules } from "../../types/fop";

const FILE = "data/knowledge_base/rules_fop.json";
const REQUISITES: readonly SellerRequisiteEnv[] = ["SELLER_CODE", "SELLER_IBAN", "SELLER_BANK", "SELLER_ADDRESS"];
const rules = raw as FopRules;

function text(value: unknown, where: string): string {
  if (typeof value !== "string" || !value.trim()) throw new Error(`${FILE}: seller.${where} must be a non-empty text`);
  return value.trim();
}

function checkRequisites(names: unknown): SellerRequisiteEnv[] {
  if (!Array.isArray(names) || !REQUISITES.every((name) => names.includes(name))) {
    throw new Error(`${FILE}: seller.requisitesEnv must list ${REQUISITES.join(", ")}`);
  }
  return [...REQUISITES];
}

const s = rules.seller;
if (s.taxGroup !== 1 && s.taxGroup !== 2 && s.taxGroup !== 3) throw new Error(`${FILE}: seller.taxGroup must be 1, 2 or 3`);
if (typeof s.vatPayer !== "boolean") throw new Error(`${FILE}: seller.vatPayer must be true or false`);

/** The seller as the footer, offer, invoice and receipts show it. */
export const SELLER: SellerRules = {
  legalName: text(s.legalName, "legalName"),
  taxGroup: s.taxGroup,
  vatPayer: s.vatPayer,
  taxNote: text(s.taxNote, "taxNote"),
  receiptTaxGroup: text(s.receiptTaxGroup, "receiptTaxGroup"),
  requisitesEnv: checkRequisites(s.requisitesEnv),
};
