"use client";

// The customer's own fonts in the browser (Денис 10.10): checked locally, uploaded to the
// shop (POST /store/tl-font, which keeps the file for production), and kept in IndexedDB
// so they survive a reload and stay with this customer only.

import * as opentype from "opentype.js";
import type { CustomFontRecord, FontFileCheck, LoadedFont } from "../../types/text";
import { checkFontBuffer } from "../text/font-check";

const DB = "tl-custom-fonts";
const STORE = "fonts";

interface StoredFont {
  record: CustomFontRecord;
  buffer: ArrayBuffer;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "record.id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("IndexedDB is not available"));
  });
}

async function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = run(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB request failed"));
    });
  } finally {
    db.close();
  }
}

const parsed = new Map<string, LoadedFont>();

function toLoaded(stored: StoredFont): LoadedFont {
  const cached = parsed.get(stored.record.id);
  if (cached) return cached;
  const font: LoadedFont = {
    id: stored.record.id, name: stored.record.name, group: "Ваші шрифти", files: [], custom: true,
    faces: [opentype.parse(stored.buffer)],
  };
  parsed.set(font.id, font);
  return font;
}

/** The customer's fonts, oldest first, parsed and ready for the constructors. */
export async function listCustomFonts(): Promise<LoadedFont[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<StoredFont[]>("readonly", (store) => store.getAll() as IDBRequest<StoredFont[]>);
    return all.sort((a, b) => a.record.addedAt.localeCompare(b.record.addedAt)).map(toLoaded);
  } catch {
    return [];
  }
}

export async function removeCustomFont(id: string): Promise<void> {
  parsed.delete(id);
  await tx("readwrite", (store) => store.delete(id));
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export type AddFontResult =
  | { ok: true; font: LoadedFont; check: FontFileCheck }
  | { ok: false; error: string; check?: FontFileCheck };

/** Checks the file, uploads it with the rights confirmation and keeps it in this browser. */
export async function addCustomFont(file: File, rightsConfirmed: boolean): Promise<AddFontResult> {
  if (!rightsConfirmed) return { ok: false, error: "Підтвердьте, що маєте право використовувати цей шрифт" };
  const buffer = await file.arrayBuffer();
  const checked = checkFontBuffer(buffer, file.name);
  const { font: _font, ...check } = checked;
  if (!check.ok || !check.format) return { ok: false, error: check.error ?? "Шрифт не підходить", check };

  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-font`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
      body: JSON.stringify({ name: file.name, data: toBase64(buffer), rightsConfirmed: true }),
    });
  } catch {
    return { ok: false, error: "Немає звʼязку з магазином. Спробуйте ще раз за хвилину.", check };
  }
  const data = (await response.json().catch(() => ({}))) as { key?: string; id?: string; message?: string };
  if (!response.ok || !data.key || !data.id) {
    return { ok: false, error: response.status === 429 ? "Забагато шрифтів за годину. Спробуйте пізніше." : data.message ?? "Не вдалося завантажити шрифт", check };
  }

  const record: CustomFontRecord = {
    id: data.id, key: data.key, name: check.familyName, fileName: file.name.slice(0, 200), format: check.format,
    sizeBytes: buffer.byteLength, rightsConfirmed: true, addedAt: new Date().toISOString(),
  };
  const stored: StoredFont = { record, buffer };
  try {
    await tx("readwrite", (store) => store.put(stored));
  } catch {
    // Private mode: the font works until the page is closed.
  }
  return { ok: true, font: toLoaded(stored), check };
}
