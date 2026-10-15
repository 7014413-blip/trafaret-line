// Company data (from topperok.com.ua, 2026-10-09). Edited here until the CMS settings page exists.
// The seller and tax status come from data/knowledge_base/rules_fop.json.

import { SELLER } from "../lib/knowledge-base/seller-rules";

export const SITE = {
  name: "Trafaret Line",
  domain: "trafaret-line.com.ua",
  phone: "+38 066 281 97 20",
  phoneHref: "+380662819720",
  email: "1@topperok.com.ua", // shared mailbox with topperok.com.ua until a trafaret-line.com.ua mailbox is created
  hours: "Пн–Пт 9:00–18:00",
  viber: "viber://chat?number=+380662819720",
  branches: [
    { city: "Бориспіль", address: "вул. Гостинна, 46", note: "виробництво і відправка" },
    { city: "Запоріжжя", address: "адресу уточнюємо", note: "відправка" },
  ],
  social: {
    instagram: "https://instagram.com/topper_ok",
    facebook: "https://www.facebook.com/profile.php?id=61577099064437",
    tiktok: "https://tiktok.com/@topperok",
    youtube: "https://youtube.com/@topperok",
  },
  legal: SELLER.legalName,
  tax: SELLER.taxNote,
};
