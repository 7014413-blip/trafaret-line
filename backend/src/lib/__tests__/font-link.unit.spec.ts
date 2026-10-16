import { fontLink, isValidFontLink } from "../text/font-link"

const KEY = "2026-10-16/0b5c1d1e-1234-4abc-8def-0123456789ab.ttf"

function parts(link: string): { key: string; exp: string; sig: string } {
  const query = new URLSearchParams(link.split("?")[1])
  return { key: query.get("key") ?? "", exp: query.get("exp") ?? "", sig: query.get("sig") ?? "" }
}

describe("signed font link", () => {
  const saved = process.env.INTERNAL_API_TOKEN
  beforeEach(() => { process.env.INTERNAL_API_TOKEN = "test-secret" })
  afterAll(() => { process.env.INTERNAL_API_TOKEN = saved })

  it("opens the font it was made for", () => {
    const link = parts(fontLink(KEY) ?? "")
    expect(link.key).toBe(KEY)
    expect(isValidFontLink(link.key, link.exp, link.sig)).toBe(true)
  })

  it("does not open another font or a changed expiry", () => {
    const link = parts(fontLink(KEY) ?? "")
    expect(isValidFontLink(KEY.replace("ab.ttf", "ac.ttf"), link.exp, link.sig)).toBe(false)
    expect(isValidFontLink(link.key, String(Number(link.exp) + 1), link.sig)).toBe(false)
  })

  it("expires after 30 days", () => {
    const now = Date.now()
    const link = parts(fontLink(KEY, now) ?? "")
    expect(isValidFontLink(link.key, link.exp, link.sig, now + 29 * 86_400_000)).toBe(true)
    expect(isValidFontLink(link.key, link.exp, link.sig, now + 31 * 86_400_000)).toBe(false)
  })

  it("gives no link without the server secret", () => {
    delete process.env.INTERNAL_API_TOKEN
    expect(fontLink(KEY)).toBeNull()
  })
})
