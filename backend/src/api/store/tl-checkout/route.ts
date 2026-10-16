// POST /store/tl-checkout — one-step checkout for the Trafaret Line storefront.
// The browser sends what the customer chose (sizes, material, quantity, sign design,
// production spec), never trusted prices or titles: every line price is recomputed here with
// the shared pricing code (shared/lib/calculators, the same files as web/lib/calculators), and
// every line title comes from the database or is built here (QA 2026-10-10, M9).
// Then a Medusa cart is created and completed into an order. Card payment continues on
// WayForPay (POST /store/tl-pay/wayforpay); cash on delivery and invoice orders wait for
// the manager. Delivery is paid to the carrier, so lines do not require shipping here.
// Requests per address are limited in api/middlewares.ts; a filled honeypot field is refused.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  completeCartWorkflow, createCartWorkflow, createPaymentCollectionForCartWorkflow, createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { MATERIALS } from "../../../shared/lib/materials";
import { priceCatalogVariant, priceStencil, priceWelded } from "../../../shared/lib/calculators/pricing";
import { priceSign } from "../../../shared/lib/calculators/signage";
import { pricePointerSign } from "../../../shared/lib/pointer-sign/price";
import { readPointerSignDesign } from "../../../shared/lib/pointer-sign/read-design";
import { findPlaquePlate } from "../../../shared/lib/office-plaque/colours";
import { priceOfficePlaque } from "../../../shared/lib/office-plaque/price";
import { readOfficePlaqueDesign } from "../../../shared/lib/office-plaque/read-design";
import { findJoinedWordsMaterial } from "../../../shared/lib/joined-words/find-material";
import { priceJoinedWordsDesign } from "../../../shared/lib/joined-words/price-design";
import { readJoinedWordsDesign } from "../../../shared/lib/joined-words/read-design";
import { loadFontById } from "../../../lib/text/node-fonts";
import { LAYERED_PLAQUE_CONFIGS } from "../../../shared/lib/layered-plaque/configs";
import { priceLayeredPlaque } from "../../../shared/lib/layered-plaque/price";
import { readLayeredPlaqueDesign } from "../../../shared/lib/layered-plaque/read-design";
import { priceInitialsDesign } from "../../../shared/lib/initials/price-design";
import { readInitialsDesign } from "../../../shared/lib/initials/read-design";
import { priceStickLettersDesign } from "../../../shared/lib/stick-letters/price-design";
import { readStickLettersDesign } from "../../../shared/lib/stick-letters/read-design";
import type { OrderDraft, OrderLineInput, OrderValidationError, PaymentMethod } from "../../../shared/types/order";
import {
  readTextSpec, readWeldOptions, SIZE_TOLERANCE_MM, SpecError, stencilHeightMm, weldedSizeMm,
} from "../../../lib/validation/constructor-size";
import { invoiceLinkToken } from "../../../lib/order-link";
import { checkHole } from "../../../shared/lib/catalog/check-hole";
import { readHoleRules } from "../../../shared/lib/catalog/hole-rules";
import type { HolePosition, HoleSpec } from "../../../shared/types/hole";

// Accessories with fixed prices (admin setting).
const ACCESSORIES: Record<string, { title: string; price: number }> = {
  "upsell-valyk": { title: "Валик поролоновий 10 см", price: 85 },
  "upsell-klei": { title: "Клей-спрей для фіксації", price: 220 },
};

// LiqPay / Privat24 is accepted again once its payment route exists.
const PAYMENTS: ReadonlySet<PaymentMethod> = new Set<PaymentMethod>(["card", "cod", "invoice"]);

const phoneOk = (v: string) => /^(\+?380|0)\d{9}$/.test(v.replace(/[\s()-]/g, ""));
const MAX_SPEC_CHARS = 20_000;
const MAX_TITLE_CHARS = 200;

type VariantPrice = { title: string; sku: string | null; price: number; sheetMm: [number, number] | null; hole: unknown };
/** `spec` is set when the server rewrote the production data (a checked hole). */
type PricedLine = { title: string; unitPrice: number; spec?: Record<string, unknown> };

/**
 * Price of catalogue variants from the database (never from the browser); only published
 * products that are not marked «Немає в наявності» in «Простий кабінет».
 */
