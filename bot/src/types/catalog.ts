/** Мінімальні поля каталогу, потрібні боту для кнопок вибору. */

export interface CategoryOption {
  handle: string
  parent: string | null
  rank: number
  nameUk: string
}

export interface MaterialOption {
  code: string
  nameUk: string
  /** Матеріали заготовок мають код з префіксом "bl-". */
  forBlanks: boolean
}

export interface CatalogLookup {
  categories: CategoryOption[]
  materials: MaterialOption[]
  categoryByHandle: ReadonlyMap<string, CategoryOption>
  materialByCode: ReadonlyMap<string, MaterialOption>
}

/** Запис catalog/data/categories.json (лише поля, які читає бот). */
export interface RawCategory {
  handle: string
  parent: string | null
  rank: number
  uk: { name: string }
}

/** Запис catalog/data/materials.json (лише поля, які читає бот). */
export interface RawMaterial {
  uk: string
}
