// Reviews module service (types/reviews.ts). A review sent by an order link is added with one
// INSERT … ON CONFLICT DO NOTHING on (order_id, subject_key), so the same link sending the
// same review twice (a double tap, a repeated request) keeps the first one. Moved reviews
// are added the same way on (source, external_id), so the transfer can run again safely.

import type { Context } from "@medusajs/framework/types"
import type { EntityManager } from "@medusajs/framework/mikro-orm/knex"
import { generateEntityId, InjectManager, MedusaContext, MedusaService } from "@medusajs/framework/utils"
import Review from "./models/review"
import type { MovedReview, NewSiteReview, PublishedPage, PublishedQuery, ReviewModeration, ReviewRecord } from "../../types/reviews"
import type { ReviewStatus } from "../../shared/types/reviews"

const COLUMNS = `id, order_id, order_number, subject_key, product_handle, product_title, author_name, city, rating, text,
  photos, status, source, external_id, shop_reply, published_at, created_at`

const ADD_SITE_SQL = `
INSERT INTO tl_review (id, order_id, order_number, subject_key, product_handle, product_title, author_name, city, rating, text,
  photos, status, source, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '[]'::jsonb, 'pending', 'site', now(), now())
ON CONFLICT (order_id, subject_key) WHERE order_id IS NOT NULL AND deleted_at IS NULL DO NOTHING
RETURNING id`

const ADD_MOVED_SQL = `
INSERT INTO tl_review (id, subject_key, product_handle, product_title, author_name, city, rating, text,
  photos, status, source, external_id, published_at, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, '[]'::jsonb, 'approved', ?, ?, ?::timestamptz, now(), now())
ON CONFLICT (source, external_id) WHERE external_id IS NOT NULL AND deleted_at IS NULL DO NOTHING
RETURNING id`

/** WHERE part and its values for a published list of one subject (or of all). */
function subjectFilter(subject: string | undefined): { sql: string; values: string[] } {
  if (subject === undefined) return { sql: "", values: [] }
  if (subject === "order") return { sql: " AND subject_key = 'order'", values: [] }
  return { sql: " AND product_handle = ?", values: [subject] }
}

class ReviewModuleService extends MedusaService({ Review }) {
  /** Adds a review sent by an order link; null when this subject of the order already has one. */
  @InjectManager()
  async addSiteReview(input: NewSiteReview, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<string | null> {
    const rows = await sharedContext.manager!.execute<{ id: string }[]>(ADD_SITE_SQL, [
      generateEntityId(undefined, "rev"), input.orderId, input.orderNumber, input.subjectKey, input.productHandle, input.productTitle,
      input.name, input.city, input.rating, input.text,
    ])
    return rows[0]?.id ?? null
  }

  /** Adds a moved review once; false when it was moved before. */
  @InjectManager()
  async addMovedReview(input: MovedReview, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<boolean> {
    const rows = await sharedContext.manager!.execute<{ id: string }[]>(ADD_MOVED_SQL, [
      generateEntityId(undefined, "rev"), input.productHandle ?? "order", input.productHandle, input.productTitle, input.name, input.city,
      input.rating, input.text, input.source, input.externalId, input.publishedAt,
    ])
    return rows.length > 0
  }

  @InjectManager()
  async setReviewPhotos(id: string, photos: string[], @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<void> {
    await sharedContext.manager!.execute("UPDATE tl_review SET photos = ?::jsonb, updated_at = now() WHERE id = ?", [JSON.stringify(photos), id])
  }

  /** Subjects of the order that already have a review. */
  @InjectManager()
  async reviewedSubjects(orderId: string, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<string[]> {
    const rows = await sharedContext.manager!.execute<{ subject_key: string }[]>(
      "SELECT subject_key FROM tl_review WHERE order_id = ? AND deleted_at IS NULL", [orderId],
    )
    return rows.map((r) => r.subject_key)
  }

  @InjectManager()
  async findReview(id: string, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<ReviewRecord | null> {
    const [row] = await sharedContext.manager!.execute<ReviewRecord[]>(`SELECT ${COLUMNS} FROM tl_review WHERE id = ? AND deleted_at IS NULL`, [id])
    return row ?? null
  }

  /** Published reviews, newest first, with the count and average of the same subject. */
  @InjectManager()
  async listPublished(query: PublishedQuery, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<PublishedPage> {
    const filter = subjectFilter(query.subject)
    const where = `deleted_at IS NULL AND status = 'approved'${filter.sql}`
    const rows = await sharedContext.manager!.execute<ReviewRecord[]>(
      `SELECT ${COLUMNS} FROM tl_review WHERE ${where} ORDER BY published_at DESC NULLS LAST, created_at DESC LIMIT ? OFFSET ?`,
      [...filter.values, query.limit, query.offset],
    )
    const [stats] = await sharedContext.manager!.execute<{ count: string; average: string | null }[]>(
      `SELECT count(*) AS count, avg(rating) AS average FROM tl_review WHERE ${where}`, filter.values,
    )
    const count = Number(stats?.count ?? 0)
    return { rows, total: count, summary: { count, average: count ? Math.round(Number(stats?.average ?? 0) * 10) / 10 : 0 } }
  }

  /** Reviews of one status for «Відгуки», newest first, and how many each status has. */
  @InjectManager()
  async listForModeration(
    status: ReviewStatus, limit: number, offset: number, @MedusaContext() sharedContext: Context<EntityManager> = {},
  ): Promise<{ rows: ReviewRecord[]; total: number; counts: Record<ReviewStatus, number> }> {
    const rows = await sharedContext.manager!.execute<ReviewRecord[]>(
      `SELECT ${COLUMNS} FROM tl_review WHERE deleted_at IS NULL AND status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [status, limit, offset],
    )
    const grouped = await sharedContext.manager!.execute<{ status: ReviewStatus; count: string }[]>(
      "SELECT status, count(*) AS count FROM tl_review WHERE deleted_at IS NULL GROUP BY status",
    )
    const counts: Record<ReviewStatus, number> = { pending: 0, approved: 0, rejected: 0 }
    for (const g of grouped) counts[g.status] = Number(g.count)
    return { rows, total: counts[status], counts }
  }

  /**
   * Applies the manager's decision. Publication sets the date once; a review hidden and shown
   * again keeps its first date. Returns the review as it is now, or null when it is gone.
   */
  @InjectManager()
  async moderateReview(id: string, change: ReviewModeration, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<ReviewRecord | null> {
    const current = await this.findReview(id, sharedContext)
    if (!current) return null
    const photos = change.removePhotos?.length ? current.photos.filter((file) => !change.removePhotos!.includes(file)) : current.photos
    const status = change.status ?? current.status
    await sharedContext.manager!.execute(
      `UPDATE tl_review SET status = ?, text = ?, shop_reply = ?, photos = ?::jsonb,
         published_at = CASE WHEN ? = 'approved' AND published_at IS NULL THEN now() ELSE published_at END, updated_at = now()
       WHERE id = ?`,
      [status, change.text ?? current.text, change.shopReply === undefined ? current.shop_reply : change.shopReply, JSON.stringify(photos), status, id],
    )
    return this.findReview(id, sharedContext)
  }

  @InjectManager()
  async removeReview(id: string, @MedusaContext() sharedContext: Context<EntityManager> = {}): Promise<ReviewRecord | null> {
    const current = await this.findReview(id, sharedContext)
    if (!current) return null
    await sharedContext.manager!.execute("UPDATE tl_review SET deleted_at = now() WHERE id = ?", [id])
    return current
  }
}

export default ReviewModuleService
