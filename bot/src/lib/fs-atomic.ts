import { promises as fs } from "node:fs"
import path from "node:path"

/**
 * Запис через тимчасовий файл і перейменування: хмарна сесія конвеєра, що читає папку,
 * ніколи не побачить напівзаписаний JSON.
 */
export async function writeFileAtomic(file: string, data: string | Buffer): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true })
  const tmp = `${file}.${process.pid}.${Date.now()}.tmp`
  await fs.writeFile(tmp, data)
  try {
    await renameWithRetry(tmp, file)
  } catch (error) {
    await fs.rm(tmp, { force: true })
    throw error
  }
}

const RETRYABLE = new Set(["EPERM", "EBUSY", "EACCES"])

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * На Windows перейменування іноді коротко блокує антивірус або синхронізація папки
 * (EPERM/EBUSY). Повторюємо кілька разів із паузою, далі віддаємо помилку.
 */
export async function renameWithRetry(from: string, to: string, attempts = 5): Promise<void> {
  for (let attempt = 1; ; attempt++) {
    try {
      await fs.rename(from, to)
      return
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code ?? ""
      if (!RETRYABLE.has(code) || attempt >= attempts) throw error
      await delay(150 * attempt)
    }
  }
}

export async function writeJsonAtomic(file: string, value: unknown): Promise<void> {
  await writeFileAtomic(file, `${JSON.stringify(value, null, 2)}\n`)
}

/** Читає JSON; відсутній файл → null, зіпсований файл → помилка з назвою файлу. */
export async function readJsonIfExists<T>(file: string): Promise<T | null> {
  let text: string
  try {
    text = await fs.readFile(file, "utf8")
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return null
    throw error
  }
  try {
    return JSON.parse(text.replace(/^﻿/, "")) as T
  } catch (error) {
    throw new Error(`Не вдалося прочитати JSON ${file}: ${(error as Error).message}`)
  }
}
