// The tl_review table on a real PostgreSQL: one review per product per order, publication by
// the manager, the average of published reviews and moved reviews added only once.

import { medusaIntegrationTestRunner } from "@medusajs/test-utils"
import { REVIEW_MODULE } from "../../src/modules/review"
import type ReviewModuleService from "../../src/modules/review/service"
import type { NewSiteReview } from "../../src/types/reviews"

jest.setTimeout(60 * 1000)

const review = (orderId: string, subjectKey: string, rating: number): NewSiteReview => ({
  orderId, orderNumber: `TL-${orderId}`, subjectKey, productHandle: subjectKey === "order" ? null : subjectKey,
  productTitle: "Трафарет троянди", name: "Олена", city: "Київ", rating, text: "Чудовий трафарет, дякую!",
})

medusaIntegrationTestRunner({
  inApp: true,
  env: {},
  testSuite: ({ getContainer }) => {
    const store = () => getContainer().resolve<ReviewModuleService>(REVIEW_MODULE)

    describe("reviews", () => {
      it("keeps one review per product of an order, also for two requests at once", async () => {
        const ids = await Promise.all([store().addSiteReview(review("o1", "rose", 5)), store().addSiteReview(review("o1", "rose", 4))])
        expect(ids.filter(Boolean)).toHaveLength(1)
        expect(await store().addSiteReview(review("o1", "order", 5))).toEqual(expect.stringMatching(/^rev_/))
        expect((await store().reviewedSubjects("o1")).sort()).toEqual(["order", "rose"])
      })

      it("shows a review only after publication, with the average of the product", async () => {
        const a = (await store().addSiteReview(review("o2", "tulip", 5)))!
        const b = (await store().addSiteReview(review("o3", "tulip", 4)))!
        expect((await store().listPublished({ subject: "tulip", limit: 10, offset: 0 })).total).toBe(0)

        await store().setReviewPhotos(a, [`${a}-1.jpg`, `${a}-2.jpg`])
        const published = await store().moderateReview(a, { status: "approved", shopReply: "Дякуємо!", removePhotos: [`${a}-2.jpg`] })
        expect(published).toMatchObject({ status: "approved", shop_reply: "Дякуємо!", photos: [`${a}-1.jpg`] })
        const firstDate = published!.published_at
        expect(firstDate).not.toBeNull()
        await store().moderateReview(b, { status: "approved" })

        const page = await store().listPublished({ subject: "tulip", limit: 10, offset: 0 })
        expect(page.total).toBe(2)
        expect(page.summary).toEqual({ count: 2, average: 4.5 })

        await store().moderateReview(a, { status: "rejected" })
        expect((await store().listPublished({ subject: "tulip", limit: 10, offset: 0 })).summary).toEqual({ count: 1, average: 4 })
        const again = await store().moderateReview(a, { status: "approved" })
        expect(new Date(again!.published_at!).getTime()).toBe(new Date(firstDate!).getTime())

        const moderation = await store().listForModeration("approved", 30, 0)
        expect(moderation.counts.approved).toBeGreaterThanOrEqual(2)
        expect(await store().removeReview(b)).toMatchObject({ id: b })
        expect(await store().findReview(b)).toBeNull()
      })

      it("moves a review from the old shop only once, already published", async () => {
        const moved = {
          source: "topperok" as const, externalId: "tp-15", productHandle: "mandala", productTitle: "Мандала", name: "Ірина", city: null,
          rating: 5, text: "Гарна якість", publishedAt: "2025-05-01T10:00:00.000Z",
        }
        expect(await store().addMovedReview(moved)).toBe(true)
        expect(await store().addMovedReview(moved)).toBe(false)
        const page = await store().listPublished({ subject: "mandala", limit: 10, offset: 0 })
        expect(page.rows).toHaveLength(1)
        expect(page.rows[0]).toMatchObject({ source: "topperok", status: "approved", author_name: "Ірина" })
        expect(new Date(page.rows[0].published_at!).toISOString()).toBe("2025-05-01T10:00:00.000Z")
      })
    })
  },
})
