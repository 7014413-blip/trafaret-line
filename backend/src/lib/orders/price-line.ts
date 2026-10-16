// Price and title of one order line, recomputed on the server from what the browser sent (QA
// 2026-10-10, M9): catalogue variants from the database, constructor designs re-read field by
// field and priced with the shared pricing code. Used by the checkout and by «Повторити
// замовлення» in the cabinet (today's price of a past line).

import { MATERIALS } from "../../shared/lib/materials";
import { priceCatalogVariant, priceStencil, priceWelded } from "../../shared/lib/calculators/pricing";
import { priceSign } from "../../shared/lib/calculators/signage";
import { pricePointerSign } from "../../shared/lib/pointer-sign/price";
import { readPointerSignDesign } from "../../shared/lib/pointer-sign/read-design";
import { findPlaquePlate } from "../../shared/lib/office-plaque/colours";
import { priceOfficePlaque } from "../../shared/lib/office-plaque/price";
import { readOfficePlaqueDesign } from "../../shared/lib/office-plaque/read-design";
import { findJoinedWordsMaterial } from "../../shared/lib/joined-words/find-material";
import { priceJoinedWordsDesign } from "../../shared/lib/joined-words/price-design";
import { readJoinedWordsDesign } from "../../shared/lib/joined-words/read-design";
import { loadFontById } from "../text/node-fonts";
import { LAYERED_PLAQUE_CONFIGS } from "../../shared/lib/layered-plaque/configs";
import { priceLayeredPlaque } from "../../shared/lib/layered-plaque/price";
import { readLayeredPlaqueDesign } from "../../shared/lib/layered-plaque/read-design";
import { priceInitialsDesign } from "../../shared/lib/initials/price-design";
import { readInitialsDesign } from "../../shared/lib/initials/read-design";
import { priceStickLettersDesign } from "../../shared/lib/stick-letters/price-design";
import { readStickLettersDesign } from "../../shared/lib/stick-letters/read-design";
import { priceBlankDesign } from "../../shared/lib/blanks/price";
import { readBlankDesign } from "../../shared/lib/blanks/read-design";
import { blankTitle } from "../../shared/lib/blanks/title";
import type { OrderLineInput } from "../../shared/types/order";
import {
  readMarginMm, readTextSpec, readWeldOptions, SIZE_TOLERANCE_MM, SpecError, stencilHeightMm, weldedSizeMm,
} from "../validation/constructor-size";
import { checkHole } from "../../shared/lib/catalog/check-hole";
import { readHoleRules } from "../../shared/lib/catalog/hole-rules";
import type { HolePosition, HoleSpec } from "../../shared/types/hole";
import type { PricedLine, VariantPrice } from "../../types/order-pricing";
import { cleanText } from "./clean-text";

// Accessories with fixed prices (admin setting).
export const ACCESSORIES: Record<string, { title: string; price: number }> = {
  "upsell-valyk": { title: "Валик поролоновий 10 см", price: 85 },
  "upsell-klei": { title: "Клей-спрей для фіксації", price: 220 },
};

const cm = (mm: number) => (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });

const HOLE_PLACE: Record<HolePosition, string> = { top: "зверху", bottom: "знизу", left: "зліва", right: "справа", center: "по центру" };

/**
 * Blanks with a hole choice: the hole from the browser is checked again for the circle of the
 * paid variant and replaced by the server's own result, so production gets checked sizes only.
 */
function checkedHole(variant: VariantPrice, spec: Record<string, unknown> | null | undefined): HoleSpec | null {
  const rules = readHoleRules(variant.hole as Parameters<typeof readHoleRules>[0]);
  if (!rules) return null;
  if (!variant.sheetMm) throw new Error("hole product variant without a size");
  const sent = spec?.hole as { position?: unknown; diameterMm?: unknown } | null | undefined;
  if (!sent || typeof sent.position !== "string" || typeof sent.diameterMm !== "number") throw new SpecError("hole missing");
  const check = checkHole({ position: sent.position as HolePosition, diameterMm: String(sent.diameterMm) }, variant.sheetMm[0], rules);
  if (!check.spec) throw new SpecError(`hole rejected: ${check.error}`);
  return check.spec;
}

