// Home page content that is not in the catalogue: direction tabs, scenario chips and
// idea tiles. Categories and products come from Medusa (services/medusa-store.ts).

export const DIRECTIONS = [
  { title: "Свій напис", href: "/konstruktor" },
  { title: "Вивіски", href: "/vyvisky" },
  { title: "За вашим макетом", href: "/na-zamovlennia" },
  { title: "Стіни", href: "/walls" },
  { title: "Штукатурка", href: "/plaster" },
  { title: "Торти і кава", href: "/food" },
  { title: "Піксель і камуфляж", href: "/camo" },
  { title: "Новий рік", href: "/holidays/novyi-rik" },
  { title: "Для бізнесу", href: "/business" },
  { title: "Заготовки", href: "/blanks" },
];

const img = (name: string) => `/demo/products/${name}.jpg`;

export const SCENARIOS = [
  { title: "Стіни", img: img("mandala2"), href: "/walls" },
  { title: "Штукатурка", img: img("treshchiny"), href: "/plaster" },
  { title: "Торти", img: img("tiramisu"), href: "/food/tort" },
  { title: "Весілля", img: img("justmarried"), href: "/holidays/vesillia" },
  { title: "Новий рік", img: img("yolka"), href: "/holidays/novyi-rik" },
  { title: "Заготовки", img: img("zerkalo"), href: "/blanks" },
  { title: "Набори", img: img("nabor"), href: "/camo/nabory" },
];

export const IDEAS = [
  { title: "Акцентна стіна у спальні", img: img("mandala"), href: "/walls/mandaly", big: true },
  { title: "Візерунок на меблях", img: img("kamysh"), href: "/walls/roslyny" },
  { title: "Фактурна штукатурка", img: img("treshchiny"), href: "/plaster" },
  { title: "Торт з вашим написом", img: img("tiramisu"), href: "/food/napysy" },
  { title: "Весільний декор", img: img("justmarried"), href: "/holidays/vesillia" },
];

/** Root categories shown as tabs of the product rail on the home page. */
export const RAIL_TABS: { title: string; handle: string }[] = [
  { title: "Стіни", handle: "walls" },
  { title: "Штукатурка", handle: "plaster" },
  { title: "Торти і кава", handle: "food" },
  { title: "Свята", handle: "holidays" },
  { title: "Заготовки", handle: "blanks" },
];
