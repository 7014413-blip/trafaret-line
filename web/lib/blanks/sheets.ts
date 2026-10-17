// Sheets the blanks configurator sells: material group → thickness → colour. Every option is a
// material of data/knowledge_base/materials.json (rate and cutting fee) in one colour; the
// colours are those of the catalogue blank cards. PET is described without food-contact
// claims until the supplier's documents are on file.

import type {
  BlankColour, BlankColourId, BlankMaterialGroup, BlankMaterialGroupId, BlankSheetOption,
} from "../../types/blank";
import type { Locale, LocalizedText, MaterialType } from "../../types/customizer";
import { MATERIALS } from "../materials";
import { BLANKS } from "../i18n/dictionaries/blanks";
import { decimal, units } from "../i18n/dictionaries/units";
import { tr } from "../i18n/translate";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export const BLANK_GROUPS: readonly BlankMaterialGroup[] = [
  { id: "clear", name: t("Прозорий акрил", "Прозрачный акрил", "Clear acrylic"), note: t("Від 1,5 до 15 мм, глянцевий з обох боків", "От 1,5 до 15 мм, глянцевый с обеих сторон", "1.5 to 15 mm, gloss on both sides") },
  { id: "coloured", name: t("Кольоровий акрил", "Цветной акрил", "Colored acrylic"), note: t("Чорний, молочний і яскраві кольори", "Чёрный, молочный и яркие цвета", "Black, opal white and bright colors") },
  { id: "mirror", name: t("Дзеркальний", "Зеркальный", "Mirror"), note: t("Акрил 2 і 3 мм або легкий полістирол 1 мм", "Акрил 2 и 3 мм или лёгкий полистирол 1 мм", "Acrylic 2 and 3 mm or light polystyrene 1 mm") },
  { id: "board", name: t("Підкладки під торт", "Подложки под торт", "Cake boards"), note: t("Прозорий PET 0,5 мм або білий полістирол 1 мм", "Прозрачный PET 0,5 мм или белый полистирол 1 мм", "Clear PET 0.5 mm or white polystyrene 1 mm") },
];

export const BLANK_COLOURS: Record<BlankColourId, BlankColour> = {
  clear: { id: "clear", name: t("Прозорий", "Прозрачный", "Clear"), hex: "#e2f2f7" },
  black: { id: "black", name: t("Чорний", "Чёрный", "Black"), hex: "#16181b" },
  milk: { id: "milk", name: t("Молочний", "Молочный", "Opal white"), hex: "#f4f5f2" },
  white: { id: "white", name: t("Білий", "Белый", "White"), hex: "#ffffff" },
  red: { id: "red", name: t("Червоний", "Красный", "Red"), hex: "#c8102e" },
  pink: { id: "pink", name: t("Рожевий", "Розовый", "Pink"), hex: "#f4a6c0" },
  blue: { id: "blue", name: t("Синій", "Синий", "Blue"), hex: "#1f4e9c" },
  green: { id: "green", name: t("Зелений", "Зелёный", "Green"), hex: "#2e8b57" },
  yellow: { id: "yellow", name: t("Жовтий", "Жёлтый", "Yellow"), hex: "#f5c400" },
  gold: { id: "gold", name: t("Золото", "Золото", "Gold"), hex: "#c9a23a", shine: "#f3e2a4" },
  silver: { id: "silver", name: t("Срібло", "Серебро", "Silver"), hex: "#a9b1b8", shine: "#eef1f3" },
  rose: { id: "rose", name: t("Рожеве золото", "Розовое золото", "Rose gold"), hex: "#c98f7f", shine: "#f3d6cc" },
};

const sheet = (group: BlankMaterialGroupId, materialId: MaterialType, colourId: BlankColourId): BlankSheetOption => ({ group, materialId, colourId });

