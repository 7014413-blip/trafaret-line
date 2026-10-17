import { createHash, createHmac } from "node:crypto"
import { TELEGRAM_LOGIN_MAX_AGE_S, verifyTelegramLogin } from "../verify-telegram-login"
import { googleProfile, GOOGLE_TOKEN_URL, GOOGLE_USERINFO_URL } from "../google-login"
import { telegramProfile, isTelegramEmail } from "../telegram-profile"
import { signInCustomer, toAccountCustomer } from "../account-customer"
import { orderStage } from "../order-stage"
import { previewImageUrl } from "../preview-image-url"
import { REPEAT_PROBLEMS, repeatItem } from "../repeat-line"
import type { AccountOrderRecord, CustomerRecord, CustomerStore } from "../../../types/account"
import type { VariantPrice } from "../../../types/order-pricing"

const BOT_TOKEN = "123456789:test-token"
const NOW = 1_800_000_000

function signedTelegram(fields: Record<string, string | number>): Record<string, string | number> {
  const check = Object.keys(fields).sort().map((k) => `${k}=${fields[k]}`).join("\n")
  const secret = createHash("sha256").update(BOT_TOKEN).digest()
  return { ...fields, hash: createHmac("sha256", secret).update(check).digest("hex") }
}

describe("verifyTelegramLogin", () => {
  const fields = { id: 42, first_name: "Олена", last_name: "Коваль", username: "olena", auth_date: NOW - 10 }

  it("accepts data signed with the bot token", () => {
    expect(verifyTelegramLogin(signedTelegram(fields), BOT_TOKEN, NOW)).toEqual({ id: 42, firstName: "Олена", lastName: "Коваль", username: "olena", authDate: NOW - 10 })
  })

  it("refuses a changed field, another bot and stale data", () => {
    const data = signedTelegram(fields)
    expect(verifyTelegramLogin({ ...data, id: 43 }, BOT_TOKEN, NOW)).toBeNull()
    expect(verifyTelegramLogin(data, "987:other", NOW)).toBeNull()
    expect(verifyTelegramLogin(data, BOT_TOKEN, NOW + TELEGRAM_LOGIN_MAX_AGE_S + 60)).toBeNull()
    expect(verifyTelegramLogin({ ...data, hash: "x" }, BOT_TOKEN, NOW)).toBeNull()
    expect(verifyTelegramLogin(null, BOT_TOKEN, NOW)).toBeNull()
  })

  it("refuses data from the future", () => {
    expect(verifyTelegramLogin(signedTelegram({ ...fields, auth_date: NOW + 3600 }), BOT_TOKEN, NOW)).toBeNull()
  })

  it("gives a Telegram account its own cabinet address", () => {
    const profile = telegramProfile({ id: 42, firstName: "Олена", lastName: "", username: null, authDate: NOW })
    expect(profile.email).toBe("tg42@telegram.trafaret-line.com.ua")
    expect(isTelegramEmail(profile.email)).toBe(true)
    expect(isTelegramEmail("olena@gmail.com")).toBe(false)
  })
})

