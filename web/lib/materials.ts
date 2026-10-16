// Material catalogue: stencil sheets and blanks. The numbers (thickness, density, retail and
// wholesale rates, minimum price, availability) come from data/knowledge_base/materials.json;
// this file adds what the customer sees: names, colours, look and notes.
// null price = not priced yet («ціна за запитом»).
// Food-contact claims stay false until the supplier's documents are on file.

import type { LocalizedText, MaterialColour, MaterialOption, MaterialType } from "../types/customizer";
import { MACHINE_SHEET_MM, materialFacts } from "./knowledge-base/materials-knowledge";

export { MACHINE_SHEET_MM };

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export const COLOURS = {
  clear: { id: "clear", name: t("Прозорий", "Прозрачный", "Clear"), hex: "#eef6fb" },
  white: { id: "white", name: t("Білий", "Белый", "White"), hex: "#ffffff" },
  black: { id: "black", name: t("Чорний", "Чёрный", "Black"), hex: "#16181b" },
  gold: { id: "gold", name: t("Золото", "Золото", "Gold"), hex: "#d4af37" },
  silver: { id: "silver", name: t("Срібло", "Серебро", "Silver"), hex: "#c9d0d6" },
} satisfies Record<string, MaterialColour>;

type Numbers = Pick<MaterialOption,
  "id" | "use" | "thicknessMm" | "densityGcm3" | "baseSquareMeterPrice" | "wholesaleSquareMeterPrice" | "minPrice" | "cutFeeUah" | "costPerM2" | "available"
  | "foodSafe" | "magnetic" | "maxDimensionsMm">;

/** The numbers of a material from the knowledge base, in the shape of MaterialOption. */
function numbers(id: MaterialType): Numbers {
  const facts = materialFacts(id);
  return {
    id,
    use: facts.use,
    thicknessMm: facts.thicknessMm,
    densityGcm3: facts.densityGcm3,
    baseSquareMeterPrice: facts.retailPerM2,
    wholesaleSquareMeterPrice: facts.wholesalePerM2,
    minPrice: facts.minPrice,
    cutFeeUah: facts.cutFeeUah,
    costPerM2: facts.costPerM2,
    available: facts.available,
    foodSafe: false,
    magnetic: false,
    maxDimensionsMm: { width: MACHINE_SHEET_MM.width, height: MACHINE_SHEET_MM.height },
  };
}

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

/** Acrylic blank sheet of one colour; thickness and rates come from the knowledge base. */
function acrylicBlank(id: MaterialType, colour: AcrylicColour): MaterialOption {
  const facts = numbers(id);
  const mm = facts.thicknessMm;
  const thickness = String(mm).replace(".", ",");
  const [uk, ru, en] = ACRYLIC_NAME[colour];
  return {
    ...facts, name: t(`${uk} ${thickness} мм`, `${ru} ${thickness} мм`, `${en} ${mm} mm`),
    finish: "gloss", colours: [COLOURS[colour]], minLetterMm: 0, look: ACRYLIC_LOOK[colour], note: blankNote,
  };
}

