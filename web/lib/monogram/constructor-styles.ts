// Wedding initials constructor (Денис, 2026-10-10): every monogram product opens the same
// constructor with all designs. The product's own designs come first (the first one is the
// default), then the rest of the site's designs in their usual order.

import type { MonogramStyle, MonogramStyleId } from "../../types/monogram";
import { MONOGRAM_STYLES, stylesFor } from "./styles";

export function constructorStyles(productStyles: ReadonlyArray<string>): MonogramStyle[] {
  const own = stylesFor(productStyles);
  const ownIds = new Set<MonogramStyleId>(own.map((style) => style.id));
  const rest = (Object.keys(MONOGRAM_STYLES) as MonogramStyleId[])
    .filter((id) => !ownIds.has(id))
    .map((id) => MONOGRAM_STYLES[id]);
  return [...own, ...rest];
}
