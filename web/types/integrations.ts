// External services used by app/api routes. Raw API shapes are kept next to the
// normalised shapes the site works with, so a change on the provider side is
// fixed in one mapping function in /services.

/* ------------------------------------------------------------------ */
/* Common                                                              */
/* ------------------------------------------------------------------ */

export type IntegrationName = "novaposhta" | "vchasno-kasa" | "gemini" | "opendatabot" | "internal";

/** JSON body of every error answer from app/api routes. */
export interface ApiErrorBody {
  error: "not_configured" | "bad_request" | "unauthorized" | "rate_limited" | "upstream" | "not_found";
  service: IntegrationName;
  message: string;
  /** Environment variables to fill in (only for "not_configured"). */
  missing?: string[];
  details?: unknown;
}

/* ------------------------------------------------------------------ */
/* Nova Poshta API 2.0                                                 */
/* ------------------------------------------------------------------ */

export interface NpEnvelope<T> {
  success: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  info: unknown;
  errorCodes?: string[];
}

export interface NpRawSettlementAddress {
  Present: string;
  Warehouses: number;
  MainDescription: string;
  Area: string;
  Region: string;
  SettlementTypeCode: string;
  Ref: string;
  DeliveryCity: string;
}

export interface NpRawSettlementSearch {
  TotalCount: number;
  Addresses: NpRawSettlementAddress[];
}

export interface NpRawWarehouse {
  Ref: string;
  Number: string;
  Description: string;
  ShortAddress: string;
  CategoryOfWarehouse: string;
  CityRef: string;
  SettlementRef: string;
  PlaceMaxWeightAllowed: string;
  TotalMaxWeightAllowed: string;
  ReceivingLimitationsOnDimensions?: { Width: number; Height: number; Length: number };
  SendingLimitationsOnDimensions?: { Width: number; Height: number; Length: number };
}

export interface NpRawDocumentPrice {
  Cost: number;
  AssessedCost: number;
  CostRedelivery?: number;
  CostPack?: number;
}

export interface NpRawDeliveryDate {
  DeliveryDate: { date: string; timezone_type: number; timezone: string };
}

export interface NpCity {
  /** City reference for warehouses and prices (DeliveryCity). */
  cityRef: string;
  settlementRef: string;
  /** "м. Київ, Київська обл." */
  label: string;
  name: string;
  area: string;
  warehouses: number;
}

export type NpWarehouseCategory = "branch" | "postomat" | "store";

export interface NpWarehouse {
  ref: string;
  number: string;
  label: string;
  shortAddress: string;
  category: NpWarehouseCategory;
  maxWeightKg: number | null;
  /** Largest parcel the point accepts, mm, when Nova Poshta reports it. */
  maxDimensionsMm: { length: number; width: number; height: number } | null;
  /** Whether the current parcel fits this point (null = not checked). */
  fits: boolean | null;
}

export type NpServiceType = "WarehouseWarehouse" | "WarehouseDoors";

export interface NpPriceQuery {
  cityRecipientRef: string;
  serviceType: NpServiceType;
  /** Billing weight, kg. */
  weightKg: number;
  /** Declared value, UAH (= order total). */
  declaredValue: number;
  lengthMm: number;
  widthMm: number;
  heightMm: number;
  /** Cash on delivery amount, UAH (0 = prepaid). */
  codAmount: number;
}

export interface NpPriceResult {
  /** Delivery cost the customer pays to the carrier, UAH. */
  deliveryCost: number;
  /** Fee for cash on delivery (money transfer), UAH, 0 when prepaid. */
  codFee: number;
  /** Expected delivery date "YYYY-MM-DD" for dispatch today, null when Nova Poshta does not return it. */
  deliveryDate: string | null;
}

/* ------------------------------------------------------------------ */
/* Вчасно.Каса (PRRO), POST /api/v3/fiscal/execute                     */
/* ------------------------------------------------------------------ */

/** 0 open shift, 1 sale, 2 return, 3 cash in, 4 cash out, 10 X report, 11 Z report (close shift), 18 status. */
export type VchasnoTask = 0 | 1 | 2 | 3 | 4 | 10 | 11 | 18;

