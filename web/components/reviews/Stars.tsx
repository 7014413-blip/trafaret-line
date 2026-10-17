// Star rating as the site shows it: filled and empty stars in the text colour (the design has
// no gold), with the number for screen readers.

import { StarIcon } from "./StarIcon";

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span role="img" aria-label={`Оцінка ${String(value).replace(".", ",")} з 5`} className="inline-flex gap-0.5 align-[-2px]">
      {[1, 2, 3, 4, 5].map((n) => <StarIcon key={n} fill={value - n + 1} size={size} />)}
    </span>
  );
}
