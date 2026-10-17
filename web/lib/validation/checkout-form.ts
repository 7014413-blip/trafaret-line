// Checkout form checks shown next to the fields (the server repeats them in tl-checkout).
// Field keys match the input ids "c-<key>", so the page can move focus to the first error
// (QA 2026-10-10, m6).

import type { B2BCompany } from "../../types/invoice";
import type { Locale } from "../../types/customizer";
import { CHECKOUT } from "../i18n/dictionaries/checkout";
import { tr } from "../i18n/translate";

export interface CheckoutFormValues {
  phone: string;
  name: string;
  city: string;
  wh: string;
  delivery: string;
  payment: string;
}

export type CheckoutFieldKey = "phone" | "name" | "city" | "wh" | "code";

/** Order of fields on the page: the first error in this order gets the focus. */
export const CHECKOUT_FIELD_ORDER: readonly CheckoutFieldKey[] = ["phone", "name", "city", "wh", "code"];

const digits = (v: string) => v.replace(/[\s()-]/g, "");

export function phoneOk(value: string): boolean {
  const v = digits(value);
  return /^\+?380\d{9}$/.test(v) || /^0\d{9}$/.test(v);
}

export function validateCheckout(form: CheckoutFormValues, company: B2BCompany, locale: Locale = "uk"): Partial<Record<CheckoutFieldKey, string>> {
  const t = tr(CHECKOUT, locale).errors;
  const errors: Partial<Record<CheckoutFieldKey, string>> = {};
  if (!phoneOk(form.phone)) errors.phone = t.phone;
  if (form.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = t.name;
  if (!form.city.trim()) errors.city = t.city;
  if (!form.wh.trim()) errors.wh = form.delivery === "np_courier" ? t.courierAddress : t.wh;
  if (form.payment === "invoice" && (!/^(\d{8}|\d{10})$/.test(company.code) || !company.name.trim())) {
    errors.code = t.code;
  }
  return errors;
}

/** First field with an error in page order, or null. */
export function firstErrorField(errors: Partial<Record<CheckoutFieldKey, string>>): CheckoutFieldKey | null {
  return CHECKOUT_FIELD_ORDER.find((key) => errors[key]) ?? null;
}
