// Checks shown in the constructor before "Купити" (algoritm-konstruktora.md, step 6).
// Errors block the purchase, warnings only explain.

import type { DesignCheck, LocalizedText, MaterialOption, PricingConfig, SheetSize, VectorDesign } from "../../types/customizer";
import type { LaserConfig, StencilCutResult } from "../../types/geometry";
import { DEFAULT_LASER } from "../geometry/laser-config";
import { minCapHeightMm } from "../geometry/config";
import { piecesFor } from "./geometry";
import { DEFAULT_PRICING } from "./pricing";

const t = (uk: string, ru: string, en: string): LocalizedText => ({ uk, ru, en });

export function checkDesign(
  design: VectorDesign,
  sheet: SheetSize,
  material: MaterialOption,
  capHeightMm: number | undefined,
  cut: StencilCutResult | null,
  cfg: PricingConfig = DEFAULT_PRICING,
  laser: LaserConfig = DEFAULT_LASER,
): DesignCheck[] {
  const out: DesignCheck[] = [];

  if (!design.contours.length) {
    out.push({ code: "empty", level: "error", message: t("Додайте напис або файл", "Добавьте надпись или файл", "Add text or a file") });
  }

  // ТЗ v0.9 table 2: PET 15, polystyrene 20, acrylic 25 mm; a material may ask for more.
  const minCap = Math.max(material.minLetterMm, minCapHeightMm(material.id));
  if (capHeightMm != null && capHeightMm > 0 && capHeightMm < minCap) {
    const mm = capHeightMm.toFixed(0);
    // The width that gives the minimum letter height, rounded up to whole centimetres.
    const fixWidthMm = Math.ceil((sheet.widthMm * (minCap / capHeightMm)) / 10) * 10;
    out.push({
      code: "letter_too_small", level: "warning", fixWidthMm, message: t(
        `Літери ${mm} мм, для цього матеріалу краще від ${minCap} мм`,
        `Буквы ${mm} мм, для этого материала лучше от ${minCap} мм`,
        `Letters are ${mm} mm; ${minCap} mm or more cuts cleanly in this material`,
      ),
    });
  }

  if (design.contours.some((c) => !c.closed)) {
    out.push({ code: "open_contour", level: "error", message: t("У файлі є незамкнені контури", "В файле есть незамкнутые контуры", "The file has open contours") });
  }

  const pieces = piecesFor(sheet, material.maxDimensionsMm);
  if (pieces > 1) {
    const pct = Math.round(cfg.compositeSurcharge * 100);
    out.push({
      code: "sheet_too_big", level: "warning",
      message: t(`Буде складений з ${pieces} частин, +${pct}%`, `Будет составлен из ${pieces} частей, +${pct}%`, `Made of ${pieces} parts, +${pct}%`),
    });
  }

  if (cut) {
    const lost = cut.islands.filter((i) => !i.connected);
    if (lost.length) {
      out.push({
        code: "island_unbridged", level: "error", at: [lost[0].bbox.minX, lost[0].bbox.minY],
        message: t(
          `${lost.length} внутрішніх деталей не тримаються. Збільште літери або оберіть інший шрифт`,
          `${lost.length} внутренних деталей не держатся. Увеличьте буквы или выберите другой шрифт`,
          `${lost.length} inner parts are not held. Make the letters larger or pick another font`,
        ),
      });
    }
    const long = cut.bridges.filter((b) => b.lengthMm > laser.maxBridgeLengthMm);
    if (long.length) {
      out.push({
        code: "bridge_long", level: "warning", at: long[0].from,
        message: t(
          "Є довгі перемички, середина літер може прогинатися. Краще жорсткий матеріал",
          "Есть длинные перемычки, середина букв может прогибаться. Лучше жёсткий материал",
          "Some bridges are long, letter centres may bend. A rigid material is better",
        ),
      });
    }
    const thinMaterial = cut.thinZones.filter((z) => z.kind === "material");
    if (thinMaterial.length) {
      out.push({
        code: "thin_part", level: "warning", at: thinMaterial[0].at,
        message: t(
          `Тонкі місця між вирізами (до ${laser.minPartMm} мм): можуть зламатися. Збільште розмір або відстань між літерами`,
          `Тонкие места между вырезами (до ${laser.minPartMm} мм): могут сломаться. Увеличьте размер или расстояние между буквами`,
          `Thin material between cuts (under ${laser.minPartMm} mm) may break. Increase the size or the letter spacing`,
        ),
      });
    }
    const thinSlots = cut.thinZones.filter((z) => z.kind === "slot");
    if (thinSlots.length) {
      out.push({
        code: "thin_slot", level: "warning", at: thinSlots[0].at,
        message: t(
          `Дуже вузькі прорізи (до ${laser.minSlotMm} мм): фарба може не пройти`,
          `Очень узкие прорези (до ${laser.minSlotMm} мм): краска может не пройти`,
          `Very narrow slots (under ${laser.minSlotMm} mm): paint may not pass`,
        ),
      });
    }
  }
  return out;
}
