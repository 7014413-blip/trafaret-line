// Server-side price of wedding initials: measured with the server's font files, laid out,
// checked and priced. Anything that cannot be made throws.

import type { InitialsConfig, InitialsDesign, InitialsPrice } from "../../types/initials";
import type { LoadedFont } from "../../types/text";
import { checkInitials } from "./check";
import { DEFAULT_INITIALS_CONFIG } from "./config";
import { computeInitialsLayout } from "./layout";
import { measureInitials } from "./measure";
import { priceInitials } from "./price";

export function priceInitialsDesign(
  design: InitialsDesign, fontFor: (fontId: string) => LoadedFont | null | undefined, cfg: InitialsConfig = DEFAULT_INITIALS_CONFIG,
): InitialsPrice {
  const font = fontFor(design.fontId);
  if (!font) throw new Error(`initials: unknown font ${design.fontId}`);
  const measured = measureInitials(design, font);
  const errors = checkInitials(design, measured, cfg).filter((c) => c.level === "error");
  if (errors.length) throw new Error(`initials: ${errors.map((e) => e.code).join(", ")}`);
  return priceInitials(design, computeInitialsLayout(design, measured, cfg), cfg);
}