export const MATERIALS: Record<MaterialType, MaterialOption> = {
  pet_thin: {
    ...numbers("pet_thin"), name: t("PET 0,5 мм", "PET 0,5 мм", "PET 0.5 mm"),
    finish: "clear", colours: [COLOURS.clear], minLetterMm: 8, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Гнучкий, щільно лягає на крем і піну", "Гибкий, плотно ложится на крем и пену", "Flexible, sits flat on cream and foam"),
  },
  pet_thick: {
    ...numbers("pet_thick"), name: t("PET товстий", "PET толстый", "Thick PET"),
    finish: "clear", colours: [COLOURS.clear], minLetterMm: 10, look: look("#e4f0ff", "#a9c2e0", 0.55, 0.8),
    note: t("Товщину і ціну уточнюємо", "Толщину и цену уточняем", "Thickness and price to be confirmed"),
  },
  polystyrene: {
    ...numbers("polystyrene"), name: t("Полістирол 1 мм", "Полистирол 1 мм", "Polystyrene 1 mm"),
    finish: "matte", colours: [COLOURS.white, COLOURS.black], minLetterMm: 10, look: look("#f5f6f7", "#c9ced4", 0.92, 0.35),
    note: t("Тримає форму, для фарби на стінах і металі", "Держит форму, для краски на стенах и металле", "Holds shape, for paint on walls and metal"),
  },
  acrylic: {
    ...numbers("acrylic"), name: t("Акрил 3 мм", "Акрил 3 мм", "Acrylic 3 mm"),
    finish: "clear", colours: [COLOURS.clear], minLetterMm: 15, look: look("#e2f7f1", "#9fd6c6", 0.5, 1),
    note: t("Жорсткий, для штукатурки і багаторазової роботи", "Жёсткий, для штукатурки и многоразовой работы", "Rigid, for plaster and repeated use"),
  },
  magnetic: {
    ...numbers("magnetic"), name: t("Магнітний лист 0,9 мм", "Магнитный лист 0,9 мм", "Magnetic sheet 0.9 mm"),
    magnetic: true, finish: "matte", colours: [COLOURS.black], minLetterMm: 12, look: look("#3a3d42", "#24272b", 1, 0.15),
    note: t("Тримається на металі без клею", "Держится на металле без клея", "Sticks to metal without glue"),
  },
  plywood: {
    ...numbers("plywood"), name: t("Фанера 3 мм", "Фанера 3 мм", "Plywood 3 mm"),
    finish: "matte", colours: [], minLetterMm: 15, look: look("#d9b98c", "#a87b4a", 1, 0.1),
    note: t("Для декору і багаторазових шаблонів", "Для декора и многоразовых шаблонов", "For decor and reusable templates"),
  },
  stainless_steel: {
    ...numbers("stainless_steel"), name: t("Нержавіюча сталь 0,5 мм", "Нержавеющая сталь 0,5 мм", "Stainless steel 0.5 mm"),
    finish: "matte", colours: [COLOURS.silver], minLetterMm: 8, look: look("#c9d0d6", "#8d969f", 1, 0.9),
    note: t("Для маркування фарбою тисячі разів", "Для маркировки краской тысячи раз", "For thousands of paint markings"),
  },

  // Acrylic sheets: retail and wholesale rates in the knowledge base (Денис 2026-10-10).
  acrylic_1_5: acrylicBlank("acrylic_1_5", "clear"),
  acrylic_2: acrylicBlank("acrylic_2", "clear"),
  acrylic_3: acrylicBlank("acrylic_3", "clear"),
  acrylic_4: acrylicBlank("acrylic_4", "clear"),
  acrylic_5: acrylicBlank("acrylic_5", "clear"),
  acrylic_6: acrylicBlank("acrylic_6", "clear"),
  acrylic_8: acrylicBlank("acrylic_8", "clear"),
  acrylic_10: acrylicBlank("acrylic_10", "clear"),
  acrylic_15: acrylicBlank("acrylic_15", "clear"),
  acrylic_black_2: acrylicBlank("acrylic_black_2", "black"),
  acrylic_black_3: acrylicBlank("acrylic_black_3", "black"),
  acrylic_black_10: acrylicBlank("acrylic_black_10", "black"),
  acrylic_white_2: acrylicBlank("acrylic_white_2", "white"),
  acrylic_white_3: acrylicBlank("acrylic_white_3", "white"),
  acrylic_white_5: acrylicBlank("acrylic_white_5", "white"),
  acrylic_color: {
    ...numbers("acrylic_color"), name: t("Кольоровий акрил 3 мм", "Цветной акрил 3 мм", "Coloured acrylic 3 mm"),
    finish: "gloss", colours: [], minLetterMm: 0, look: look("#f2b8c6", "#d98ea1", 0.85, 1),
    note: t("Палітру кольорів задаємо в адмінці", "Палитру цветов задаём в админке", "Colour palette is set in the admin"),
  },
  acrylic_mirror_2: {
    ...numbers("acrylic_mirror_2"), name: t("Дзеркальний акрил 2 мм", "Зеркальный акрил 2 мм", "Mirror acrylic 2 mm"),
    finish: "mirror", colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#d9dee3", "#9aa3ab", 1, 1), note: blankNote,
  },
  acrylic_mirror_3: {
    ...numbers("acrylic_mirror_3"), name: t("Дзеркальний акрил 3 мм", "Зеркальный акрил 3 мм", "Mirror acrylic 3 mm"),
    finish: "mirror", colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#d9dee3", "#8d969f", 1, 1), note: blankNote,
  },
  polystyrene_mirror_1: {
    ...numbers("polystyrene_mirror_1"), name: t("Дзеркальний полістирол 1 мм", "Зеркальный полистирол 1 мм", "Mirror polystyrene 1 mm"),
    finish: "mirror", colours: [COLOURS.gold, COLOURS.silver], minLetterMm: 0, look: look("#dfe3e7", "#a3abb3", 1, 1), note: blankNote,
  },
  pet_food_board: {
    ...numbers("pet_food_board"), name: t("PET 0,5 мм, підкладка під торт", "PET 0,5 мм, подложка под торт", "PET 0.5 mm cake board"),
    finish: "clear", colours: [COLOURS.clear], minLetterMm: 0, look: look("#e4f0ff", "#b9cde6", 0.55, 0.8),
    note: t("Підкладка під торт", "Подложка под торт", "Cake board"),
  },
  polystyrene_white_1: {
    ...numbers("polystyrene_white_1"), name: t("Полістирол 1 мм білий", "Полистирол 1 мм белый", "White polystyrene 1 mm"),
    finish: "matte", colours: [COLOURS.white], minLetterMm: 0, look: look("#f5f6f7", "#c9ced4", 0.95, 0.35),
    note: t("Жорсткий білий, під торт", "Жёсткий белый, под торт", "Rigid white, for cakes"),
  },
};

/** Materials a customer can order as a stencil right now. */
export function stencilMaterials(): MaterialOption[] {
  return Object.values(MATERIALS).filter((m) => m.use === "stencil" && m.available);
}

/** Materials for welded words and toppers (one solid piece, not a stencil). */
export const WELD_MATERIALS: MaterialType[] = ["acrylic_3", "acrylic_black_3", "acrylic_white_3", "acrylic_mirror_2", "acrylic_mirror_3", "polystyrene_mirror_1", "acrylic_color"];
