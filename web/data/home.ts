// Home page content that is not in the catalogue: direction tabs, scenario chips and
// idea tiles, with their titles in every language. Categories and products come from
// Medusa (services/medusa-store.ts).

import type { Dictionary } from "../types/i18n";

type Title = Dictionary<string>;

export const DIRECTIONS: { title: Title; href: string }[] = [
  { title: { uk: "Свій напис", ru: "Своя надпись" }, href: "/konstruktor" },
  { title: { uk: "Вивіски", ru: "Вывески" }, href: "/vyvisky" },
  { title: { uk: "За вашим макетом", ru: "По вашему макету" }, href: "/na-zamovlennia" },
  { title: { uk: "Стіни", ru: "Стены" }, href: "/walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка" }, href: "/plaster" },
  { title: { uk: "Торти і кава", ru: "Торты и кофе" }, href: "/food" },
  { title: { uk: "Піксель і камуфляж", ru: "Пиксель и камуфляж" }, href: "/camo" },
  { title: { uk: "Новий рік", ru: "Новый год" }, href: "/holidays/novyi-rik" },
  { title: { uk: "Для бізнесу", ru: "Для бизнеса" }, href: "/business" },
  { title: { uk: "Заготовки", ru: "Заготовки" }, href: "/blanks" },
];

const img = (name: string) => `/demo/products/${name}.jpg`;

export const SCENARIOS: { title: Title; img: string; href: string }[] = [
  { title: { uk: "Стіни", ru: "Стены" }, img: img("mandala2"), href: "/walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка" }, img: img("treshchiny"), href: "/plaster" },
  { title: { uk: "Торти", ru: "Торты" }, img: img("tiramisu"), href: "/food/tort" },
  { title: { uk: "Весілля", ru: "Свадьба" }, img: img("justmarried"), href: "/holidays/vesillia" },
  { title: { uk: "Новий рік", ru: "Новый год" }, img: img("yolka"), href: "/holidays/novyi-rik" },
  { title: { uk: "Заготовки", ru: "Заготовки" }, img: img("zerkalo"), href: "/blanks" },
  { title: { uk: "Набори", ru: "Наборы" }, img: img("nabor"), href: "/camo/nabory" },
];

export const IDEAS: { title: Title; img: string; href: string; big?: boolean }[] = [
  { title: { uk: "Акцентна стіна у спальні", ru: "Акцентная стена в спальне" }, img: img("mandala"), href: "/walls/mandaly", big: true },
  { title: { uk: "Візерунок на меблях", ru: "Узор на мебели" }, img: img("kamysh"), href: "/walls/roslyny" },
  { title: { uk: "Фактурна штукатурка", ru: "Фактурная штукатурка" }, img: img("treshchiny"), href: "/plaster" },
  { title: { uk: "Торт з вашим написом", ru: "Торт с вашей надписью" }, img: img("tiramisu"), href: "/food/napysy" },
  { title: { uk: "Весільний декор", ru: "Свадебный декор" }, img: img("justmarried"), href: "/holidays/vesillia" },
];

/** Root categories shown as tabs of the product rail on the home page. */
export const RAIL_TABS: { title: Title; handle: string }[] = [
  { title: { uk: "Стіни", ru: "Стены" }, handle: "walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка" }, handle: "plaster" },
  { title: { uk: "Торти і кава", ru: "Торты и кофе" }, handle: "food" },
  { title: { uk: "Свята", ru: "Праздники" }, handle: "holidays" },
  { title: { uk: "Заготовки", ru: "Заготовки" }, handle: "blanks" },
];
