import fsp from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import { cleanReviewPhoto } from "../reviews/clean-review-photo"
import { readReviewPhoto } from "../reviews/read-review-photo"
import { reviewLink, reviewTokenValid } from "../reviews/review-link"
import { orderReviewSubjects } from "../reviews/review-subjects"
import { saveReviewPhotos } from "../reviews/save-review-photos"
import { validateModeration } from "../reviews/validate-moderation"

const segment = (marker: number, body: Buffer) => {
  const head = Buffer.alloc(4)
  head.writeUInt16BE(0xff00 | marker, 0)
  head.writeUInt16BE(body.length + 2, 2)
  return Buffer.concat([head, body])
}

// SOI, JFIF, EXIF with a GPS note, ICC profile, a comment, a quant table, SOS with data, EOI.
const JPEG = Buffer.concat([
  Buffer.from([0xff, 0xd8]),
  segment(0xe0, Buffer.from("JFIF\0\x01\x01\0\0\x01\0\x01\0\0", "latin1")),
  segment(0xe1, Buffer.from("Exif\0\0GPS 50.45N 30.52E", "latin1")),
  segment(0xe2, Buffer.from("ICC_PROFILE\0\x01\x01profile", "latin1")),
  segment(0xfe, Buffer.from("taken at home", "latin1")),
  segment(0xdb, Buffer.alloc(65, 1)),
  segment(0xda, Buffer.from([1, 2, 3])),
  Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd9]),
])

const chunk = (type: string, data: Buffer) => {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  return Buffer.concat([length, Buffer.from(type, "latin1"), data, Buffer.alloc(4)])
}
const PNG = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", Buffer.alloc(13, 1)),
  chunk("tEXt", Buffer.from("Comment\0secret", "latin1")),
  chunk("eXIf", Buffer.from("MM\0*GPS", "latin1")),
  chunk("IDAT", Buffer.alloc(10, 7)),
  chunk("IEND", Buffer.alloc(0)),
])

describe("review photos", () => {
  it("drops EXIF, comments and text chunks and keeps the picture", () => {
    const jpeg = cleanReviewPhoto(JPEG)!
    expect(jpeg.ext).toBe("jpg")
    expect(jpeg.data.includes(Buffer.from("GPS"))).toBe(false)
    expect(jpeg.data.includes(Buffer.from("taken at home"))).toBe(false)
    expect(jpeg.data.includes(Buffer.from("ICC_PROFILE"))).toBe(true)
    expect(jpeg.data.includes(Buffer.from("JFIF"))).toBe(true)
    expect(jpeg.data.subarray(-7)).toEqual(Buffer.from([0x12, 0x34, 0xff, 0x00, 0x56, 0xff, 0xd9]))

    const png = cleanReviewPhoto(PNG)!
    expect(png.ext).toBe("png")
    expect(png.data.includes(Buffer.from("secret"))).toBe(false)
    expect(png.data.includes(Buffer.from("GPS"))).toBe(false)
    expect(png.data.includes(Buffer.from("IDAT"))).toBe(true)
  })

  it("refuses files that are not a whole JPEG or PNG", () => {
    expect(cleanReviewPhoto(Buffer.from("GIF89a....."))).toBeNull()
    expect(cleanReviewPhoto(JPEG.subarray(0, 30))).toBeNull()
    expect(cleanReviewPhoto(PNG.subarray(0, 40))).toBeNull()
  })

  it("saves photos as <review>-<n> and reads them back by name only", async () => {
    const root = await fsp.mkdtemp(path.join(os.tmpdir(), "tl-reviews-"))
    try {
      const names = await saveReviewPhotos("rev_01ABC", [JPEG, Buffer.from("not a photo"), PNG], root)
      expect(names).toEqual(["rev_01ABC-1.jpg", "rev_01ABC-2.png"])
      expect((await readReviewPhoto("rev_01ABC-2.png", root))?.type).toBe("image/png")
      expect(await readReviewPhoto("../rev_01ABC-1.jpg", root)).toBeNull()
      expect(await readReviewPhoto("rev_01ABC-9.jpg", root)).toBeNull()
    } finally {
      await fsp.rm(root, { recursive: true, force: true })
    }
  })
})

