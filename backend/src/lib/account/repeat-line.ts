// «Повторити замовлення»: a line of a past order rebuilt from what the checkout stored in its
// metadata and priced again today with the checkout's own code (lib/orders/price-line.ts). A
// line that cannot be ordered the same way any more gets a reason instead.

import type { AccountOrderItem, RepeatCartLine } from "../../shared/types/account";
import type { MaterialType } from "../../shared/types/customizer";
import type { OrderLineInput, OrderLineKind } from "../../shared/types/order";
import type { AccountOrderItemRecord } from "../../types/account";
import type { VariantPrice } from "../../types/order-pricing";
import { priceLine } from "../orders/price-line";
import { SpecError } from "../validation/constructor-size";
import { previewImageUrl } from "./preview-image-url";
import { previewSvgOf } from "../../shared/lib/validation/preview-svg";

const KINDS: ReadonlySet<OrderLineKind> = new Set<OrderLineKind>([
  "stencil", "welded", "catalog", "sign", "pointer", "plaque", "words", "layered", "initials", "letters", "blank", "accessory",
]);
/** The cart keeps their 1-piece price and applies the quantity scale itself. */
const BASE_PRICED: ReadonlySet<OrderLineKind> = new Set<OrderLineKind>(["catalog", "words", "initials", "letters", "stencil", "welded", "pointer", "plaque", "layered", "blank"]);
/** The cart shows their price as it is (signs are priced with the quantity inside, accessories are fixed). */
const FIXED_PRICED: ReadonlySet<OrderLineKind> = new Set<OrderLineKind>(["sign", "accessory"]);

export const REPEAT_PROBLEMS = {
  manual: "Цей товар можна замовити знову через менеджера",
  offSale: "Цього товару вже немає в продажу",
  rebuild: "Зберіть виріб заново в конструкторі: його вже не можна повторити автоматично",
} as const;

type Meta = Record<string, unknown>;
const text = (value: unknown) => (typeof value === "string" ? value : undefined);
const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : undefined);
const object = <T>(value: unknown) => (value && typeof value === "object" ? (value as T) : undefined);

/** The checkout line as it was sent, rebuilt from the stored metadata (null for lines made elsewhere). */
function storedLine(item: AccountOrderItemRecord): OrderLineInput | null {
  const meta: Meta = item.metadata ?? {};
  const kind = meta.kind as OrderLineKind;
  if (!KINDS.has(kind)) return null;
  return {
    key: text(meta.key) || `${kind}-${item.id}`,
    kind,
    title: item.title,
    quantity: Math.max(1, Math.round(Number(item.quantity))),
    variantId: text(meta.variantId),
    materialId: text(meta.materialId) as MaterialType | undefined,
    widthCm: num(meta.widthCm),
    heightCm: num(meta.heightCm),
    sign: object(meta.sign),
    pointer: object(meta.pointer),
    plaque: object(meta.plaque),
    words: object(meta.words),
    layered: object(meta.layered),
    initials: object(meta.initials),
    letters: object(meta.letters),
    blank: object(meta.blank),
    uploadKey: text(meta.uploadKey),
    spec: object(meta.spec),
  };
}

function problemOf(error: unknown): string {
  if (error instanceof SpecError) return REPEAT_PROBLEMS.rebuild;
  return /not on sale/.test((error as Error)?.message ?? "") ? REPEAT_PROBLEMS.offSale : REPEAT_PROBLEMS.rebuild;
}

/**
 * `own`: the order was placed by this signed-in customer, so its constructor picture may go back
 * into the cart as it is (guest orders joined by e-mail only show it as an image).
 */
export function repeatItem(item: AccountOrderItemRecord, variants: Map<string, VariantPrice>, own: boolean): Pick<AccountOrderItem, "repeat" | "repeatProblem" | "priceNow"> {
  const line = storedLine(item);
  if (!line) return { repeat: null, repeatProblem: REPEAT_PROBLEMS.manual, priceNow: null };
  try {
    const now = priceLine(line, variants);
    const single = line.quantity === 1 ? now : priceLine({ ...line, quantity: 1 }, variants);
    const repeat: RepeatCartLine = {
      key: line.key,
      title: now.title,
      kind: line.kind,
      materialId: line.materialId ?? "pet_thin",
      widthCm: line.widthCm ?? 0,
      heightCm: line.heightCm ?? 0,
      quantity: line.quantity,
      variantId: line.variantId,
      basePrice: BASE_PRICED.has(line.kind) ? single.unitPrice : undefined,
      fixedPrice: FIXED_PRICED.has(line.kind) ? now.unitPrice : undefined,
      sign: line.sign,
      pointer: line.pointer,
      plaque: line.plaque,
      words: line.words,
      layered: line.layered,
      initials: line.initials,
      letters: line.letters,
      blank: line.blank,
      uploadKey: line.uploadKey,
      spec: now.spec ?? line.spec,
      thumbnail: previewImageUrl(item) ?? undefined,
      vectorSvg: own ? previewSvgOf(item.metadata?.previewSvg) ?? undefined : undefined,
    };
    return { repeat, repeatProblem: null, priceNow: now.unitPrice };
  } catch (error) {
    return { repeat: null, repeatProblem: problemOf(error), priceNow: null };
  }
}