async function variantPrices(query: { graph: (args: Record<string, unknown>) => Promise<{ data: unknown[] }> }, ids: string[]): Promise<Map<string, VariantPrice>> {
  const out = new Map<string, VariantPrice>();
  if (!ids.length) return out;
  const { data } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "sku", "metadata", "prices.amount", "prices.currency_code", "product.title", "product.status", "product.metadata"],
    filters: { id: ids },
  });
  for (const raw of data as { id: string; title: string; sku: string | null; metadata?: Record<string, unknown> | null; prices?: { amount: number; currency_code: string }[]; product?: { title: string; status: string; metadata?: Record<string, unknown> | null } }[]) {
    const price = raw.prices?.find((p) => p.currency_code === "uah");
    if (!price || raw.product?.status !== "published") continue;
    if (raw.product.metadata?.availability === "out_of_stock") continue;
    const sheet = raw.metadata?.sheet_mm;
    const sheetMm = Array.isArray(sheet) && sheet.length === 2 && sheet.every((v) => typeof v === "number" && v > 0) ? (sheet as [number, number]) : null;
    out.set(raw.id, { title: `${raw.product.title}, ${raw.title}`, sku: raw.sku, price: Number(price.amount), sheetMm, hole: raw.product.metadata?.hole ?? null });
  }
  return out;
}