export const BLANK_SHEETS: readonly BlankSheetOption[] = [
  ...(["acrylic_1_5", "acrylic_2", "acrylic_3", "acrylic_4", "acrylic_5", "acrylic_6", "acrylic_8", "acrylic_10", "acrylic_15"] as const)
    .map((id) => sheet("clear", id, "clear")),
  sheet("coloured", "acrylic_black_2", "black"),
  sheet("coloured", "acrylic_white_2", "milk"),
  sheet("coloured", "acrylic_black_3", "black"),
  sheet("coloured", "acrylic_white_3", "milk"),
  ...(["red", "pink", "blue", "green", "yellow"] as const).map((c) => sheet("coloured", "acrylic_color", c)),
  sheet("coloured", "acrylic_white_5", "milk"),
  sheet("coloured", "acrylic_black_10", "black"),
  sheet("mirror", "polystyrene_mirror_1", "gold"),
  sheet("mirror", "polystyrene_mirror_1", "silver"),
  sheet("mirror", "acrylic_mirror_2", "gold"),
  sheet("mirror", "acrylic_mirror_2", "silver"),
  sheet("mirror", "acrylic_mirror_3", "gold"),
  sheet("mirror", "acrylic_mirror_3", "silver"),
  sheet("mirror", "acrylic_mirror_3", "rose"),
  sheet("board", "pet_food_board", "clear"),
  sheet("board", "polystyrene_white_1", "white"),
];

/** The sheet of this material in this colour, or undefined when the shop does not sell it. */
export function findBlankSheet(materialId: string, colourId: string): BlankSheetOption | undefined {
  return BLANK_SHEETS.find((s) => s.materialId === materialId && s.colourId === colourId && onSale(s));
}

const onSale = (s: BlankSheetOption) => MATERIALS[s.materialId].available;
const mmOf = (s: BlankSheetOption) => MATERIALS[s.materialId].thicknessMm;

/** Thicknesses of a group, mm, in the order of the list. */
export function blankThicknesses(group: BlankMaterialGroupId): number[] {
  return [...new Set(BLANK_SHEETS.filter((s) => s.group === group && onSale(s)).map(mmOf))];
}

/** Sheets of a group at one thickness: one per colour (black, opal white and bright colours of 3 mm acrylic are different sheets). */
export function blankSheetsAt(group: BlankMaterialGroupId, thicknessMm: number): BlankSheetOption[] {
  return BLANK_SHEETS.filter((s) => s.group === group && onSale(s) && mmOf(s) === thicknessMm);
}

/** The sheet of a group at a thickness in this colour, or in the first colour when there is no such one. */
export function blankSheetAt(group: BlankMaterialGroupId, thicknessMm: number, colourId: BlankColourId): BlankSheetOption {
  const sheets = blankSheetsAt(group, thicknessMm);
  const found = sheets.find((s) => s.colourId === colourId) ?? sheets[0];
  if (!found) throw new Error(`no blank sheet of ${group} ${thicknessMm} mm`);
  return found;
}

/** First choice in another group: the same thickness and colour when the group has them. */
export function blankSheetInGroup(group: BlankMaterialGroupId, current: BlankSheetOption): BlankSheetOption {
  const thicknesses = blankThicknesses(group);
  const mm = mmOf(current);
  return blankSheetAt(group, thicknesses.includes(mm) ? mm : thicknesses[0], current.colourId);
}

/** Chip label of a thickness: "3 мм" for acrylic, with the material where a group mixes materials. */
export function blankThicknessLabel(group: BlankMaterialGroupId, thicknessMm: number, locale: Locale = "uk"): string {
  const mm = `${decimal(thicknessMm, locale)} ${units(locale).mm}`;
  const material = blankSheetsAt(group, thicknessMm)[0]?.materialId ?? "";
  const { acrylicWord: acrylic, polystyreneWord: polystyrene } = tr(BLANKS, locale);
  if (group === "mirror") return material.startsWith("polystyrene") ? `${mm}, ${polystyrene}` : `${mm}, ${acrylic}`;
  if (group === "board") return material === "pet_food_board" ? `PET ${mm}` : `${polystyrene.charAt(0).toUpperCase()}${polystyrene.slice(1)} ${mm}`;
  return mm;
}

/** Customer name of a sheet: «Акрил 3 мм, прозорий», «Дзеркальний акрил 3 мм, рожеве золото». */
export function blankSheetName(materialId: MaterialType, colourId: BlankColourId, locale: Locale = "uk"): string {
  const name = MATERIALS[materialId].name[locale];
  const colour = BLANK_COLOURS[colourId].name[locale].toLowerCase();
  return name.toLowerCase().includes(colour) ? name : `${name}, ${colour}`;
}
