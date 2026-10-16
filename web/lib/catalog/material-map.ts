// Catalogue material codes (catalog/data/materials.json) → material ids of the calculators.
// Used for the parcel weight and size of catalogue items in the cart; the price itself
// always comes from the Medusa variant.

import type { MaterialType } from "../../types/customizer";

const MAP: Record<string, MaterialType> = {
  "pet-05": "pet_thin",
  "ps-1-white": "polystyrene",
  "ps-1-black": "polystyrene",
  "acr-3": "acrylic",
  "bl-acr-15": "acrylic_1_5",
  "bl-acr-3": "acrylic_3",
  "bl-acr-6": "acrylic_6",
  "bl-acr-8": "acrylic_8",
  "bl-acr-3-black": "acrylic_black_3",
  "bl-acr-3-milk": "acrylic_white_3",
  "bl-acr-3-red": "acrylic_color",
  "bl-acr-3-pink": "acrylic_color",
  "bl-acr-3-blue": "acrylic_color",
  "bl-acr-3-green": "acrylic_color",
  "bl-acr-3-yellow": "acrylic_color",
  "bl-mir-2-gold": "acrylic_mirror_2",
  "bl-mir-2-silver": "acrylic_mirror_2",
  "bl-mir-3-gold": "acrylic_mirror_3",
  "bl-mir-3-silver": "acrylic_mirror_3",
  "bl-ps-1-gold": "polystyrene_mirror_1",
  "bl-ps-1-silver": "polystyrene_mirror_1",
  "bl-pet-05": "pet_food_board",
  "bl-ps-1-white": "polystyrene_white_1",
  // confectionery tools, signs and thick acrylic (catalog section w3-konditer, 2026-10-10)
  "bl-mir-3-rose": "acrylic_mirror_3",
  "bl-acr-15mm-clear": "acrylic_15",
  "acr-2-white": "acrylic_white_2",
  "acr-8-clear": "acrylic_8",
  "skr-acr-3-clear": "acrylic_3",
  "skr-acr-3-white": "acrylic_white_3",
  "skr-acr-3-black": "acrylic_black_3",
  "skr-acr-6-clear": "acrylic_6",
  "skr-acr-6-white": "acrylic_6",
  "skr-acr-6-black": "acrylic_6",
  // two-layer polystyrene 2 mm: the 1 mm mirror polystyrene weight is the closest; the signs are 8–12 cm
  "tab-ps2-gold": "polystyrene_mirror_1",
  "tab-ps2-silver": "polystyrene_mirror_1",
  "tab-ps2-black": "polystyrene_mirror_1",
};

/** Calculator material for a catalogue code; PET 0.5 mm when the code is unknown. */
export function materialForCode(code: string | null | undefined): MaterialType {
  return (code && MAP[code]) || "pet_thin";
}