/** Payment type codes of Вчасно.Каса: 0 cash, 1 cashless, 2 card, 16 internet acquiring, 17 LiqPay, 20 NovaPay. */
export type VchasnoPayType = 0 | 1 | 2 | 3 | 4 | 16 | 17 | 20;

export interface VchasnoReceiptRow {
  code?: string;
  name: string;
  cnt: number;
  price: number;
  disc?: number;
  /** Tax group code configured for the cash register (2 = without VAT). */
  taxgrp: number | string;
  comment?: string;
}

export interface VchasnoReceiptPay {
  type: VchasnoPayType;
  sum: number;
  paysys?: string;
  rrn?: string;
  cardmask?: string;
  auth_code?: string;
  comment?: string;
}

export interface VchasnoReceipt {
  sum: number;
  round?: number;
  comment_up?: string;
  comment_down?: string;
  rows: VchasnoReceiptRow[];
  pays: VchasnoReceiptPay[];
}

export interface VchasnoRequest {
  /** Unique id of the request: repeating it never creates a second receipt. */
  tag?: string;
  source?: string;
  dt?: string;
  userinfo?: { email?: string; phone?: string };
  fiscal: {
    task: VchasnoTask;
    cashier?: string;
    receipt?: VchasnoReceipt;
  };
}

export interface VchasnoResponse {
  task: number;
  tag: string;
  dt: string;
  res: number;
  /** 0 ok, 1 retry later, 2 collision: repeat the same tag, 3 stop and check. */
  res_action: 0 | 1 | 2 | 3;
  errortxt: string;
  warnings?: unknown[];
  error_extra?: Record<string, unknown> | null;
  info?: {
    doccode?: string;
    docno?: number;
    qr?: string;
    fisid?: string;
    shift_link?: number;
    isoffline?: boolean;
    [k: string]: unknown;
  };
}

/** What the site keeps about an issued receipt. */
export interface FiscalReceiptResult {
  tag: string;
  fiscalNumber: string;
  receiptUrl: string;
  offline: boolean;
}

/** Input of POST /api/vchasno-kasa/receipt (called by Medusa after payment). */
export interface ReceiptRequestBody {
  orderNumber: string;
  payment: "card" | "privat";
  lines: { title: string; quantity: number; unitPrice: number; code?: string }[];
  /** Payment system data from WayForPay / LiqPay. */
  paymentRef?: { rrn?: string; cardMask?: string; authCode?: string; system?: string };
  customer?: { email?: string; phone?: string };
}

export type ShiftAction = "open" | "x_report" | "close" | "status";

/* ------------------------------------------------------------------ */
/* Google AI Studio (Gemini API)                                       */
/* ------------------------------------------------------------------ */

export interface ChatMessage {
  role: "user" | "assistant";
  text: string;
}

export interface ChatRequestBody {
  messages: ChatMessage[];
  /** Page the customer is on, gives the assistant context ("/konstruktor"). */
  page?: string;
}

export interface ChatResponseBody {
  reply: string;
  model: string;
}

export interface GeminiRawResponse {
  candidates?: { content?: { parts?: { text?: string }[]; role?: string }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  modelVersion?: string;
}

/* ------------------------------------------------------------------ */
/* Opendatabot API v4                                                  */
/* ------------------------------------------------------------------ */

export interface OdbRawAddress {
  zip?: string;
  country?: string;
  address?: string;
}

export interface OdbRawCompany {
  code: string;
  companyName?: string;
  USR?: {
    fullName?: string;
    shortName?: string;
    ceoName?: string;
    status?: string;
    state?: number;
    location?: string;
    address?: OdbRawAddress;
    heads?: { name?: string; role?: string }[];
  };
  vat?: { code?: string; registrationDate?: string; cancellationDate?: string };
}

export interface OdbRawFop {
  code: string;
  fullName?: string;
  USR?: {
    fullName?: string;
    status?: string;
    state?: number;
    location?: string;
    address?: OdbRawAddress;
    email?: string;
    phones?: string[];
  };
  vat?: { code?: string; registrationDate?: string; cancellationDate?: string };
}