describe("googleProfile", () => {
  const client = { clientId: "id", clientSecret: "secret" }
  function fakeFetch(info: Record<string, unknown>, tokenStatus = 200): { fetch: typeof fetch; calls: { url: string; body?: string }[] } {
    const calls: { url: string; body?: string }[] = []
    const impl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, body: init?.body as string | undefined })
      if (url === GOOGLE_TOKEN_URL) return new Response(JSON.stringify({ access_token: "at" }), { status: tokenStatus })
      if (url === GOOGLE_USERINFO_URL) return new Response(JSON.stringify(info), { status: 200 })
      return new Response("", { status: 404 })
    }) as unknown as typeof fetch
    return { fetch: impl, calls }
  }

  it("exchanges the code and reads the verified e-mail", async () => {
    const { fetch, calls } = fakeFetch({ email: "Olena@Gmail.com", email_verified: true, given_name: "Олена", family_name: "Коваль" })
    const profile = await googleProfile("c0de", "https://trafaret-line.com.ua/api/kabinet/google/callback", client, fetch)
    expect(profile).toEqual({ provider: "google", email: "olena@gmail.com", firstName: "Олена", lastName: "Коваль" })
    expect(new URLSearchParams(calls[0].body).get("client_secret")).toBe("secret")
    expect(new URLSearchParams(calls[0].body).get("grant_type")).toBe("authorization_code")
  })

  it("refuses an unverified e-mail and a refused code", async () => {
    expect(await googleProfile("c", "https://x/api/kabinet/google/callback", client, fakeFetch({ email: "a@b.com", email_verified: false }).fetch)).toBeNull()
    expect(await googleProfile("c", "https://x/api/kabinet/google/callback", client, fakeFetch({ email: "a@b.com", email_verified: true }, 400).fetch)).toBeNull()
  })
})

class FakeCustomers implements CustomerStore {
  rows: CustomerRecord[] = []
  async listCustomers(filters: Record<string, unknown>) {
    return this.rows.filter((r) => Object.entries(filters).every(([k, v]) => (r as unknown as Record<string, unknown>)[k] === v))
  }
  async createCustomers(data: Record<string, unknown>) {
    const row = { id: `cus_${this.rows.length + 1}`, first_name: null, last_name: null, metadata: null, ...data } as CustomerRecord
    this.rows.push(row)
    return row
  }
  async updateCustomers(id: string, data: Record<string, unknown>) {
    const row = this.rows.find((r) => r.id === id)!
    Object.assign(row, data)
    return row
  }
}

describe("signInCustomer", () => {
  it("creates a registered customer once and keeps a guest with the same e-mail apart", async () => {
    const store = new FakeCustomers()
    store.rows.push({ id: "cus_guest", email: "olena@gmail.com", first_name: null, last_name: null, has_account: false })
    const profile = { provider: "google" as const, email: "olena@gmail.com", firstName: "Олена", lastName: "Коваль" }
    const first = await signInCustomer(store, profile)
    const second = await signInCustomer(store, { ...profile, firstName: "Інше" })
    expect(first.id).toBe(second.id)
    expect(first.id).not.toBe("cus_guest")
    expect(second.first_name).toBe("Олена")
    expect(store.rows.filter((r) => r.has_account)).toHaveLength(1)
    expect(toAccountCustomer(second)).toEqual({ id: first.id, firstName: "Олена", lastName: "Коваль", email: "olena@gmail.com", provider: "google" })
  })

  it("hides the cabinet address of a Telegram account", async () => {
    const store = new FakeCustomers()
    const customer = await signInCustomer(store, telegramProfile({ id: 7, firstName: "Петро", lastName: "", username: "petro", authDate: NOW }))
    expect(customer.metadata).toMatchObject({ login: "telegram", telegramId: 7, telegramUsername: "petro" })
    expect(toAccountCustomer(customer).email).toBeNull()
  })
})

describe("orderStage", () => {
  const order = (patch: Partial<AccountOrderRecord>): AccountOrderRecord => ({
    id: "order_1", display_id: 1, customer_id: "cus_1", status: "pending", created_at: "2026-10-16T10:00:00Z", ...patch,
  })

  it("follows payment, shipping and cancelling", () => {
    expect(orderStage(order({ metadata: { payment: "cod" } })).stage).toBe("accepted")
    expect(orderStage(order({ metadata: { payment: "card" } }))).toMatchObject({ stage: "awaiting_payment", statusText: "Чекає на оплату карткою" })
    expect(orderStage(order({ metadata: { payment: "card", paid: true } })).stage).toBe("paid")
    expect(orderStage(order({ metadata: { payment: "cod", ttn: "2045 0012 3456 78" } }))).toMatchObject({ stage: "shipped", ttn: "20450012345678" })
    expect(orderStage(order({ status: "canceled", metadata: { ttn: "20450012345678" } }))).toMatchObject({ stage: "cancelled", ttn: null })
  })

  it("takes the parcel number from a fulfillment label and ignores cancelled fulfillments", () => {
    expect(orderStage(order({ fulfillments: [{ labels: [{ tracking_number: "59000123456789" }] }] })).ttn).toBe("59000123456789")
    expect(orderStage(order({ fulfillments: [{ canceled_at: "2026-10-16", labels: [{ tracking_number: "59000123456789" }] }] })).stage).toBe("accepted")
    expect(orderStage(order({ metadata: { ttn: "не знаю" } })).ttn).toBeNull()
  })
})

