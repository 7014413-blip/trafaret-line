// Web analytics (ТЗ §15.17): GA4 e-commerce events through Google Tag Manager, the same events
// in the Meta pixel with a shared event_id, Consent Mode v2, and where an order came from
// (UTM, gclid, fbclid) saved with the order for the CRM.

/** GA4 recommended e-commerce events and the shop's own events. */
export type AnalyticsEventName =
  | "view_item_list"
  | "select_item"
  | "view_item"
  | "add_to_cart"
  | "remove_from_cart"
  | "view_cart"
  | "begin_checkout"
  | "add_shipping_info"
  | "add_payment_info"
  | "purchase"
  | "phone_click"
  | "messenger_click"
  | "upload_layout"
  | "constructor_start";

/** One product line in GA4 format (also mapped to Meta content_ids and contents). */
export interface AnalyticsItem {
  item_id: string;
  item_name: string;
  /** Kind of product: catalogue, own text, sign, blank … */
  item_category: string;
  /** Size and material, "20 × 20 см, PET 0,5 мм". */
  item_variant?: string;
  /** Unit price after the quantity discount, UAH. */
  price: number;
  quantity: number;
  item_list_name?: string;
  index?: number;
}

export interface AnalyticsParams {
  currency?: "UAH";
  value?: number;
  items?: AnalyticsItem[];
  transaction_id?: string;
  shipping?: number;
  shipping_tier?: string;
  payment_type?: string;
  item_list_name?: string;
  /** phone_click / messenger_click: which messenger or the number. */
  link_type?: string;
  /** constructor_start / upload_layout: which constructor page. */
  constructor_name?: string;
}

/** Event as pushed to the GTM dataLayer. event_id is shared with the Meta pixel for deduplication. */
export interface DataLayerEvent {
  event: AnalyticsEventName;
  event_id: string;
  ecommerce?: AnalyticsParams;
  link_type?: string;
  constructor_name?: string;
}

/** The buyer's answer to the cookie banner. */
export type ConsentChoice = "granted" | "denied";

export interface StoredConsent {
  choice: ConsentChoice;
  /** Version of the banner text the choice was given to; a new text asks again. */
  version: number;
  at: string;
}

/** Google Consent Mode v2 signals. */
export interface ConsentModeState {
  ad_storage: ConsentChoice;
  ad_user_data: ConsentChoice;
  ad_personalization: ConsentChoice;
  analytics_storage: ConsentChoice;
}

/** Where the buyer came from: kept 30 days, the last non-empty source wins. */
export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  gclid?: string;
  fbclid?: string;
  /** Site path of the first page of that visit. */
  landing?: string;
  /** When the source was seen, ISO time. */
  at?: string;
}

/** Ids of the tags, from NEXT_PUBLIC_GTM_ID and NEXT_PUBLIC_META_PIXEL_ID; null when not set. */
export interface AnalyticsConfig {
  gtmId: string | null;
  metaPixelId: string | null;
}

/** Order saved before the WayForPay page, sent as «purchase» when the buyer returns paid. */
export interface PendingPurchase {
  orderId: string;
  orderNumber: string;
  value: number;
  paymentType: string;
  items: AnalyticsItem[];
}

/** What the tag scripts add to window: the GTM queue and the Meta pixel function. */
export interface AnalyticsWindow {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}
