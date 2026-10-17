import { describe, expect, it } from "vitest";
import { base64Bytes } from "@/lib/reviews/base64-bytes";
import { cleanReviewText } from "@/lib/reviews/clean-review-text";
import { reviewJsonLd } from "@/lib/reviews/review-json-ld";
import { validateReviewInput } from "@/lib/reviews/validate-review";
import { jsonLdText } from "@/lib/seo/json-ld";
import type { ReviewListResponse } from "@/types/reviews";

const good = { key: "trafaret-troiandy", name: "  Олена ", city: "Київ", rating: 5, text: "Чудовий трафарет,\r\n\r\n\r\n\r\nдякую!", photos: [] as string[] };

describe("review input", () => {
  it("accepts a review and tidies its texts", () => {
    const check = validateReviewInput(good);
    expect(check).toEqual({ ok: true, value: { ...good, name: "Олена", text: "Чудовий трафарет,\n\nдякую!" } });
  });

  it("names every wrong field", () => {
    const check = validateReviewInput({ key: "../x", name: "A", city: "x".repeat(61), rating: 6, text: "ок", photos: ["!!"] });
    expect(check.ok).toBe(false);
    if (!check.ok) expect(Object.keys(check.errors).sort()).toEqual(["city", "key", "name", "photos", "rating", "text"]);
  });

  it("refuses more than five photos and a photo over 3 MB", () => {
    const tiny = Buffer.from([0xff, 0xd8, 0xff, 0xe0]).toString("base64");
    expect(validateReviewInput({ ...good, photos: Array(6).fill(tiny) }).ok).toBe(false);
    expect(validateReviewInput({ ...good, photos: ["A".repeat(4 * 1024 * 1024 + 8)] }).ok).toBe(false);
    expect(validateReviewInput({ ...good, photos: [tiny] }).ok).toBe(true);
  });

  it("counts base64 bytes and cleans control characters", () => {
    expect(base64Bytes(Buffer.from("hello!").toString("base64"))).toBe(6);
    expect(base64Bytes(Buffer.from("hi").toString("base64"))).toBe(2);
    expect(cleanReviewText("a\tb\u0000c   d", false)).toBe("a b c d");
    expect(cleanReviewText(42, true)).toBe("");
  });
});

describe("review markup", () => {
  const list: ReviewListResponse = {
    reviews: [{ id: "rev_1", productHandle: "p", productTitle: "P", name: "Олена", city: null, rating: 4, text: "</script><img src=x>", photos: [], shopReply: null, publishedAt: "2026-10-14T09:00:00.000Z", source: "site" }],
    summary: { count: 1, average: 4 },
    total: 1,
  };

  it("adds the rating only when there are reviews", () => {
    expect(reviewJsonLd({ ...list, reviews: [], summary: { count: 0, average: 0 }, total: 0 })).toEqual({});
    expect(reviewJsonLd(list)).toMatchObject({
      aggregateRating: { ratingValue: 4, reviewCount: 1 },
      review: [{ author: { name: "Олена" }, datePublished: "2026-10-14", reviewRating: { ratingValue: 4 } }],
    });
  });

  it("keeps a customer text from closing the script block", () => {
    const text = jsonLdText(reviewJsonLd(list));
    expect(text).not.toContain("</script>");
    expect(text).not.toContain("<img");
    expect(JSON.parse(text).review[0].reviewBody).toBe("</script><img src=x>");
  });
});
