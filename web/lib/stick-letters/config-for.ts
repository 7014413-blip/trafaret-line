// Settings of a self-adhesive letters product by its kind.

import type { StickLettersConfig, StickLettersProduct } from "../../types/stick-letters";
import { ACRYLIC_CHARS_CONFIG } from "./chars-config";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";

export function stickLettersConfigFor(product: StickLettersProduct): StickLettersConfig {
  return product === "chars" ? ACRYLIC_CHARS_CONFIG : DEFAULT_STICK_LETTERS_CONFIG;
}
