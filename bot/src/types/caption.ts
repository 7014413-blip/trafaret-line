import type { ProductKind } from "./intake"

/** Матеріал, як його назвав Денис, до прив'язки до коду каталогу. */
export interface MaterialHint {
  base: "pet" | "ps" | "acr" | "mirror-acr" | "mirror-ps"
  thicknessMm: number | null
  color: "clear" | "white" | "black" | "milk" | "red" | "pink" | "blue" | "green" | "yellow" | "gold" | "silver" | null
}

/** Те, що вдалося розібрати з вільного підпису Дениса. */
export interface ParsedCaption {
  price_uah: number | null
  sizes_mm: Array<[number, number]>
  materialHint: MaterialHint | null
  kind: ProductKind | null
  category_handle: string | null
  title_uk: string | null
  text_on_stencil: string | null
}
