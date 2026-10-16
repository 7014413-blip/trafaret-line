// Shapes of the blanks configurator «/zahotovky» with their popular sizes. The sizes are the
// ones of the catalogue blank cards (catalog/data/products.json), so a size chip here and the
// same size on a card cost the same. A shape given by one size is priced by the square around
// it, as on the cards («5 см по більшій стороні»).

import type { BlankShape, BlankShapeId } from "../../types/blank";
import type { LocalizedText } from "../../types/customizer";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

const ROUND_CM = [3, 5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 50] as const;
const SIDE_CM = [3, 5, 8, 10, 12, 15, 20, 25, 30, 40, 50] as const;
const RECT_CM = [[10, 15], [15, 20], [14.8, 21], [20, 30], [21, 29.7], [30, 40], [29.7, 42], [40, 60]] as const;

export const BLANK_SHAPES: readonly BlankShape[] = [
  { id: "circle", name: t("Коло", "Круг", "Circle"), sizeMode: "diameter", sheetShape: "circle", presetsCm: ROUND_CM, aspect: 1 },
  { id: "square", name: t("Квадрат", "Квадрат", "Square"), sizeMode: "side", sheetShape: "rect", presetsCm: SIDE_CM, aspect: 1 },
  { id: "rounded-square", name: t("Квадрат із заокругленими кутами", "Квадрат со скруглёнными углами", "Rounded square"), sizeMode: "side", sheetShape: "rect", presetsCm: SIDE_CM, aspect: 1 },
  { id: "rect", name: t("Прямокутник", "Прямоугольник", "Rectangle"), sizeMode: "box", sheetShape: "rect", presetsCm: RECT_CM, aspect: 1.5 },
  { id: "oval", name: t("Овал", "Овал", "Oval"), sizeMode: "side", sheetShape: "oval", presetsCm: SIDE_CM, aspect: 0.7 },
  { id: "heart", name: t("Серце", "Сердце", "Heart"), sizeMode: "side", sheetShape: "heart", presetsCm: SIDE_CM, aspect: 0.9 },
  { id: "hexagon", name: t("Шестикутник", "Шестиугольник", "Hexagon"), sizeMode: "side", sheetShape: "rect", presetsCm: SIDE_CM, aspect: 0.866 },
  { id: "star", name: t("Зірка", "Звезда", "Star"), sizeMode: "side", sheetShape: "heart", presetsCm: SIDE_CM, aspect: 0.951 },
  { id: "cloud", name: t("Хмаринка", "Облачко", "Cloud"), sizeMode: "side", sheetShape: "oval", presetsCm: SIDE_CM, aspect: 0.65 },
  { id: "arch", name: t("Арка", "Арка", "Arch"), sizeMode: "side", sheetShape: "rect", presetsCm: SIDE_CM, aspect: 1.25 },
  { id: "drop", name: t("Крапля", "Капля", "Drop"), sizeMode: "side", sheetShape: "oval", presetsCm: SIDE_CM, aspect: 1.3 },
  { id: "wavy-circle", name: t("Коло з хвилястим краєм", "Круг с волнистым краем", "Scalloped circle"), sizeMode: "diameter", sheetShape: "circle", presetsCm: ROUND_CM, aspect: 1 },
];

const BY_ID = new Map<string, BlankShape>(BLANK_SHAPES.map((s) => [s.id, s]));

/** Shape by id, or undefined for an id the shop does not cut. */
export function findBlankShape(id: string): BlankShape | undefined {
  return BY_ID.get(id);
}

/** Shape by id; throws for an unknown id (designs that passed the reader). */
export function blankShape(id: BlankShapeId): BlankShape {
  const shape = BY_ID.get(id);
  if (!shape) throw new Error(`unknown blank shape ${id}`);
  return shape;
}
