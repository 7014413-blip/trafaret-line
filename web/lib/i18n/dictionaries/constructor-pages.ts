// Search titles and descriptions of the constructor pages, by the page path (without the
// language prefix). The page bodies are client components that read their own texts.

import type { Dictionary } from "../../../types/i18n";

export interface PageMetaText {
  title: string;
  description: string;
}

export type ConstructorPagePath = "/konstruktor" | "/konstruktor/polotno" | "/zahotovky";

export const CONSTRUCTOR_PAGES: Dictionary<Record<ConstructorPagePath, PageMetaText>> = {
  uk: {
    "/konstruktor": {
      title: "Свій напис на трафареті — конструктор з превʼю і ціною",
      description: "Впишіть текст, оберіть шрифт, розмір і матеріал. Перемички в літерах ставимо автоматично, ціна одразу. Виготовлення 3 робочі дні.",
    },
    "/konstruktor/polotno": {
      title: "Вільне полотно: кілька написів і фігур на одному трафареті",
      description: "Розставте написи, коло, зірку, серце або рамку на одному аркуші. Перемички ставимо автоматично, тонкі місця підсвічуємо, ціна одразу.",
    },
    "/zahotovky": {
      title: "Заготовки з акрилу, дзеркального пластику і PET у ваш розмір",
      description: "Кола, квадрати, серця, зірки, арки та інші форми з прозорого, кольорового і дзеркального акрилу, підкладки під торт з PET і полістиролу. Свій розмір, ціна за штуку одразу, опт від 10 шт.",
    },
  },
  ru: {
    "/konstruktor": {
      title: "Своя надпись на трафарете — конструктор с превью и ценой",
      description: "Впишите текст, выберите шрифт, размер и материал. Перемычки в буквах ставим автоматически, цена сразу. Изготовление 3 рабочих дня.",
    },
    "/konstruktor/polotno": {
      title: "Свободное полотно: несколько надписей и фигур на одном трафарете",
      description: "Расставьте надписи, круг, звезду, сердце или рамку на одном листе. Перемычки ставим автоматически, тонкие места подсвечиваем, цена сразу.",
    },
    "/zahotovky": {
      title: "Заготовки из акрила, зеркального пластика и PET в ваш размер",
      description: "Круги, квадраты, сердца, звёзды, арки и другие формы из прозрачного, цветного и зеркального акрила, подложки под торт из PET и полистирола. Свой размер, цена за штуку сразу, опт от 10 шт.",
    },
  },
};