export function priceLine(line: OrderLineInput, variants: Map<string, VariantPrice>): PricedLine {
  if (line.kind === "catalog") {
    const variant = line.variantId ? variants.get(line.variantId) : undefined;
    if (!variant) throw new Error(`variant ${line.variantId} is not on sale`);
    const hole = checkedHole(variant, line.spec);
    if (hole) {
      const diameter = String(hole.diameterMm).replace(".", ",");
      return {
        title: `${variant.title}, отвір Ø${diameter} мм ${HOLE_PLACE[hole.position]}`,
        unitPrice: priceCatalogVariant(variant.price, line.quantity),
        spec: { ...line.spec, hole },
      };
    }
    return { title: variant.title, unitPrice: priceCatalogVariant(variant.price, line.quantity) };
  }
  if (line.kind === "accessory") {
    const accessory = ACCESSORIES[line.key];
    if (!accessory) throw new Error(`unknown accessory ${line.key}`);
    return { title: accessory.title, unitPrice: accessory.price };
  }
  if (line.kind === "sign") {
    if (!line.sign) throw new Error("sign design missing");
    const label = cleanText(line.title);
    return { title: label ? (label.startsWith("Вивіска") ? label : `Вивіска: ${label}`) : "Вивіска з акрилу", unitPrice: priceSign({ ...line.sign, quantity: line.quantity }).unitPrice };
  }
  if (line.kind === "pointer") {
    // Pointer sign: the design is re-read field by field and priced here (fixed sizes at
    // Денис's prices, custom sizes by the sign rate); the logo goes to the manager for a check.
    const design = readPointerSignDesign(line.pointer, line.quantity);
    const texts = cleanText(design.lines.map((l) => l.text).filter(Boolean).join(" / "));
    return {
      title: `Табличка-вказівник${texts ? ` «${texts}»` : ""}, ${cm(design.widthMm)}×${cm(design.heightMm)} см`,
      unitPrice: pricePointerSign(design).unitPrice,
    };
  }
  if (line.kind === "plaque") {
    // Office plaque: the design is re-read field by field and priced here by its size.
    const design = readOfficePlaqueDesign(line.plaque, line.quantity);
    const texts = cleanText(design.lines.map((l) => l.text).filter(Boolean).join(" / "));
    return {
      title: `Офісна табличка «${texts}», ${cm(design.widthMm)}×${cm(design.heightMm)} см, ${findPlaquePlate(design.plateColourId).name.uk.toLowerCase()}`,
      unitPrice: priceOfficePlaque(design).unitPrice,
    };
  }
  if (line.kind === "layered") {
    // Two-layer floor, door and number plaques: re-read and priced here by size and series.
    const design = readLayeredPlaqueDesign(line.layered, line.quantity);
    const cfg = LAYERED_PLAQUE_CONFIGS[design.kind];
    const price = priceLayeredPlaque(design, cfg);
    const texts = cleanText(design.lines.map((l, i) => (design.series && i === cfg.seriesLine ? `${design.series.from}–${design.series.to}` : l.text)).filter(Boolean).join(" "));
    return {
      title: `${cfg.title.uk} «${texts}», ${cm(design.widthMm)}×${cm(design.heightMm)} см${price.count > 1 ? `, набір ${price.count} шт.` : ""}`,
      unitPrice: price.unitPrice,
    };
  }
  if (line.kind === "words") {
    // «Написи на планці»: the design is re-read and every piece measured with the server's
    // fonts (the customer's own fonts are on the server too), then priced by its pieces.
    const design = readJoinedWordsDesign(line.words, line.quantity);
    const { price } = priceJoinedWordsDesign(design, loadFontById);
    const words = cleanText(design.lines.map((l) => l.text || l.tail).join(" / "));
    return {
      title: `Напис на планці «${words}», літери ${cm(design.letterHeightMm)} см, ${findJoinedWordsMaterial(design.materialId).name.uk.toLowerCase()}`,
      unitPrice: price.unitPrice,
    };
  }
  if (line.kind === "initials") {
    const INITIALS_SEPARATOR_TITLE = { bar: "|", amp: "&", plus: "+", dot: "·", none: "" } as const;
    // Wedding cake initials: re-read and measured with the server's fonts, priced by the composition.
    const design = readInitialsDesign(line.initials, line.quantity);
    const price = priceInitialsDesign(design, loadFontById);
    const letters = cleanText([design.first, INITIALS_SEPARATOR_TITLE[design.separator], design.second].filter(Boolean).join(" "));
    return {
      title: `Ініціали на торт «${letters}», літери ${cm(design.letterHeightMm)} см, ${findJoinedWordsMaterial(design.materialId).name.uk.toLowerCase()}${design.mode === "topper" ? ", на планці зі шпажкою" : ", окремі деталі"}`,
      unitPrice: price.unitPrice,
    };
  }
  if (line.kind === "letters") {
    // Self-adhesive letters and single acrylic characters: re-read and measured with the server's
    // fonts, priced by their pieces.
    const design = readStickLettersDesign(line.letters, line.quantity);
    const { layout, price } = priceStickLettersDesign(design, loadFontById);
    const text = cleanText(design.lines.map((l) => l.text).join(" / "));
    return {
      title: design.product === "sign-letters"
        ? `Самоклейні літери для вивіски «${text}», ${cm(layout.widthMm)}×${cm(layout.heightMm)} см, ${findJoinedWordsMaterial(design.materialId).name.uk.toLowerCase()}${design.upper ? ", усі великі" : ""}`
        : design.product === "chars"
        ? `Акрилові цифри і літери «${text}», ${cm(layout.widthMm)}×${cm(layout.heightMm)} см, ${findJoinedWordsMaterial(design.materialId).name.uk.toLowerCase()}, ${design.adhesive ? "зі скотчем" : "без скотчу"}`
        : `Самоклейні літери «${text}», ${cm(layout.widthMm)}×${cm(layout.heightMm)} см, ${findJoinedWordsMaterial(design.materialId).name.uk.toLowerCase()}, з картонним трафаретом`,
      unitPrice: price.unitPrice,
    };
  }
  if (line.kind === "blank") {
    // Blank of «/zahotovky»: shape, size and sheet re-read and priced here by the blank formula.
    const design = readBlankDesign(line.blank, line.quantity);
    return { title: blankTitle(design), unitPrice: priceBlankDesign(design).unitPrice };
  }
  const material = line.materialId && MATERIALS[line.materialId];
  if (!material || !material.available || !line.widthCm || !line.heightCm) throw new Error(`bad ${line.kind} line`);
  if (line.widthCm < 2 || line.heightCm < 2 || line.widthCm > 1000 || line.heightCm > 1000) throw new Error("size out of range");
  const widthMm = Math.round(line.widthCm * 10);
  const clientHeightMm = line.heightCm * 10;
  const spec = line.spec ?? null;

  if (line.kind === "welded") {
    if (material.use !== "blank") throw new Error("welded word needs a sheet material");
    if (spec?.source === "free-canvas" && spec.result === "piece") {
      // «Вільне полотно» → «Цілим шматком»: the piece size must match the line; the layout
      // goes to the manager for a check before cutting (needsLayoutReview in the metadata).
      const piece = spec.piece as { widthMm?: number; heightMm?: number } | undefined;
      if (!piece || Math.abs((piece.widthMm ?? 0) - widthMm) > 1 || Math.abs((piece.heightMm ?? 0) - clientHeightMm) > 1) throw new SpecError("canvas piece mismatch");
      const price = priceWelded(widthMm, clientHeightMm, material, line.quantity);
      if (price.priceOnRequest) throw new Error("price on request");
      return { title: `Виріб цілим шматком з полотна, ${cm(widthMm)}×${cm(clientHeightMm)} см, ${material.name.uk}`, unitPrice: price.unitPrice };
    }
    // Size of the piece is rebuilt here from the text, font and weld options.
    const textSpec = readTextSpec(spec);
    const size = weldedSizeMm(textSpec, widthMm, readWeldOptions(spec?.weld));
    if (size.pieces !== 1) throw new SpecError("welded word is not one piece");
    if (Math.abs(size.heightMm - clientHeightMm) > SIZE_TOLERANCE_MM || Math.abs(size.widthMm - widthMm) > SIZE_TOLERANCE_MM) {
      throw new SpecError(`size mismatch: ${Math.round(size.widthMm)}×${Math.round(size.heightMm)} mm on the server`);
    }
    const price = priceWelded(size.widthMm, size.heightMm, material, line.quantity);
    if (price.priceOnRequest) throw new Error("price on request");
    return {
      title: `Напис цілим словом «${cleanText(textSpec.text)}», ${cm(size.widthMm)}×${cm(size.heightMm)} см, ${material.name.uk}`,
      unitPrice: price.unitPrice,
    };
  }

  if (material.use !== "stencil" || line.widthCm < 5 || line.heightCm < 5) throw new Error("bad stencil line");
  let heightMm: number;
  let label: string;
  if (spec?.source === "free-canvas") {
    // Free canvas: the customer chooses the sheet itself; the spec must describe the same sheet.
    const sheet = spec.sheet as { widthMm?: number; heightMm?: number } | undefined;
    if (!sheet || Math.abs((sheet.widthMm ?? 0) - widthMm) > 1 || Math.abs((sheet.heightMm ?? 0) - clientHeightMm) > 1) throw new SpecError("canvas sheet mismatch");
    heightMm = clientHeightMm;
    label = "Трафарет з полотна";
  } else if (spec && typeof spec.text === "string" && spec.square === true) {
    // «Свій напис» on a square sheet (Денис 2026-10-10): the text is fitted inside the square;
    // the layout is rebuilt only to check the font and characters.
    const margin = readMarginMm(spec);
    const textSpec = readTextSpec(spec);
    stencilHeightMm(textSpec, widthMm, margin);
    if (Math.abs(clientHeightMm - widthMm) > SIZE_TOLERANCE_MM) throw new SpecError("square stencil is not square");
    heightMm = widthMm;
    label = `Квадратний трафарет «${cleanText(textSpec.text)}»`;
  } else if (spec && typeof spec.text === "string") {
    // «Свій напис»: the sheet height follows the text proportions at the paid width.
    const margin = readMarginMm(spec);
    const textSpec = readTextSpec(spec);
    heightMm = stencilHeightMm(textSpec, widthMm, margin);
    if (Math.abs(heightMm - clientHeightMm) > SIZE_TOLERANCE_MM) throw new SpecError(`size mismatch: sheet ${widthMm}×${heightMm} mm on the server`);
    label = `Свій напис «${cleanText(textSpec.text)}»`;
  } else if (line.uploadKey) {
    // Customer's own layout: a manager checks the file against the paid size before cutting.
    heightMm = clientHeightMm;
    label = "Трафарет за макетом клієнта";
  } else {
    throw new SpecError("stencil line without a design");
  }
  const price = priceStencil({ shape: "rect", widthMm, heightMm }, material, line.quantity);
  if (price.priceOnRequest) throw new Error("price on request");
  return { title: `${label}, ${cm(widthMm)}×${cm(heightMm)} см, ${material.name.uk}`, unitPrice: price.unitPrice };
}
