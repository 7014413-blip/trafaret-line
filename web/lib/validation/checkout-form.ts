// Checkout form checks shown next to the fields (the server repeats them in tl-checkout).
// Field keys match the input ids "c-<key>", so the page can move focus to the first error
// (QA 2026-10-10, m6).

import type { B2BCompany } from "../../types/invoice";

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

export function validateCheckout(form: CheckoutFormValues, company: B2BCompany): Partial<Record<CheckoutFieldKey, string>> {
  const errors: Partial<Record<CheckoutFieldKey, string>> = {};
  if (!phoneOk(form.phone)) errors.phone = "Введіть номер у форматі +380 XX XXX XX XX";
  if (form.name.trim().split(/\s+/).filter(Boolean).length < 2) errors.name = "Вкажіть імʼя і прізвище, як у паспорті для Нової пошти";
  if (!form.city.trim()) errors.city = "Вкажіть місто";
  if (!form.wh.trim()) errors.wh = form.delivery === "np_courier" ? "Вкажіть адресу доставки" : "Вкажіть відділення або поштомат";
  if (form.payment === "invoice" && (!/^(\d{8}|\d{10})$/.test(company.code) || !company.name.trim())) {
    errors.code = "Вкажіть код ЄДРПОУ або РНОКПП і назву для рахунку";
  }
  return errors;
}

/** First field with an error in page order, or null. */
export function firstErrorField(errors: Partial<Record<CheckoutFieldKey, string>>): CheckoutFieldKey | null {
  return CHECKOUT_FIELD_ORDER.find((key) => errors[key]) ?? null;
}
