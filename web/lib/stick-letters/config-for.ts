// Settings of a self-adhesive letters product by its kind.

import type { StickLettersConfig, StickLettersProduct } from "../../types/stick-letters";
import { ACRYLIC_CHARS_CONFIG } from "./chars-config";
import { DEFAULT_STICK_LETTERS_CONFIG } from "./config";
import { SIGN_LETTERS_CONFIG } from "./sign-letters-config";

export function stickLettersConfigFor(product: StickLettersProduct): StickLettersConfig {
  if (product === "chars") return ACRYLIC_CHARS_CONFIG;
  if (product === "sign-letters") return SIGN_LETTERS_CONFIG;
  return DEFAULT_STICK_LETTERS_CONFIG;
}
