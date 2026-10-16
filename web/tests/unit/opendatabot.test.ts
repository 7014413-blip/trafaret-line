// Opendatabot client against the answers in data/knowledge_base/mock_opendatabot.json:
// requisites of a company by ЄДРПОУ and of a ФОП by РНОКПП for B2B invoices.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import mocks from "@/data/knowledge_base/mock_opendatabot.json";
import { lookupBusiness } from "@/services/opendatabot";
import type { OpendatabotMocks } from "@/types/system";
import { stubFetch } from "./support/fetch-stub";

const ODB = mocks as OpendatabotMocks;

beforeEach(() => vi.stubEnv("OPENDATABOT_API_KEY", "test-key"));
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Opendatabot", () => {
  it("fills a company invoice from ЄДРПОУ", async () => {
    const calls = stubFetch(() => ({ json: ODB.company }));
    expect(await lookupBusiness(ODB.company.code)).toEqual({
      form: "company",
      code: "12345678",
      name: "ТОВАРИСТВО З ОБМЕЖЕНОЮ ВІДПОВІДАЛЬНІСТЮ «ТЕСТОВА КАВʼЯРНЯ»",
      shortName: "ТОВ «ТЕСТОВА КАВʼЯРНЯ»",
      address: "01001, м. Київ, вул. Тестова, 1",
      director: "Петренко Іван Миколайович",
      vatPayer: true,
      registryStatus: "зареєстровано",
    });
    expect(calls[0].url).toBe("https://opendatabot.com/api/v4/company/12345678?apiKey=test-key");
  });

  it("fills a ФОП invoice from РНОКПП", async () => {
    stubFetch(() => ({ json: ODB.fop }));
    expect(await lookupBusiness(ODB.fop.code)).toMatchObject({
      form: "fop", name: "ФОП Тестенко Олена Іванівна", vatPayer: false, email: "fop@example.com", phone: "+380670000000",
    });
  });

  it("returns null for a code the registry does not know", async () => {
    stubFetch(() => ({ status: 404, json: { message: "not found" } }));
    expect(await lookupBusiness("87654321")).toBeNull();
  });

  it("refuses a code of the wrong length before paying for a request", async () => {
    const calls = stubFetch(() => ({ json: ODB.company }));
    await expect(lookupBusiness("123")).rejects.toThrow("8 (ЄДРПОУ) or 10 (РНОКПП) digits");
    expect(calls).toHaveLength(0);
  });
});
