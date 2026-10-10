/**
 * Заявка в спільну чергу конвеєра товарів.
 * Схема задана в research/avto-konveier-tovariv.md («Черга заявок: шлях і схема»).
 * Бот пише лише intake.json, photos/ і layout/; status.json пише конвеєр
 * (бот створює його один раз зі статусом "new").
 */

export type IntakeSource = "telegram" | "scout"
export type IntakePriority = "now" | "batch"
export type ProductKind = "custom" | "ready" | "blank"
export type PublishMode = "button" | "auto"

export type IntakeStatusValue =
  | "new"
  | "brief"
  | "render"
  | "qa"
  | "draft"
  | "published"
  | "rejected"

export interface IntakeRef {
  url: string
  marketplace: string
  price: number | null
  reviews: number | null
  phash: string | null
}

export interface IntakeProduct {
  kind: ProductKind | null
  category_handle: string | null
  title_uk: string | null
  title_ru: string | null
  text_on_stencil: string | null
  material: string | null
  sizes_mm: Array<[number, number]>
  price_uah: number | null
  publish: PublishMode
}

export interface Intake {
  id: string
  source: IntakeSource
  priority: IntakePriority
  created_at: string
  telegram_id: number | null
  raw_text: string
  ref: IntakeRef | null
  product: IntakeProduct
}

export interface IntakeStatus {
  status: IntakeStatusValue
  updated_at: string
  note: string
  medusa_handle: string | null
}
