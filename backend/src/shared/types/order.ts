// Order as the storefront sends it to Medusa (POST /store/tl-checkout) and as it
// comes back. Prices are never trusted from the browser: the server recomputes
// every line with lib/calculators/pricing.ts.

import type { MaterialType, SectionTheme } from "./customizer";
import type { SignDesign } from "./signage";
import type { PointerSignDesign } from "./pointer-sign";
import type { OfficePlaqueDesign } from "./office-plaque";
import type { JoinedWordsDesign } from "./joined-words";
import type { LayeredPlaqueDesign } from "./layered-plaque";
import type { InitialsDesign } from "./initials";
import type { B2BCompany } from "./invoice";
import type { PackKind } from "./packaging";

/**
 * stencil: sheet with cut-outs priced by size; welded: one solid piece (topper, acrylic word);
 * catalog: a ready product variant from Medusa, priced by the variant price in the database;
 * sign; pointer: two-layer pointer sign and plaque: office plaque, both priced by their design;
 * words: «Написи на планці», priced by its pieces measured with the server's fonts;
 * layered: two-layer floor, door and number plaques, priced by size and series;
 * initials: wedding cake initials «S | D», priced by the composition measured with the server's fonts; accessory.
 */
export type OrderLineKind = "stencil" | "welded" | "catalog" | "sign" | "pointer" | "plaque" | "words" | "layered" | "initials" | "accessory";

export interface OrderLineInput {
  key: string;
  kind: OrderLineKind;
  title: string;
  quantity: number;
  /** Medusa variant id for kind "catalog". */
  variantId?: string;
  materialId?: MaterialType;
  widthCm?: number;
  heightCm?: number;
  sign?: SignDesign;
  /** kind "pointer": the design, re-read and re-priced on the server. */
  pointer?: PointerSignDesign;
  /** kind "plaque": the design, re-read and re-priced on the server. */
  plaque?: OfficePlaqueDesign;
  /** kind "words": the design, re-read, re-measured and re-priced on the server. */
  words?: JoinedWordsDesign;
  /** kind "layered": the design, re-read and re-priced on the server. */
  layered?: LayeredPlaqueDesign;
  /** kind "initials": the design, re-read, re-measured and re-priced on the server. */
  initials?: InitialsDesign;
  /** Customer layout file (POST /store/tl-upload). */
  uploadKey?: string;
  section?: SectionTheme;
  /** Production data: text, font, sizes, weld options. */
  spec?: Record<string, unknown>;
}

export type DeliveryMethod = "np_branch" | "np_courier" | "ukrposhta";
export type PaymentMethod = "card" | "privat" | "cod" | "invoice";

export interface OrderContact {
  phone: string;
  name: string;
  email?: string;
}

export interface OrderDelivery {
  method: DeliveryMethod;
  city: string;
  /** Nova Poshta city reference when the city was picked from the list. */
  cityRef?: string;
  warehouse?: string;
  warehouseRef?: string;
  address?: string;
  pack?: PackKind;
}

export interface OrderDraft {
  lines: OrderLineInput[];
  contact: OrderContact;
  delivery: OrderDelivery;
  payment: PaymentMethod;
  /** Required for payment = "invoice". */
  company?: B2BCompany;
  comment?: string;
  noCall?: boolean;
  utm?: Record<string, string>;
  /** Honeypot: a field hidden from people; bots fill it and the order is refused. */
  website?: string;
}

export type OrderValidationError =
  | "cart_empty" | "phone" | "name" | "city" | "warehouse" | "company" | "line" | "size_mismatch" | "payment" | "rate_limited";

export interface PlacedOrder {
  id: string;
  /** "TL-123" */
  number: string;
  total: number;
}

export interface CheckoutResponse {
  order: PlacedOrder;
}

export interface CheckoutErrorResponse {
  errors: OrderValidationError[];
  message?: string;
}
