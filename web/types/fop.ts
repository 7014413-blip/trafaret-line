// The seller of the site: one ФОП (Денис, 2026-10-15). Shape of
// data/knowledge_base/rules_fop.json; the bank requisites themselves come from the server
// environment (variables named in requisitesEnv), never from the repository.

export type { InvoiceSeller, LegalForm, B2BCompany } from "./invoice";

export type SellerRequisiteEnv = "SELLER_CODE" | "SELLER_IBAN" | "SELLER_BANK" | "SELLER_ADDRESS";

export interface SellerRules {
  /** "ФОП Берчук Наталя Леонідівна" */
  legalName: string;
  /** Single tax group (1–3). */
  taxGroup: 1 | 2 | 3;
  vatPayer: boolean;
  /** Shown in the footer, offer and invoice: "2 група, без ПДВ". */
  taxNote: string;
  /** Tax group of receipt rows in Вчасно.Каса ("2" = without VAT); VCHASNO_TAXGRP overrides it. */
  receiptTaxGroup: string;
  requisitesEnv: SellerRequisiteEnv[];
}

/** data/knowledge_base/rules_fop.json */
export interface FopRules {
  about: string;
  updated: string;
  seller: SellerRules;
}
