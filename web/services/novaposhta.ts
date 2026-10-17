// Nova Poshta API 2.0 client (https://api.novaposhta.ua/v2.0/json/).
// Needs NP_API_KEY (personal cabinet → Settings → Security → API key); NP_API_URL overrides
// the address for tests.
// The sender city is Бориспіль (production); NP_SENDER_CITY_REF overrides the lookup.

import "server-only";
import type {
  NpCity, NpEnvelope, NpPriceQuery, NpPriceResult, NpRawDeliveryDate, NpRawDocumentPrice, NpRawSettlementSearch, NpRawWarehouse,
  NpWarehouse, NpWarehouseCategory,
} from "../types/integrations";
import { envOr, requireEnv, UpstreamError } from "./config";
import { fetchJson } from "./http";

/** Real API; NP_API_URL points the site at a test copy (end-to-end tests). */
const ENDPOINT = "https://api.novaposhta.ua/v2.0/json/";

/** One API call. Nova Poshta answers HTTP 200 with success=false on errors. */
export async function npCall<T>(modelName: string, calledMethod: string, methodProperties: Record<string, unknown>): Promise<T[]> {
  const { NP_API_KEY } = requireEnv("novaposhta", ["NP_API_KEY"]);
  const { data } = await fetchJson<NpEnvelope<T>>("novaposhta", envOr("NP_API_URL", ENDPOINT), {
    body: { apiKey: NP_API_KEY, modelName, calledMethod, methodProperties },
    timeoutMs: 12_000,
  });
  if (!data || !data.success) {
    const message = data?.errors?.join("; ") || "Nova Poshta returned an error";
    throw new UpstreamError("novaposhta", message, 200, { errorCodes: data?.errorCodes, warnings: data?.warnings });
  }
  return data.data;
}

/** City search for the checkout field ("Київ", "Бориспіль"…). */
export async function searchCities(query: string, limit = 12): Promise<NpCity[]> {
  const result = await npCall<NpRawSettlementSearch>("Address", "searchSettlements", { CityName: query, Limit: String(limit), Page: "1" });
  const addresses = result[0]?.Addresses ?? [];
  return addresses
    .filter((a) => a.DeliveryCity)
    .map((a) => ({
      cityRef: a.DeliveryCity,
      settlementRef: a.Ref,
      label: a.Present,
      name: a.MainDescription,
      area: a.Area,
      warehouses: Number(a.Warehouses) || 0,
    }));
}

function categoryOf(raw: string): NpWarehouseCategory {
  if (raw === "Postomat") return "postomat";
  if (raw === "Store") return "store";
  return "branch";
}

function dimensionsOf(raw: NpRawWarehouse): NpWarehouse["maxDimensionsMm"] {
  const limits = raw.ReceivingLimitationsOnDimensions;
  if (!limits || !limits.Length || !limits.Width || !limits.Height) return null;
  // Nova Poshta reports centimetres.
  const sides = [limits.Length, limits.Width, limits.Height].map((v) => Number(v) * 10).sort((a, b) => b - a);
  return { length: sides[0], width: sides[1], height: sides[2] };
}

/** Does a parcel (mm, kg) fit the point? null when the point reports no limits. */
export function parcelFits(warehouse: Pick<NpWarehouse, "maxDimensionsMm" | "maxWeightKg">, parcel: { lengthMm: number; widthMm: number; heightMm: number; weightKg: number }): boolean | null {
  const checks: boolean[] = [];
  if (warehouse.maxWeightKg != null) checks.push(parcel.weightKg <= warehouse.maxWeightKg);
  if (warehouse.maxDimensionsMm) {
    const box = [parcel.lengthMm, parcel.widthMm, parcel.heightMm].sort((a, b) => b - a);
    const cell = [warehouse.maxDimensionsMm.length, warehouse.maxDimensionsMm.width, warehouse.maxDimensionsMm.height];
    checks.push(box.every((side, i) => side <= cell[i]));
  }
  return checks.length ? checks.every(Boolean) : null;
}

