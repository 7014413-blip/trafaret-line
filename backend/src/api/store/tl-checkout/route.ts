// POST /store/tl-checkout — one-step checkout for the Trafaret Line storefront.
// The browser sends what the customer chose (sizes, material, quantity, sign design,
// production spec), never trusted prices or titles: every line price is recomputed here with
// the shared pricing code (shared/lib/calculators, the same files as web/lib/calculators), and
// every line title comes from the database or is built here (QA 2026-10-10, M9).
// Then a Medusa cart is created and completed into an order. Card payment continues on
// WayForPay (POST /store/tl-pay/wayforpay); cash on delivery and invoice orders wait for
// the manager. Delivery is paid to the carrier, so lines do not require shipping here.
// Requests per address are limited in api/middlewares.ts; a filled honeypot field is refused.
// A signed-in customer's checkout carries a short account token (web/lib/account/account-token.ts):
// the order then goes to that customer's cabinet; an expired token leaves it a guest order.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys } from "@medusajs/framework/utils";
import {
  completeCartWorkflow, createCartWorkflow, createPaymentCollectionForCartWorkflow, createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows";
import { readPointerSignDesign } from "../../../shared/lib/pointer-sign/read-design";
import { readOfficePlaqueDesign } from "../../../shared/lib/office-plaque/read-design";
import { readJoinedWordsDesign } from "../../../shared/lib/joined-words/read-design";
import { readLayeredPlaqueDesign } from "../../../shared/lib/layered-plaque/read-design";
import { readInitialsDesign } from "../../../shared/lib/initials/read-design";
import { readStickLettersDesign } from "../../../shared/lib/stick-letters/read-design";
import { readBlankDesign } from "../../../shared/lib/blanks/read-design";
import type { OrderDraft, OrderValidationError, PaymentMethod } from "../../../shared/types/order";
import { SpecError } from "../../../lib/validation/constructor-size";
import { invoiceLinkToken } from "../../../lib/order-link";
import { previewSvgOf } from "../../../shared/lib/validation/preview-svg";
import { needsLayoutApproval } from "../../../shared/lib/validation/layout-approval";
import { cleanText } from "../../../lib/orders/clean-text";
import { priceLine } from "../../../lib/orders/price-line";
import { variantPrices } from "../../../lib/orders/variant-prices";
import { readAccountToken } from "../../../shared/lib/account/account-token";

// LiqPay / Privat24 is accepted again once its payment route exists.
const PAYMENTS: ReadonlySet<PaymentMethod> = new Set<PaymentMethod>(["card", "cod", "invoice"]);

const phoneOk = (v: string) => /^(\+?380|0)\d{9}$/.test(v.replace(/[\s()-]/g, ""));
const MAX_SPEC_CHARS = 20_000;
const MAX_TITLE_CHARS = 200;

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
  // «Лист погодження макета»: the customer confirmed the layout of every made-to-layout line.
  if (body?.lines?.some(needsLayoutApproval) && body.layoutApproved !== true) errors.push("layout_approval");
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
    items = body.lines.map((line, index) => {
      const quantity = Math.max(1, Math.min(9999, Math.round(line.quantity)));
      const priced = priceLine({ ...line, quantity }, variants);
      return {
        title: priced.title.slice(0, MAX_TITLE_CHARS),
        quantity,
        unit_price: priced.unitPrice,
        requires_shipping: false,
        metadata: {
          // Position in the order: the production files are named by it (lib/orders/write-order-files.ts).
          position: index + 1,
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
          blank: line.kind === "blank" ? readBlankDesign(line.blank, quantity) : null,
          previewSvg: previewSvgOf(line.previewSvg),
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

  const customerId = readAccountToken("checkout", body.accountToken, process.env.INTERNAL_API_TOKEN?.trim());
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
    // With a customer the order keeps the account's e-mail; the typed one stays in metadata.
    ...(customerId ? { customer_id: customerId } : {}),
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
      contactEmail: body.contact.email ? cleanText(body.contact.email, 200) : null,
      // When the customer ticked «Макет перевірив» (the approval sheet in the order folder shows it).
      layoutApprovedAt: body.lines.some(needsLayoutApproval) ? new Date().toISOString() : null,
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
