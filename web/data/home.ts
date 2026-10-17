// Home page content that is not in the catalogue: direction tabs, scenario chips and
// idea tiles, with their titles in every language. Categories and products come from
// Medusa (services/medusa-store.ts).

import type { Dictionary } from "../types/i18n";

type Title = Dictionary<string>;

export const DIRECTIONS: { title: Title; href: string }[] = [
  { title: { uk: "Свій напис", ru: "Своя надпись", en: "Your own text" }, href: "/konstruktor" },
  { title: { uk: "Вивіски", ru: "Вывески", en: "Signs" }, href: "/vyvisky" },
  { title: { uk: "За вашим макетом", ru: "По вашему макету", en: "From your design" }, href: "/na-zamovlennia" },
  { title: { uk: "Стіни", ru: "Стены", en: "Walls" }, href: "/walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка", en: "Plaster" }, href: "/plaster" },
  { title: { uk: "Торти і кава", ru: "Торты и кофе", en: "Cakes and coffee" }, href: "/food" },
  { title: { uk: "Піксель і камуфляж", ru: "Пиксель и камуфляж", en: "Pixel and camo" }, href: "/camo" },
  { title: { uk: "Новий рік", ru: "Новый год", en: "New Year" }, href: "/holidays/novyi-rik" },
  { title: { uk: "Для бізнесу", ru: "Для бизнеса", en: "For business" }, href: "/business" },
  { title: { uk: "Заготовки", ru: "Заготовки", en: "Blanks" }, href: "/blanks" },
];

const img = (name: string) => `/demo/products/${name}.jpg`;

export const SCENARIOS: { title: Title; img: string; href: string }[] = [
  { title: { uk: "Стіни", ru: "Стены", en: "Walls" }, img: img("mandala2"), href: "/walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка", en: "Plaster" }, img: img("treshchiny"), href: "/plaster" },
  { title: { uk: "Торти", ru: "Торты", en: "Cakes" }, img: img("tiramisu"), href: "/food/tort" },
  { title: { uk: "Весілля", ru: "Свадьба", en: "Weddings" }, img: img("justmarried"), href: "/holidays/vesillia" },
  { title: { uk: "Новий рік", ru: "Новый год", en: "New Year" }, img: img("yolka"), href: "/holidays/novyi-rik" },
  { title: { uk: "Заготовки", ru: "Заготовки", en: "Blanks" }, img: img("zerkalo"), href: "/blanks" },
  { title: { uk: "Набори", ru: "Наборы", en: "Sets" }, img: img("nabor"), href: "/camo/nabory" },
];

export const IDEAS: { title: Title; img: string; href: string; big?: boolean }[] = [
  { title: { uk: "Акцентна стіна у спальні", ru: "Акцентная стена в спальне", en: "Accent wall in the bedroom" }, img: img("mandala"), href: "/walls/mandaly", big: true },
  { title: { uk: "Візерунок на меблях", ru: "Узор на мебели", en: "Patterns on furniture" }, img: img("kamysh"), href: "/walls/roslyny" },
  { title: { uk: "Фактурна штукатурка", ru: "Фактурная штукатурка", en: "Textured plaster" }, img: img("treshchiny"), href: "/plaster" },
  { title: { uk: "Торт з вашим написом", ru: "Торт с вашей надписью", en: "A cake with your text" }, img: img("tiramisu"), href: "/food/napysy" },
  { title: { uk: "Весільний декор", ru: "Свадебный декор", en: "Wedding decor" }, img: img("justmarried"), href: "/holidays/vesillia" },
];

/** Root categories shown as tabs of the product rail on the home page. */
export const RAIL_TABS: { title: Title; handle: string }[] = [
  { title: { uk: "Стіни", ru: "Стены", en: "Walls" }, handle: "walls" },
  { title: { uk: "Штукатурка", ru: "Штукатурка", en: "Plaster" }, handle: "plaster" },
  { title: { uk: "Торти і кава", ru: "Торты и кофе", en: "Cakes and coffee" }, handle: "food" },
  { title: { uk: "Свята", ru: "Праздники", en: "Holidays" }, handle: "holidays" },
  { title: { uk: "Заготовки", ru: "Заготовки", en: "Blanks" }, handle: "blanks" },
];