/** Customer text for a title: control characters removed, spaces collapsed, length capped. */
function cleanText(value: unknown, max = 80): string {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

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

function priceLine(line: OrderLineInput, variants: Map<string, VariantPrice>): PricedLine {
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
    const margin = typeof spec.marginMm === "number" ? Math.min(50, Math.max(5, spec.marginMm)) : 15;
    const textSpec = readTextSpec(spec);
    stencilHeightMm(textSpec, widthMm, margin);
    if (Math.abs(clientHeightMm - widthMm) > SIZE_TOLERANCE_MM) throw new SpecError("square stencil is not square");
    heightMm = widthMm;
    label = `Квадратний трафарет «${cleanText(textSpec.text)}»`;
  } else if (spec && typeof spec.text === "string") {
    // «Свій напис»: the sheet height follows the text proportions at the paid width.
    const margin = typeof spec.marginMm === "number" ? Math.min(50, Math.max(5, spec.marginMm)) : 15;
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

/** Production spec as sent by the constructor, size-limited so a cart cannot flood the database. */
function safeSpec(spec: unknown): Record<string, unknown> | null {
  if (!spec || typeof spec !== "object") return null;
  const text = JSON.stringify(spec);
  return text.length <= MAX_SPEC_CHARS ? (JSON.parse(text) as Record<string, unknown>) : { truncated: true };
}

function validate(body: OrderDraft | undefined): OrderValidationError[] {
  const errors: OrderValidationError[] = [];
  if (!body?.lines?.length || body.lines.length > 100) errors.push("cart_empty");
  if (!phoneOk(body?.contact?.phone ?? "")) errors.push("phone");
  if ((body?.contact?.name ?? "").trim().split(/\s+/).length < 2) errors.push("name");
  if (!body?.delivery?.city?.trim()) errors.push("city");
  const method = body?.delivery?.method;
  if (method === "np_courier" ? !body?.delivery?.address?.trim() : !body?.delivery?.warehouse?.trim()) errors.push("warehouse");
  if (!body?.payment || !PAYMENTS.has(body.payment)) errors.push("payment");
  if (body?.payment === "invoice" && (!/^(\d{8}|\d{10})$/.test(body.company?.code ?? "") || !body.company?.name?.trim())) errors.push("company");
  return errors;
}

export async function POST(req: MedusaRequest<OrderDraft>, res: MedusaResponse) {
  const body = req.body;
  // Honeypot: people never see the field; a bot that fills it gets a generic refusal.
  if (body?.website) return res.status(400).json({ errors: ["line"] satisfies OrderValidationError[] });
  const errors = validate(body);
  if (errors.length) return res.status(400).json({ errors });

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const variants = await variantPrices(query as never, body.lines.filter((l) => l.kind === "catalog" && l.variantId).map((l) => l.variantId as string));

  let items;
  try {
    items = body.lines.map((line) => {
      const quantity = Math.max(1, Math.min(9999, Math.round(line.quantity)));
      const priced = priceLine({ ...line, quantity }, variants);
      return {
        title: priced.title.slice(0, MAX_TITLE_CHARS),
        quantity,
        unit_price: priced.unitPrice,
        requires_shipping: false,
        metadata: {
          kind: line.kind, key: String(line.key ?? "").slice(0, 300), variantId: line.variantId ?? null,
          sku: line.variantId ? variants.get(line.variantId)?.sku ?? null : null, materialId: line.materialId ?? null,
          widthCm: line.widthCm ?? null, heightCm: line.heightCm ?? null,
          sign: line.sign ?? null, uploadKey: line.uploadKey ?? null, spec: safeSpec(priced.spec ?? line.spec),
          pointer: line.kind === "pointer" ? readPointerSignDesign(line.pointer, quantity) : null,
          plaque: line.kind === "plaque" ? readOfficePlaqueDesign(line.plaque, quantity) : null,
          words: line.kind === "words" ? readJoinedWordsDesign(line.words, quantity) : null,
          layered: line.kind === "layered" ? readLayeredPlaqueDesign(line.layered, quantity) : null,
          initials: line.kind === "initials" ? readInitialsDesign(line.initials, quantity) : null,
          letters: line.kind === "letters" ? readStickLettersDesign(line.letters, quantity) : null,
          needsLayoutReview: !!line.uploadKey || (line.kind === "welded" && line.spec?.source === "free-canvas") || (line.kind === "pointer" && !!line.pointer?.logo),
        },
      };
    });
  } catch (e) {
    const code: OrderValidationError = e instanceof SpecError ? "size_mismatch" : "line";
    return res.status(400).json({ errors: [code], message: (e as Error).message });
  }

  const { data: regions } = await query.graph({ entity: "region", fields: ["id"], filters: { currency_code: "uah" } });
  const salesChannelId = (req as unknown as { publishable_key_context?: { sales_channel_ids: string[] } }).publishable_key_context?.sales_channel_ids?.[0];

  const [firstName, ...rest] = body.contact.name.trim().split(/\s+/);
  const address = {
    first_name: cleanText(firstName, 60),
    last_name: cleanText(rest.join(" "), 100),
    phone: body.contact.phone,
    city: cleanText(body.delivery.city, 100),
    address_1: body.delivery.method === "np_courier" ? cleanText(body.delivery.address, 200) : `Відділення: ${cleanText(body.delivery.warehouse, 200)}`,
    country_code: "ua",
    company: body.payment === "invoice" ? cleanText(body.company?.name, 200) : undefined,
  };

  const { result: cart } = await createCartWorkflow(req.scope).run({ input: {
    region_id: regions[0].id,
    sales_channel_id: salesChannelId,
    currency_code: "uah",
    email: body.contact.email || `${body.contact.phone.replace(/\D/g, "")}@phone.trafaret-line.com.ua`,
    shipping_address: address,
    billing_address: address,
    items,
    metadata: {
      payment: body.payment,
      delivery: body.delivery.method,
      cityRef: body.delivery.cityRef ?? null,
      warehouseRef: body.delivery.warehouseRef ?? null,
      pack: body.delivery.pack ?? null,
      dispatchFrom: "Бориспіль",
      company: body.payment === "invoice" ? body.company ?? null : null,
      comment: String(body.comment ?? "").slice(0, 2000),
      noCall: !!body.noCall,
      utm: body.utm ?? {},
    },
  } });

  const { result: collection } = await createPaymentCollectionForCartWorkflow(req.scope).run({ input: { cart_id: cart.id } });
  await createPaymentSessionsWorkflow(req.scope).run({ input: { payment_collection_id: (collection as unknown as { id: string }).id, provider_id: "pp_system_default" } });
  const { result: order } = await completeCartWorkflow(req.scope).run({ input: { id: cart.id } });

  const { data: [placed] } = await query.graph({ entity: "order", fields: ["id", "display_id", "total"], filters: { id: (order as { id: string }).id } });
  return res.json({
    order: {
      id: placed.id, number: `TL-${placed.display_id}`, total: placed.total,
      // Signed invoice link for invoice orders (web/app/rakhunok checks it).
      invoiceToken: body.payment === "invoice" ? invoiceLinkToken(placed.id) : null,
    },
  });
}