describe("repeatItem", () => {
  const variants = new Map<string, VariantPrice>([["variant_1", { title: "Трафарет «Мандала», 30×30 см", sku: "TL-1", price: 200, sheetMm: [300, 300], hole: null }]])
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>'

  it("prices a catalogue line again with today's price at quantity 1 for the cart", () => {
    const result = repeatItem({ id: "item_1", title: "old", quantity: 10, unit_price: 180, metadata: { kind: "catalog", key: "catalog-variant_1", variantId: "variant_1", materialId: "pet_thin" } }, variants, true)
    expect(result.repeatProblem).toBeNull()
    expect(result.repeat).toMatchObject({ key: "catalog-variant_1", kind: "catalog", variantId: "variant_1", quantity: 10, basePrice: 200, title: "Трафарет «Мандала», 30×30 см" })
    expect(result.priceNow).toBeLessThan(200)
  })

  it("keeps accessories at their fixed price", () => {
    const result = repeatItem({ id: "item_2", title: "Валик", quantity: 2, unit_price: 85, metadata: { kind: "accessory", key: "upsell-valyk" } }, variants, true)
    expect(result.repeat).toMatchObject({ fixedPrice: 85, basePrice: undefined })
  })

  it("explains lines that cannot be repeated", () => {
    expect(repeatItem({ id: "i", title: "x", quantity: 1, unit_price: 1, metadata: null }, variants, true).repeatProblem).toBe(REPEAT_PROBLEMS.manual)
    expect(repeatItem({ id: "i", title: "x", quantity: 1, unit_price: 1, metadata: { kind: "catalog", variantId: "variant_gone" } }, variants, true).repeatProblem).toBe(REPEAT_PROBLEMS.offSale)
    expect(repeatItem({ id: "i", title: "x", quantity: 1, unit_price: 1, metadata: { kind: "stencil", materialId: "pet_thin", widthCm: 30, heightCm: 20 } }, variants, true).repeatProblem).toBe(REPEAT_PROBLEMS.rebuild)
  })

  it("gives the constructor picture back to the cart only for the customer's own orders", () => {
    const item = { id: "item_3", title: "Трафарет за макетом", quantity: 1, unit_price: 300, metadata: { kind: "stencil", materialId: "pet_thin", widthCm: 30, heightCm: 20, uploadKey: "2026-10-16/x.pdf", previewSvg: svg } }
    expect(repeatItem(item, variants, true).repeat?.vectorSvg).toBe(svg)
    expect(repeatItem(item, variants, false).repeat?.vectorSvg).toBeUndefined()
    expect(repeatItem(item, variants, false).repeat?.thumbnail).toMatch(/^data:image\/svg\+xml;base64,/)
  })
})

describe("previewImageUrl", () => {
  it("prefers the product photo and refuses anything that is not an http photo or an SVG", () => {
    expect(previewImageUrl({ id: "i", title: "", quantity: 1, unit_price: 1, thumbnail: "https://cdn/x.jpg" })).toBe("https://cdn/x.jpg")
    expect(previewImageUrl({ id: "i", title: "", quantity: 1, unit_price: 1, thumbnail: "javascript:alert(1)", metadata: { previewSvg: "<script/>" } })).toBeNull()
  })
})
