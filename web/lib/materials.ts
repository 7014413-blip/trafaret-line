// Material catalogue: stencil sheets and blanks. Rates are the owner's numbers
// (stencils 2026-10-08, acrylic blanks 2026-10-10 with wholesale rates) and the ТЗ table; in production the same
// values are edited in the Medusa admin. null price = not priced yet («ціна за запитом»).
// Food-contact claims stay false until the supplier's documents are on file.

import type { LocalizedText, MaterialColour, MaterialOption, MaterialType } from "../types/customizer";

/** Laser bed, mm. Larger stencils are cut in several parts (composite). */
export const MACHINE_SHEET_MM = { width: 1400, height: 2000 } as const;

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export const COLOURS = {
  clear: { id: "clear", name: t("Прозорий", "Прозрачный", "Clear"), hex: "#eef6fb" },
  white: { id: "white", name: t("Білий", "Белый", "White"), hex: "#ffffff" },
  black: { id: "black", name: t("Чорний", "Чёрный", "Black"), hex: "#16181b" },
  gold: { id: "gold", name: t("Золото", "Золото", "Gold"), hex: "#d4af37" },
  silver: { id: "silver", name: t("Срібло", "Серебро", "Silver"), hex: "#c9d0d6" },
} satisfies Record<string, MaterialColour>;

type Base = Pick<MaterialOption, "costPerM2" | "foodSafe" | "magnetic" | "maxDimensionsMm" | "available" | "wholesaleSquareMeterPrice">;

const base: Base = {
  costPerM2: null,
  foodSafe: false,
  magnetic: false,
  maxDimensionsMm: { width: MACHINE_SHEET_MM.width, height: MACHINE_SHEET_MM.height },
  available: true,
  wholesaleSquareMeterPrice: null,
};

const look = (face: string, edge: string, opacity: number, gloss: number) => ({ face, edge, opacity, gloss });
const blankNote = t("Заготовка", "Заготовка", "Blank");

type AcrylicColour = "clear" | "black" | "white";
const ACRYLIC_NAME: Record<AcrylicColour, [string, string, string]> = {
  clear: ["Акрил", "Акрил", "Acrylic"],
  black: ["Чорний акрил", "Чёрный акрил", "Black acrylic"],
  white: ["Молочний акрил", "Молочный акрил", "Opal white acrylic"],
};
const ACRYLIC_LOOK: Record<AcrylicColour, ReturnType<typeof look>> = {
  clear: look("#e2f7f1", "#9fd6c6", 0.5, 1),
  black: look("#16181b", "#3a3d42", 1, 1),
  white: look("#f8fafc", "#d4dbe2", 0.95, 0.9),
};

/** Acrylic blank sheet of one colour and thickness with retail and wholesale rates, UAH/m². */
function acrylicBlank(id: MaterialType, colour: AcrylicColour, mm: number, retail: number, wholesale: number): MaterialOption {
  const thickness = String(mm).replace(".", ",");
  const [uk, ru, en] = ACRYLIC_NAME[colour];
  return {
    ...base, id, use: "blank", name: t(`${uk} ${thickness} мм`, `${ru} ${thickness} мм`, `${en} ${mm} mm`),
    thicknessMm: mm, densityGcm3: 1.19, baseSquareMeterPrice: retail, wholesaleSquareMeterPrice: wholesale, minPrice: 0,
    finish: "gloss", colours: [COLOURS[colour]], minLetterMm: 0, look: ACRYLIC_LOOK[colour], note: blankNote,
  };
}

