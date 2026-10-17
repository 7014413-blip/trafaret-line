// Customer cabinet (ТЗ §4.9, research/lichnyi-kabinet.md): sign-in with Google or Telegram,
// «Мої замовлення» with statuses and the parcel number, «Повторити замовлення». Shared by the
// storefront and Medusa.

import type { BlankDesign } from "./blank";
import type { InitialsDesign } from "./initials";
import type { JoinedWordsDesign } from "./joined-words";
import type { LayeredPlaqueDesign } from "./layered-plaque";
import type { OfficePlaqueDesign } from "./office-plaque";
import type { OrderLineKind } from "./order";
import type { PointerSignDesign } from "./pointer-sign";
import type { StickLettersDesign } from "./stick-letters";
import type { MaterialType } from "./customizer";

export type LoginProvider = "google" | "telegram";

/** "session": the signed-in customer (HttpOnly cookie); "checkout": a short token for one checkout. */
export type AccountTokenPurpose = "session" | "checkout";

/** Which sign-in buttons work on this storefront (its environment has the keys). */
export interface LoginProviders {
  google: boolean;
  /** Numeric id of the Telegram bot for oauth.telegram.org, or null when not set up. */
  telegramBotId: string | null;
}

/** POST /store/tl-account/google and /store/tl-account/telegram: the new session. */
export interface AccountSignInResponse {
  session: string;
  customer: AccountCustomer;
}

export interface AccountCustomer {
  id: string;
  firstName: string;
  lastName: string;
  /** Real e-mail (Google); null for Telegram accounts. */
  email: string | null;
  provider: LoginProvider | null;
}

/** Stage of an order as the buyer sees it. */
export type AccountOrderStage = "accepted" | "awaiting_payment" | "paid" | "shipped" | "cancelled";

/** A line of a past order, ready to go into the cart again at today's price. */
export interface RepeatCartLine {
  key: string;
  title: string;
  kind: OrderLineKind;
  materialId: MaterialType;
  widthCm: number;
  heightCm: number;
  quantity: number;
  variantId?: string;
  /** Today's price of one piece (catalogue, words, initials, letters): the cart applies the quantity scale. */
  basePrice?: number;
  /** Today's price of one piece at this quantity (signs, accessories). */
  fixedPrice?: number;
  sign?: unknown;
  pointer?: PointerSignDesign;
  plaque?: OfficePlaqueDesign;
  words?: JoinedWordsDesign;
  layered?: LayeredPlaqueDesign;
  initials?: InitialsDesign;
  letters?: StickLettersDesign;
  blank?: BlankDesign;
  uploadKey?: string;
  spec?: Record<string, unknown>;
  /** Picture of the line: the product photo, or the constructor preview as an SVG data URL (shown only as an image). */
  thumbnail?: string;
  /**
   * The constructor's picture as the cart and the workshop preview use it. Only for orders the
   * customer placed signed in: guest orders joined by e-mail could have been placed by anyone.
   */
  vectorSvg?: string;
}

export interface AccountOrderItem {
  title: string;
  quantity: number;
  /** Price of one piece in the order, ₴. */
  unitPrice: number;
  thumbnail: string | null;
  /** The line at today's price, or null when it cannot be ordered again (reason says why). */
  repeat: RepeatCartLine | null;
  repeatProblem: string | null;
  /** Today's price of one piece at the ordered quantity, when it can be repeated. */
  priceNow: number | null;
}

export interface AccountOrder {
  id: string;
  /** "TL-1042" */
  number: string;
  createdAt: string;
  total: number;
  stage: AccountOrderStage;
  /** Status in words: «Оплачено, готуємо до відправки». */
  statusText: string;
  /** Nova Poshta parcel number, when the order was sent. */
  ttn: string | null;
  trackingUrl: string | null;
  items: AccountOrderItem[];
}

/** GET /store/tl-account/orders: the signed-in customer and their orders, newest first. */
export interface AccountOrdersResponse {
  customer: AccountCustomer;
  orders: AccountOrder[];
}

/** Sign-in failures the cabinet page explains to the customer. */
export type AccountSignInError = "google" | "telegram" | "expired" | "unavailable";
