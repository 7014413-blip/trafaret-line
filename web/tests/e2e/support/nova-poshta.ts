// What the checkout shows for the Nova Poshta answers in data/knowledge_base/mock_novaposhta.json:
// the mock shop answers the site's server in their place (NP_API_URL in playwright.config.ts),
// so the site's own /api/novaposhta routes and their mapping run in the tests.

import mocks from "../../../data/knowledge_base/mock_novaposhta.json";
import type { NovaPoshtaMocks } from "../../../types/system";

const NP = mocks as NovaPoshtaMocks;
const city = NP.searchSettlements.data[0].Addresses[0];
const [branch, locker] = NP.getWarehouses.data;
const price = NP.getDocumentPrice.data[0];

export const KYIV = { label: city.Present, cityRef: city.DeliveryCity };
export const BRANCH = { ref: branch.Ref, option: `Відділення №${branch.Number}: ${branch.ShortAddress}`, label: branch.Description };
export const LOCKER = { option: `Поштомат №${locker.Number}: ${locker.ShortAddress}` };
/** Delivery cost and the cash-on-delivery fee, UAH. */
export const DELIVERY = { cost: price.Cost, codFee: price.CostRedelivery ?? 0 };
