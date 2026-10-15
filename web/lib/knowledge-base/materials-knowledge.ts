// Reads data/knowledge_base/materials.json, the one place where material rates, densities,
// minimum prices and the measured acrylic weights are kept. A broken or incomplete file
// stops the build and the server with a message naming the material and the field,
// instead of selling at a wrong price.

import raw from "../../data/knowledge_base/materials.json";
import type { MaterialType } from "../../types/customizer";
import type { MaterialFacts, MaterialsKnowledge } from "../../types/product";

const FILE = "data/knowledge_base/materials.json";
const USES = new Set(["stencil", "blank"]);

const knowledge = raw as MaterialsKnowledge;

function fail(message: string): never {
  throw new Error(`${FILE}: ${message}`);
}

function positive(value: unknown, where: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) fail(`${where} must be a positive number`);
  return value;
}

function rate(value: unknown, where: string): number | null {
  return value === null ? null : positive(value, where);
}

/** Numbers of one material; throws when the file lacks the material or a field is wrong. */
export function materialFacts(id: MaterialType): MaterialFacts {
  const facts = knowledge.materials[id];
  if (!facts) fail(`material "${id}" is missing`);
  if (!USES.has(facts.use)) fail(`${id}.use must be "stencil" or "blank"`);
  if (typeof facts.available !== "boolean") fail(`${id}.available must be true or false`);
  if (typeof facts.minPrice !== "number" || facts.minPrice < 0) fail(`${id}.minPrice must be 0 or more`);
  return {
    use: facts.use,
    thicknessMm: positive(facts.thicknessMm, `${id}.thicknessMm`),
    densityGcm3: positive(facts.densityGcm3, `${id}.densityGcm3`),
    retailPerM2: rate(facts.retailPerM2, `${id}.retailPerM2`),
    wholesalePerM2: rate(facts.wholesalePerM2, `${id}.wholesalePerM2`),
    minPrice: facts.minPrice,
    costPerM2: rate(facts.costPerM2, `${id}.costPerM2`),
    available: facts.available,
  };
}

/** Laser bed, mm. */
export const MACHINE_SHEET_MM: Readonly<{ width: number; height: number }> = {
  width: positive(knowledge.machineSheetMm.width, "machineSheetMm.width"),
  height: positive(knowledge.machineSheetMm.height, "machineSheetMm.height"),
};

/** Measured acrylic weights per cm² (Денис 2026-10-10) and the nominal-density floor. */
export const ACRYLIC_WEIGHT = {
  points: knowledge.acrylicWeight.points.map((p, i) => ({
    thicknessMm: positive(p.thicknessMm, `acrylicWeight.points[${i}].thicknessMm`),
    gramsPerCm2: positive(p.gramsPerCm2, `acrylicWeight.points[${i}].gramsPerCm2`),
  })),
  nominalDensityGcm3: positive(knowledge.acrylicWeight.nominalDensityGcm3, "acrylicWeight.nominalDensityGcm3"),
  nominalFromMm: positive(knowledge.acrylicWeight.nominalFromMm, "acrylicWeight.nominalFromMm"),
};

if (ACRYLIC_WEIGHT.points.length < 2) fail("acrylicWeight.points needs at least two measured thicknesses");