describe("review link", () => {
  const saved = { secret: process.env.INTERNAL_API_TOKEN, shop: process.env.STOREFRONT_URL }
  afterEach(() => {
    process.env.INTERNAL_API_TOKEN = saved.secret
    process.env.STOREFRONT_URL = saved.shop
  })

  it("signs the order id and accepts only its own token", () => {
    process.env.INTERNAL_API_TOKEN = "secret-1"
    process.env.STOREFRONT_URL = "https://trafaret-line.com.ua/"
    const url = new URL(reviewLink("order_01")!)
    expect(url.origin + url.pathname).toBe("https://trafaret-line.com.ua/vidguk/order_01")
    const token = url.searchParams.get("t")!
    expect(reviewTokenValid("order_01", token)).toBe(true)
    expect(reviewTokenValid("order_02", token)).toBe(false)
    expect(reviewTokenValid("order_01", token.slice(1))).toBe(false)
    expect(reviewTokenValid("order_01", ["x"])).toBe(false)
    process.env.INTERNAL_API_TOKEN = ""
    expect(reviewLink("order_01")).toBeNull()
    expect(reviewTokenValid("order_01", token)).toBe(false)
  })
})

describe("review subjects of an order", () => {
  const graph = (order: unknown) => async () => ({ data: order ? [order] : [] })

  it("offers each catalogue product once and the made-to-order items as one", async () => {
    const result = await orderReviewSubjects(graph({
      id: "order_1", display_id: 77, status: "pending",
      items: [
        { title: "Троянди 20 × 20", product_title: "Трафарет троянди", product_handle: "trafaret-troiandy", thumbnail: "/static/rose.jpg", metadata: { kind: "catalog" } },
        { title: "Троянди 30 × 30", product_title: "Трафарет троянди", product_handle: "trafaret-troiandy", thumbnail: "/static/rose.jpg", metadata: { kind: "catalog" } },
        { title: "Свій напис «КАВА»", metadata: { kind: "stencil" } },
        { title: "Табличка на двері", metadata: { kind: "layered" } },
        { title: "Номерок", thumbnail: "/static/n.jpg", metadata: { kind: "layered" } },
      ],
    }), "order_1")
    expect(result).toEqual({
      orderId: "order_1",
      orderNumber: "TL-77",
      subjects: [
        { key: "trafaret-troiandy", productHandle: "trafaret-troiandy", title: "Трафарет троянди", image: "/static/rose.jpg" },
        { key: "order", productHandle: null, title: "Свій напис «КАВА», Табличка на двері та ще 1", image: "/static/n.jpg" },
      ],
    })
  })

  it("has nothing to review in a missing or cancelled order", async () => {
    expect(await orderReviewSubjects(graph(null), "x")).toBeNull()
    expect(await orderReviewSubjects(graph({ id: "o", display_id: 1, status: "canceled", items: [] }), "o")).toBeNull()
  })
})

describe("moderation input", () => {
  it("accepts a decision and refuses wrong values", () => {
    expect(validateModeration({ status: "approved", text: " Дуже  добре ", shopReply: "", removePhotos: ["rev_1-1.jpg"] }))
      .toEqual({ ok: true, value: { status: "approved", text: "Дуже добре", shopReply: null, removePhotos: ["rev_1-1.jpg"] } })
    expect(validateModeration({ status: "published" }).ok).toBe(false)
    expect(validateModeration({ text: "   " }).ok).toBe(false)
    expect(validateModeration({ shopReply: "x".repeat(2001) }).ok).toBe(false)
    expect(validateModeration({ removePhotos: [1] }).ok).toBe(false)
    expect(validateModeration({})).toEqual({ ok: true, value: {} })
  })
})
