// «Лист погодження макета» (Денис, промт 15.10, PLAN-RABOT шаг 8.1): a line made in a
// constructor or from the customer's own file is cut only after the customer has checked the
// layout. The checkout shows such lines with their pictures and a «Макет перевірив» box;
// without it the order is not sent, and the server refuses it too (tl-checkout).

import type { OrderLineKind } from "../../types/order";

/** Lines whose layout the customer makes: constructors and «За вашим макетом». */
const MADE_TO_LAYOUT: ReadonlySet<OrderLineKind> = new Set(["stencil", "welded", "sign", "pointer", "plaque", "words", "layered", "initials", "letters"]);

export function needsLayoutApproval(line: { kind?: OrderLineKind | string | null }): boolean {
  return MADE_TO_LAYOUT.has((line.kind ?? "stencil") as OrderLineKind);
}
