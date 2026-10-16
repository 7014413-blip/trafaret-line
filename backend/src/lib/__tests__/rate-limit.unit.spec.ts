import type { MedusaRequest } from "@medusajs/framework/http"
import { clientAddress, takeLimit } from "../rate-limit"

function request(headers: Record<string, string | string[]>, remoteAddress = "10.0.0.9"): MedusaRequest {
  return { headers, socket: { remoteAddress } } as unknown as MedusaRequest
}

describe("clientAddress", () => {
  it("prefers x-real-ip set by nginx", () => {
    expect(clientAddress(request({ "x-real-ip": "198.51.100.7", "x-forwarded-for": "203.0.113.1, 198.51.100.7" }))).toBe("198.51.100.7")
  })

  it("takes the last x-forwarded-for entry, which the proxy appended", () => {
    expect(clientAddress(request({ "x-forwarded-for": "203.0.113.1, 203.0.113.2, 198.51.100.7" }))).toBe("198.51.100.7")
  })

  it("ignores forged leading x-forwarded-for entries", () => {
    const first = clientAddress(request({ "x-forwarded-for": "203.0.113.1, 198.51.100.7" }))
    const second = clientAddress(request({ "x-forwarded-for": "203.0.113.2, 198.51.100.7" }))
    expect(first).toBe(second)
  })

  it("falls back to the socket address", () => {
    expect(clientAddress(request({}))).toBe("10.0.0.9")
  })
})

describe("takeLimit", () => {
  const rule = { name: "checkout-test", limit: 5, windowMs: 10 * 60_000 }

  it("refuses the sixth call in the window and frees it after the window", () => {
    const start = 1_000_000
    const waits = Array.from({ length: 6 }, (_, i) => takeLimit("checkout-test:a", rule, 0, start + i))
    expect(waits.slice(0, 5)).toEqual([0, 0, 0, 0, 0])
    expect(waits[5]).toBeGreaterThan(0)
    expect(takeLimit("checkout-test:a", rule, 0, start + rule.windowMs + 10)).toBe(0)
  })

  it("counts body bytes against maxBytes", () => {
    const bytesRule = { name: "upload-test", limit: 10, windowMs: 60_000, maxBytes: 100 }
    expect(takeLimit("upload-test:a", bytesRule, 60, 5_000_000)).toBe(0)
    expect(takeLimit("upload-test:a", bytesRule, 60, 5_000_001)).toBeGreaterThan(0)
  })
})
