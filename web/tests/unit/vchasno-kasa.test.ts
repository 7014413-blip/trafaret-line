// Вчасно.Каса client against the answers in data/knowledge_base/mock_vchasno.json: a sale
// receipt without VAT, a safe retry with the same tag after a collision, and a stop that
// needs a person.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mocks from "@/data/knowledge_base/mock_vchasno.json";
import { issueSaleReceipt } from "@/services/vchasno-kasa";
import type { ReceiptRequestBody, VchasnoRequest } from "@/types/integrations";
import type { VchasnoMocks } from "@/types/system";
import { stubFetch } from "./support/fetch-stub";

const KASA = mocks as VchasnoMocks;
const ORDER: ReceiptRequestBody = {
  orderNumber: "TL-1001",
  payment: "card",
  lines: [{ title: "Трафарет для торта «Троянди», 20 × 20 см", quantity: 2, unitPrice: 171 }],
};

beforeEach(() => {
  vi.stubEnv("VCHASNO_KASA_TOKEN", "test-token");
  vi.useFakeTimers({ shouldAdvanceTime: true, advanceTimeDelta: 500 });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Вчасно.Каса", () => {
  it("issues a receipt without VAT for the paid order", async () => {
    const calls = stubFetch(() => ({ json: KASA.saleOk }));
    expect(await issueSaleReceipt(ORDER)).toEqual({
      tag: "tl-TL-1001-sale", fiscalNumber: "TEST0000000001", receiptUrl: "https://kasa.vchasno.ua/c/TEST0000000001", offline: false,
    });
    const sent = calls[0].body as VchasnoRequest;
    expect(calls[0].headers.authorization).toBe("test-token");
    expect(sent.tag).toBe("tl-TL-1001-sale");
    expect(sent.fiscal?.receipt?.sum).toBe(342);
    // Tax group "2" = without VAT, from data/knowledge_base/rules_fop.json.
    expect(sent.fiscal?.receipt?.rows[0]).toMatchObject({ cnt: 2, price: 171, taxgrp: 2 });
    expect(sent.fiscal?.receipt?.pays[0]).toMatchObject({ type: 16, sum: 342 });
  });

  it("repeats the same tag after a collision, so no second receipt appears", async () => {
    const answers = [KASA.collision, KASA.saleOk];
    const calls = stubFetch(() => ({ json: answers.shift() }));
    const receipt = await issueSaleReceipt(ORDER);
    expect(receipt.fiscalNumber).toBe("TEST0000000001");
    expect(calls).toHaveLength(2);
    expect(calls.map((c) => (c.body as VchasnoRequest).tag)).toEqual(["tl-TL-1001-sale", "tl-TL-1001-sale"]);
  });

  it("stops at once when the cash register needs a person", async () => {
    const calls = stubFetch(() => ({ json: KASA.stop }));
    await expect(issueSaleReceipt(ORDER)).rejects.toThrow("Зміна не відкрита");
    expect(calls).toHaveLength(1);
  });
});
