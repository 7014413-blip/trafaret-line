// tl_review: one review of a product (or of the order as a whole) from one order; the
// unique (order_id, subject_key) keeps a link from sending the same review twice. Moved
// reviews have no order and are unique by their source and id on the old site.

import { model } from "@medusajs/framework/utils"

const Review = model
  .define("tl_review", {
    id: model.id({ prefix: "rev" }).primaryKey(),
    order_id: model.text().nullable(),
    order_number: model.text().nullable(),
    subject_key: model.text(),
    product_handle: model.text().nullable(),
    product_title: model.text().nullable(),
    author_name: model.text(),
    city: model.text().nullable(),
    rating: model.number(),
    text: model.text(),
    photos: model.json(),
    status: model.enum(["pending", "approved", "rejected"]).default("pending"),
    source: model.enum(["site", "topperok", "eventdecor"]).default("site"),
    external_id: model.text().nullable(),
    shop_reply: model.text().nullable(),
    published_at: model.dateTime().nullable(),
  })
  .indexes([
    { on: ["order_id", "subject_key"], unique: true, where: "order_id IS NOT NULL AND deleted_at IS NULL" },
    { on: ["source", "external_id"], unique: true, where: "external_id IS NOT NULL AND deleted_at IS NULL" },
    { on: ["status", "product_handle"] },
  ])

export default Review
