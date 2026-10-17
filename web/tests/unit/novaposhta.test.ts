// Nova Poshta client against the API answers in data/knowledge_base/mock_novaposhta.json:
// city search, branches and parcel lockers with their size limits, delivery price and date.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mocks from "@/data/knowledge_base/mock_novaposhta.json";
import { listWarehouses, quoteDelivery, searchCities } from "@/services/novaposhta";
import { UpstreamError } from "@/services/config";
import type { NovaPoshtaMocks } from "@/types/system";
import { stubFetch } from "./support/fetch-stub";

const NP = mocks as NovaPoshtaMocks;
const KYIV_REF = NP.searchSettlements.data[0].Addresses[0].DeliveryCity;

function answerByMethod(call: { body: unknown }) {
  const method = (call.body as { calledMethod: keyof NovaPoshtaMocks }).calledMethod;
  return { json: NP[method] };
}

beforeEach(() => {
  vi.stubEnv("NP_API_KEY", "test-key");
  vi.stubEnv("NP_SENDER_CITY_REF", "sender-boryspil");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Nova Poshta", () => {
  it("finds a city and sends the key only to Nova Poshta", async () => {
    const calls = stubFetch(answerByMethod);
    expect(await searchCities("Київ")).toEqual([
      { cityRef: KYIV_REF, settlementRef: NP.searchSettlements.data[0].Addresses[0].Ref, label: "м. Київ, Київська обл.", name: "Київ", area: "Київська", warehouses: 2 },
    ]);
    expect(calls[0].url).toBe("https://api.novaposhta.ua/v2.0/json/");
    expect(calls[0].body).toMatchObject({ apiKey: "test-key", modelName: "Address", calledMethod: "searchSettlements" });
  });

  it("lists branches and blocks a parcel locker the parcel does not fit", async () => {
    stubFetch(answerByMethod);
    const big = { lengthMm: 700, widthMm: 350, heightMm: 30, weightKg: 1.2 };
    const [branch, locker] = await listWarehouses(KYIV_REF, "", 50, big);
    expect(branch).toMatchObject({ number: "5", category: "branch", maxWeightKg: 30, fits: true });
    // The locker reports 40 × 30 × 60 cm: a 70 cm parcel does not go in.
    expect(locker).toMatchObject({ number: "1001", category: "postomat", maxDimensionsMm: { length: 600, width: 400, height: 300 }, fits: false });

    const small = { lengthMm: 320, widthMm: 120, heightMm: 120, weightKg: 0.4 };
    const [, lockerSmall] = await listWarehouses(KYIV_REF, "", 50, small);
    expect(lockerSmall.fits).toBe(true);
  });

  it("leaves parcel lockers out for a parcel larger than a locker cell", async () => {
    stubFetch(answerByMethod);
    const big = { lengthMm: 700, widthMm: 350, heightMm: 30, weightKg: 1.2 };
    const list = await listWarehouses(KYIV_REF, "", 50, big, false);
    expect(list.map((w) => w.category)).toEqual(["branch"]);
  });

  it("quotes delivery with cash on delivery and the arrival date", async () => {
    const calls = stubFetch(answerByMethod);
    const quote = await quoteDelivery({
      cityRecipientRef: KYIV_REF, serviceType: "WarehouseWarehouse", weightKg: 0.34, declaredValue: 180,
      lengthMm: 320, widthMm: 100, heightMm: 100, codAmount: 180,
    });
    expect(quote).toEqual({ deliveryCost: 80, codFee: 22, deliveryDate: "2026-10-22" });
    const priceCall = calls.find((c) => (c.body as { calledMethod: string }).calledMethod === "getDocumentPrice");
    expect(priceCall?.body).toMatchObject({
      methodProperties: { CitySender: "sender-boryspil", Weight: "0.4", RedeliveryCalculate: { CargoType: "Money", Amount: "180" } },
    });
  });

  it("reports a Nova Poshta error with its text", async () => {
    stubFetch(() => ({ json: NP.error }));
    await expect(searchCities("Київ")).rejects.toThrow(UpstreamError);
    await expect(searchCities("Київ")).rejects.toThrow("API key expired");
  });

  it("says which variable is missing without a key", async () => {
    vi.stubEnv("NP_API_KEY", "");
    stubFetch(answerByMethod);
    await expect(searchCities("Київ")).rejects.toThrow("NP_API_KEY");
  });
});
