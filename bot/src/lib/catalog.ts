import { promises as fs } from "node:fs"
import path from "node:path"
import type { CatalogLookup, CategoryOption, MaterialOption, RawCategory, RawMaterial } from "../types/catalog"

async function readJson<T>(file: string): Promise<T> {
  const text = await fs.readFile(file, "utf8")
  return JSON.parse(text) as T
}

/** Будує довідник з уже готових масивів (використовується і в тестах). */
export function buildCatalogLookup(
  rawCategories: RawCategory[],
  rawMaterials: Record<string, RawMaterial>,
): CatalogLookup {
  const categories: CategoryOption[] = rawCategories
    .map((c) => ({ handle: c.handle, parent: c.parent, rank: c.rank, nameUk: c.uk.name }))
    .sort((a, b) => a.rank - b.rank || a.nameUk.localeCompare(b.nameUk, "uk"))

  const materials: MaterialOption[] = Object.entries(rawMaterials).map(([code, m]) => ({
    code,
    nameUk: m.uk,
    forBlanks: code.startsWith("bl-"),
  }))

  return {
    categories,
    materials,
    categoryByHandle: new Map(categories.map((c) => [c.handle, c])),
    materialByCode: new Map(materials.map((m) => [m.code, m])),
  }
}

/** Завантажує категорії й матеріали з catalog/data. */
export async function loadCatalog(catalogDir: string): Promise<CatalogLookup> {
  const dataDir = path.join(catalogDir, "data")
  const [rawCategories, rawMaterials] = await Promise.all([
    readJson<RawCategory[]>(path.join(dataDir, "categories.json")),
    readJson<Record<string, RawMaterial>>(path.join(dataDir, "materials.json")),
  ])
  if (!Array.isArray(rawCategories) || rawCategories.length === 0) {
    throw new Error(`У ${dataDir}\\categories.json немає категорій.`)
  }
  return buildCatalogLookup(rawCategories, rawMaterials)
}

export function topCategories(catalog: CatalogLookup): CategoryOption[] {
  return catalog.categories.filter((c) => c.parent === null)
}

export function childCategories(catalog: CatalogLookup, parent: string): CategoryOption[] {
  return catalog.categories.filter((c) => c.parent === parent)
}

/** Матеріали, доречні для типу товару: заготовкам — "bl-*", трафаретам — решта. */
export function materialsForKind(catalog: CatalogLookup, kind: string | null): MaterialOption[] {
  if (kind === "blank") return catalog.materials.filter((m) => m.forBlanks)
  return catalog.materials.filter((m) => !m.forBlanks)
}
