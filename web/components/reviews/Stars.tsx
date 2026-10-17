// Star rating as the site shows it: filled and empty stars in the text colour (the design has
// no gold), with the number for screen readers.

import type { Locale } from "@/types/customizer";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { StarIcon } from "./StarIcon";

export function Stars({ value, size = 16, locale = "uk" }: { value: number; size?: number; locale?: Locale }) {
  return (
    <span role="img" aria-label={tr(CATALOG, locale).rating(String(value).replace(".", ","))} className="inline-flex gap-0.5 align-[-2px]">
      {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} fill={value - n + 1} size={size} />)}
    </span>
  );
}
