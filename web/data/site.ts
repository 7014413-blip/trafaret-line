// Company data (from topperok.com.ua, 2026-10-09). Edited here until the CMS settings page exists.
// The seller and tax status come from data/knowledge_base/rules_fop.json.

import { SELLER } from "../lib/knowledge-base/seller-rules";
import type { Dictionary } from "../types/i18n";

export interface SiteTexts {
  hours: string;
  managerName: string;
  /** «Подзвонити Наталі» / «Позвонить Наталье». */
  managerNameDative: string;
  branches: { city: string; address: string; note: string }[];
}

/** Company data that is written differently in each language of the site. */
export const SITE_TEXT: Dictionary<SiteTexts> = {
  uk: {
    hours: "Пн–Пт 9:00–18:00",
    managerName: "Наталя",
    managerNameDative: "Наталі",
    branches: [
      { city: "Бориспіль", address: "вул. Гостинна, 46", note: "виробництво і відправка" },
      { city: "Запоріжжя", address: "адресу уточнюємо", note: "відправка" },
    ],
  },
  ru: {
    hours: "Пн–Пт 9:00–18:00",
    managerName: "Наталья",
    managerNameDative: "Наталье",
    branches: [
      { city: "Борисполь", address: "ул. Гостинная, 46", note: "производство и отправка" },
      { city: "Запорожье", address: "адрес уточняем", note: "отправка" },
    ],
  },
  en: {
    hours: "Mon–Fri 9:00–18:00",
    managerName: "Natalia",
    managerNameDative: "Natalia",
    branches: [
      { city: "Boryspil", address: "46 Hostynna St", note: "production and shipping" },
      { city: "Zaporizhzhia", address: "address to be confirmed", note: "shipping" },
    ],
  },
};

export const SITE = {
  name: "Trafaret Line",
  domain: "trafaret-line.com.ua",
  phone: "+38 066 281 97 20",
  phoneHref: "+380662819720",
  email: "1@topperok.com.ua", // shared mailbox with topperok.com.ua until a trafaret-line.com.ua mailbox is created
  hours: SITE_TEXT.uk.hours,
  viber: "viber://chat?number=+380662819720",
  // Manager the customer calls in one tap (header, contacts, consultant chat; plan step 8.7).
  // [default, Claude 2026-10-16] the shop number until Денис gives Наталя's own.
  manager: { name: SITE_TEXT.uk.managerName, nameDative: SITE_TEXT.uk.managerNameDative, phone: "+38 066 281 97 20", phoneHref: "+380662819720" },
  branches: SITE_TEXT.uk.branches,
  social: {
    instagram: "https://instagram.com/topper_ok",
    facebook: "https://www.facebook.com/profile.php?id=61577099064437",
    tiktok: "https://tiktok.com/@topperok",
    youtube: "https://youtube.com/@topperok",
  },
  legal: SELLER.legalName,
  tax: SELLER.taxNote,
};