/** Branches and parcel lockers of a city, optionally filtered by number or street. */
export async function listWarehouses(
  cityRef: string, query = "", limit = 50, parcel?: { lengthMm: number; widthMm: number; heightMm: number; weightKg: number }, lockers = true,
): Promise<NpWarehouse[]> {
  const raw = await npCall<NpRawWarehouse>("AddressGeneral", "getWarehouses", {
    CityRef: cityRef, FindByString: query, Page: "1", Limit: String(limit), Language: "UA",
  });
  return raw.map((w) => {
    const maxWeight = Number(w.TotalMaxWeightAllowed) || Number(w.PlaceMaxWeightAllowed) || 0;
    const warehouse: NpWarehouse = {
      ref: w.Ref,
      number: w.Number,
      label: w.Description,
      shortAddress: w.ShortAddress,
      category: categoryOf(w.CategoryOfWarehouse),
      maxWeightKg: maxWeight > 0 ? maxWeight : null,
      maxDimensionsMm: dimensionsOf(w),
      fits: null,
    };
    warehouse.fits = parcel ? parcelFits(warehouse, parcel) : null;
    return warehouse;
  }).filter((warehouse) => lockers || warehouse.category !== "postomat");
}

let senderCityRef: string | null = null;

/** City reference of the sender (Бориспіль), cached for the process lifetime. */
export async function senderCity(): Promise<string> {
  const configured = process.env.NP_SENDER_CITY_REF?.trim();
  if (configured) return configured;
  if (senderCityRef) return senderCityRef;
  const name = envOr("NP_SENDER_CITY", "Бориспіль");
  const [city] = await searchCities(name, 1);
  if (!city) throw new UpstreamError("novaposhta", `Sender city "${name}" not found`);
  senderCityRef = city.cityRef;
  return senderCityRef;
}

/** "dd.mm.yyyy" for Nova Poshta, Kyiv calendar. */
function npDate(date: Date): string {
  const parts = new Intl.DateTimeFormat("uk-UA", { timeZone: "Europe/Kyiv", day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}`;
}

/** Delivery price for the customer and the expected delivery date. */
export async function quoteDelivery(query: NpPriceQuery): Promise<NpPriceResult> {
  const citySender = await senderCity();
  const weight = Math.max(0.1, Math.ceil(query.weightKg * 10) / 10);
  const seat = {
    volumetricLength: String(Math.ceil(query.lengthMm / 10)),
    volumetricWidth: String(Math.ceil(query.widthMm / 10)),
    volumetricHeight: String(Math.ceil(query.heightMm / 10)),
    weight: String(weight),
  };
  const priceProps: Record<string, unknown> = {
    CitySender: citySender,
    CityRecipient: query.cityRecipientRef,
    Weight: String(weight),
    ServiceType: query.serviceType,
    Cost: String(Math.max(1, Math.round(query.declaredValue))),
    CargoType: "Parcel",
    SeatsAmount: "1",
    OptionsSeat: [seat],
  };
  if (query.codAmount > 0) priceProps.RedeliveryCalculate = { CargoType: "Money", Amount: String(Math.round(query.codAmount)) };

  const [price] = await npCall<NpRawDocumentPrice>("InternetDocument", "getDocumentPrice", priceProps);
  if (!price) throw new UpstreamError("novaposhta", "Empty price answer");

  let deliveryDate: string | null = null;
  try {
    const [date] = await npCall<NpRawDeliveryDate>("InternetDocument", "getDocumentDeliveryDate", {
      DateTime: npDate(new Date()), ServiceType: query.serviceType, CitySender: citySender, CityRecipient: query.cityRecipientRef,
    });
    const raw = date?.DeliveryDate?.date;
    // "2026-10-12 00:00:00.000000" → "2026-10-12" (Kyiv calendar date).
    if (raw && /^\d{4}-\d{2}-\d{2}/.test(raw)) deliveryDate = raw.slice(0, 10);
  } catch (error) {
    // The price is what matters; a missing date only hides the hint.
    if (!(error instanceof UpstreamError)) throw error;
  }

  return { deliveryCost: Number(price.Cost) || 0, codFee: Number(price.CostRedelivery) || 0, deliveryDate };
}