export const MATERIALS: Record<MaterialType, MaterialOption> = {
  pet_thin: {
    ...base, id: "pet_thin", use: "stencil", name: t("PET 0,5 мм", "PET 0,5 мм", "PET 0.5 mm"),
    thicknessMm: 0.5, densityGcm3: 1.38, baseSquareMeterPrice: 2200, minPrice: 150, finish: "clear",
    colours: [COLOURS.clear], minLetterMm: 8, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Гнучкий, щільно лягає на крем і піну", "Гибкий, плотно ложится на крем и пену", "Flexible, sits flat on cream and foam"),
  },
  pet_thick: {
    ...base, id: "pet_thick", use: "stencil", name: t("PET товстий", "PET толстый", "Thick PET"),
    thicknessMm: 1, densityGcm3: 1.38, baseSquareMeterPrice: null, minPrice: 150, finish: "clear",
    colours: [COLOURS.clear], minLetterMm: 10, look: look("#e4f0ff", "#a9c2e0", 0.55, 0.8),
    note: t("Товщину і ціну уточнюємо", "Толщину и цену уточняем", "Thickness and price to be confirmed"), available: false,
  },
  polystyrene: {
    ...base, id: "polystyrene", use: "stencil", name: t("Полістирол 1 мм", "Полистирол 1 мм", "Polystyrene 1 mm"),
    thicknessMm: 1, densityGcm3: 1.05, baseSquareMeterPrice: 2300, minPrice: 150, finish: "matte",
    colours: [COLOURS.white, COLOURS.black], minLetterMm: 10, look: look("#f5f6f7", "#c9ced4", 0.92, 0.35),
    note: t("Тримає форму, для фарби на стінах і металі", "Держит форму, для краски на стенах и металле", "Holds shape, for paint on walls and metal"),
  },
  acrylic: {
    ...base, id: "acrylic", use: "stencil", name: t("Акрил 3 мм", "Акрил 3 мм", "Acrylic 3 mm"),
    thicknessMm: 3, densityGcm3: 1.19, baseSquareMeterPrice: 4000, minPrice: 250, finish: "clear",
    colours: [COLOURS.clear], minLetterMm: 15, look: look("#e2f7f1", "#9fd6c6", 0.5, 1),
    note: t("Жорсткий, для штукатурки і багаторазової роботи", "Жёсткий, для штукатурки и многоразовой работы", "Rigid, for plaster and repeated use"),
  },
  magnetic: {
    ...base, id: "magnetic", use: "stencil", name: t("Магнітний лист 0,9 мм", "Магнитный лист 0,9 мм", "Magnetic sheet 0.9 mm"),
    thicknessMm: 0.9, densityGcm3: 3.6, baseSquareMeterPrice: null, minPrice: 150, magnetic: true, finish: "matte",
    colours: [COLOURS.black], minLetterMm: 12, look: look("#3a3d42", "#24272b", 1, 0.15),
    note: t("Тримається на металі без клею", "Держится на металле без клея", "Sticks to metal without glue"), available: false,
  },
  plywood: {
    ...base, id: "plywood", use: "stencil", name: t("Фанера 3 мм", "Фанера 3 мм", "Plywood 3 mm"),
    thicknessMm: 3, densityGcm3: 0.65, baseSquareMeterPrice: null, minPrice: 150, finish: "matte",
    colours: [], minLetterMm: 15, look: look("#d9b98c", "#a87b4a", 1, 0.1),
    note: t("Для декору і багаторазових шаблонів", "Для декора и многоразовых шаблонов", "For decor and reusable templates"), available: false,
  },
  stainless_steel: {
    ...base, id: "stainless_steel", use: "stencil", name: t("Нержавіюча сталь 0,5 мм", "Нержавеющая сталь 0,5 мм", "Stainless steel 0.5 mm"),
    thicknessMm: 0.5, densityGcm3: 7.9, baseSquareMeterPrice: null, minPrice: 500, finish: "matte",
    colours: [COLOURS.silver], minLetterMm: 8, look: look("#c9d0d6", "#8d969f", 1, 0.9),
    note: t("Для маркування фарбою тисячі разів", "Для маркировки краской тысячи раз", "For thousands of paint markings"), available: false,
  },

  // Acrylic sheets, Денис 2026-10-10: retail / wholesale UAH per m² (wholesale for approved wholesalers).
  acrylic_1_5: acrylicBlank("acrylic_1_5", "clear", 1.5, 1950, 1700),
  acrylic_2: acrylicBlank("acrylic_2", "clear", 2, 2300, 2100),
  acrylic_3: acrylicBlank("acrylic_3", "clear", 3, 2990, 2830),
  acrylic_4: acrylicBlank("acrylic_4", "clear", 4, 4300, 4100),
  acrylic_5: acrylicBlank("acrylic_5", "clear", 5, 5200, 4900),
  acrylic_6: acrylicBlank("acrylic_6", "clear", 6, 6500, 6240),
  acrylic_8: acrylicBlank("acrylic_8", "clear", 8, 8800, 8410),
  acrylic_10: acrylicBlank("acrylic_10", "clear", 10, 12000, 11000),
  acrylic_15: acrylicBlank("acrylic_15", "clear", 15, 20000, 18400),
  acrylic_black_2: acrylicBlank("acrylic_black_2", "black", 2, 3300, 3000),
  acrylic_black_3: acrylicBlank("acrylic_black_3", "black", 3, 4700, 4000),
  acrylic_black_10: acrylicBlank("acrylic_black_10", "black", 10, 14000, 12890),
  acrylic_white_2: acrylicBlank("acrylic_white_2", "white", 2, 3200, 3000),
  acrylic_white_3: acrylicBlank("acrylic_white_3", "white", 3, 4450, 4000),
  acrylic_white_5: acrylicBlank("acrylic_white_5", "white", 5, 6000, 5670),
  acrylic_color: {
    ...base, id: "acrylic_color", use: "blank", name: t("Кольоровий акрил 3 мм", "Цветной акрил 3 мм", "Coloured acrylic 3 mm"),
    thicknessMm: 3, densityGcm3: 1.19, baseSquareMeterPrice: 4000, wholesaleSquareMeterPrice: 3500, minPrice: 0, finish: "gloss",
    colours: [], minLetterMm: 0, look: look("#f2b8c6", "#d98ea1", 0.85, 1),
    note: t("Палітру кольорів задаємо в адмінці", "Палитру цветов задаём в админке", "Colour palette is set in the admin"),
  },  acrylic_mirror_2: {
    ...base, id: "acrylic_mirror_2", use: "blank", name: t("Дзеркальний акрил 2 мм", "Зеркальный акрил 2 мм", "Mirror acrylic 2 mm"),
    thicknessMm: 2, densityGcm3: 1.19, baseSquareMeterPrice: 5600, minPrice: 0, finish: "mirror",
    colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#d9dee3", "#9aa3ab", 1, 1), note: blankNote,
  },
  acrylic_mirror_3: {
    ...base, id: "acrylic_mirror_3", use: "blank", name: t("Дзеркальний акрил 3 мм", "Зеркальный акрил 3 мм", "Mirror acrylic 3 mm"),
    thicknessMm: 3, densityGcm3: 1.19, baseSquareMeterPrice: 8200, minPrice: 0, finish: "mirror",
    colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#d9dee3", "#8d969f", 1, 1), note: blankNote,
  },
  polystyrene_mirror_1: {
    ...base, id: "polystyrene_mirror_1", use: "blank", name: t("Дзеркальний полістирол 1 мм", "Зеркальный полистирол 1 мм", "Mirror polystyrene 1 mm"),
    thicknessMm: 1, densityGcm3: 1.05, baseSquareMeterPrice: 3600, minPrice: 0, finish: "mirror",
    colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#dfe3e7", "#a3abb3", 1, 1), note: blankNote,
  },
  pet_food_board: {
    ...base, id: "pet_food_board", use: "blank", name: t("PET 0,5 мм, підкладка під торт", "PET 0,5 мм, подложка под торт", "PET 0.5 mm cake board"),
    thicknessMm: 0.5, densityGcm3: 1.38, baseSquareMeterPrice: 1800, minPrice: 0, finish: "clear",
    colours: [COLOURS.clear], minLetterMm: 0, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Підкладка під торт", "Подложка под торт", "Cake board"),
  },
};

/** Materials a customer can order as a stencil right now. */
export function stencilMaterials(): MaterialOption[] {
  return Object.values(MATERIALS).filter((m) => m.use === "stencil" && m.available);
}

/** Materials for welded words and toppers (one solid piece, not a stencil). */
export const WELD_MATERIALS: MaterialType[] = ["acrylic_3", "acrylic_black_3", "acrylic_white_3", "acrylic_mirror_2", "acrylic_mirror_3", "polystyrene_mirror_1", "acrylic_color"];
