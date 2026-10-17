// Sheets of the two-layer plaques: the pointer sign palette (acrylic, mirror acrylic, matte
// silver, polystyrene) plus light bases for door signs as on Денис's photo [default, Claude 2026-10-10].

import type { LayeredPlaqueMaterial } from "../../types/layered-plaque";
import { POINTER_MATERIALS } from "../pointer-sign/materials";

const lightBases: LayeredPlaqueMaterial[] = [
  {
    id: "cream", group: "acrylic", name: { uk: "Кремовий", ru: "Кремовый", en: "Cream" },
    hex: "#ece6d6", mirror: false, baseThicknessMm: 3, overlayThicknessMm: 2, minLetterMm: 15, inStock: true,
  },
  {
    id: "sage", group: "acrylic", name: { uk: "Оливково-сірий", ru: "Оливково-серый", en: "Sage gray" },
    hex: "#cfd3c4", mirror: false, baseThicknessMm: 3, overlayThicknessMm: 2, minLetterMm: 15, inStock: true,
  },
];

export const LAYERED_PLAQUE_MATERIALS: LayeredPlaqueMaterial[] = [...POINTER_MATERIALS, ...lightBases];

export function findLayeredPlaqueMaterial(id: string): LayeredPlaqueMaterial {
  const sheet = LAYERED_PLAQUE_MATERIALS.find((m) => m.id === id);
  if (!sheet) throw new Error(`Unknown plaque material: ${id}`);
  return sheet;
}
