// Customer cabinet on a real Medusa and PostgreSQL: Medusa's own e-mail sign-up is closed, a
// Telegram sign-in gives a session, a checkout with the account token lands in «Мої замовлення»
// with «Повторити», and a guest checkout does not.

import { createHash, createHmac } from "node:crypto"
import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { Modules } from "@medusajs/framework/utils"
import { createApiKeysWorkflow, createRegionsWorkflow, createSalesChannelsWorkflow, linkSalesChannelsToApiKeyWorkflow } from "@medusajs/medusa/core-flows"
import { makeAccountToken } from "../../src/shared/lib/account/account-token"
import type { AccountOrdersResponse, AccountSignInResponse } from "../../src/shared/types/account"

jest.setTimeout(120 * 1000)

const BOT_TOKEN = "123456789:integration"
const SECRET = "integration-secret"
process.env.TELEGRAM_LOGIN_BOT_TOKEN = BOT_TOKEN
process.env.INTERNAL_API_TOKEN = SECRET

function telegramData(id: number): Record<string, string | number> {
  const fields: Record<string, string | number> = { id, first_name: "Олена", last_name: "Коваль", auth_date: Math.floor(Date.now() / 1000) }
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("\n")
  return { ...fields, hash: createHmac("sha256", createHash("sha256").update(BOT_TOKEN).digest()).update(check).digest("hex") }
}

const order = (accountToken?: string) => ({
  lines: [{ key: "upsell-valyk", kind: "accessory", title: "Валик", quantity: 2 }],
  contact: { phone: "+380501234567", name: "Олена Коваль" },
  delivery: { method: "np_branch", city: "Київ", warehouse: "Відділення №1" },
  payment: "cod",
  accountToken,
})

medusaIntegrationTestRunner({
  inApp: true,
  env: { TELEGRAM_LOGIN_BOT_TOKEN: BOT_TOKEN, INTERNAL_API_TOKEN: SECRET },
  testSuite: ({ api, getContainer }) => {
    async function storeHeaders(): Promise<Record<string, string>> {
      const container = getContainer()
      const { result: [channel] } = await createSalesChannelsWorkflow(container).run({ input: { salesChannelsData: [{ name: "Trafaret Line" }] } })
      const { result: [key] } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "storefront", type: "publishable", created_by: "test" }] } })
      await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } })
      await createRegionsWorkflow(container).run({ input: { regions: [{ name: "Україна", currency_code: "uah", countries: ["ua"], payment_providers: ["pp_system_default"] }] } })
      return { "x-publishable-api-key": key.token }
    }

    describe("cabinet", () => {
      it("closes Medusa's own customer sign-up", async () => {
        const headers = await storeHeaders()
        const register = await api.post("/auth/customer/emailpass/register", { email: "a@b.com", password: "secret123" }).catch((e) => e.response)
        expect(register.status).toBe(404)
        const create = await api.post("/store/customers", { email: "a@b.com" }, { headers }).catch((e) => e.response)
        // Medusa asks for a sign-up token here, and nobody can get one any more.
        expect(create.status).toBe(401)
        const orders = await api.get("/store/tl-account/orders", { headers }).catch((e) => e.response)
        expect(orders.status).toBe(401)
      })

      it("signs in with Telegram and shows the orders placed signed in", async () => {
        const headers = await storeHeaders()
        const refused = await api.post("/store/tl-account/telegram", { data: { ...telegramData(42), id: 43 } }, { headers }).catch((e) => e.response)
        expect(refused.status).toBe(401)

        const signedIn = (await api.post("/store/tl-account/telegram", { data: telegramData(42) }, { headers })).data as AccountSignInResponse
        expect(signedIn.customer).toMatchObject({ firstName: "Олена", lastName: "Коваль", email: null, provider: "telegram" })
        const again = (await api.post("/store/tl-account/telegram", { data: telegramData(42) }, { headers })).data as AccountSignInResponse
        expect(again.customer.id).toBe(signedIn.customer.id)

        await api.post("/store/tl-checkout", order(makeAccountToken("checkout", signedIn.customer.id, SECRET)), { headers })
        await api.post("/store/tl-checkout", order(), { headers })

        const data = (await api.get("/store/tl-account/orders", { headers: { ...headers, "x-tl-account": signedIn.session } })).data as AccountOrdersResponse
        expect(data.orders).toHaveLength(1)
        expect(data.orders[0]).toMatchObject({ stage: "accepted", total: 170, ttn: null })
        expect(data.orders[0].items[0]).toMatchObject({ title: "Валик поролоновий 10 см", quantity: 2, priceNow: 85, repeatProblem: null })
        expect(data.orders[0].items[0].repeat).toMatchObject({ key: "upsell-valyk", kind: "accessory", fixedPrice: 85, quantity: 2 })

        const customers = getContainer().resolve(Modules.CUSTOMER)
        const [customer] = await customers.listCustomers({ id: signedIn.customer.id })
        expect(customer.has_account).toBe(true)
      })
    })
  },
})
