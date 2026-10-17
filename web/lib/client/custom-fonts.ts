"use client";

// The customer's own fonts in the browser (Денис 10.10): checked locally, uploaded to the
// shop (POST /store/tl-font, which keeps the file for production), and kept in IndexedDB
// so they survive a reload and stay with this customer only. WOFF2 cannot be read here: the
// shop unpacks it and the browser takes the TTF or OTF back by the signed link it returns.

import * as opentype from "opentype.js";
import type { CustomFontRecord, FontFileCheck, LoadedFont } from "../../types/text";
import type { Locale } from "../../types/customizer";
import { checkFontBuffer, MAX_FONT_BYTES, sniffFontFormat } from "../text/font-check";
import { CONSTRUCTOR } from "../i18n/dictionaries/constructor";
import { tr } from "../i18n/translate";

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

function toLoaded(stored: StoredFont, locale: Locale): LoadedFont {
  const group = tr(CONSTRUCTOR, locale).customFontGroup;
  const cached = parsed.get(stored.record.id);
  if (cached) {
    cached.group = group;
    return cached;
  }
  const font: LoadedFont = {
    id: stored.record.id, name: stored.record.name, group, files: [], custom: true,
    faces: [opentype.parse(stored.buffer)],
  };
  parsed.set(font.id, font);
  return font;
}

/** The customer's fonts, oldest first, parsed and ready for the constructors; group name in the page language. */
export async function listCustomFonts(locale: Locale = "uk"): Promise<LoadedFont[]> {
  if (typeof indexedDB === "undefined") return [];
  try {
    const all = await tx<StoredFont[]>("readonly", (store) => store.getAll() as IDBRequest<StoredFont[]>);
    return all.sort((a, b) => a.record.addedAt.localeCompare(b.record.addedAt)).map((stored) => toLoaded(stored, locale));
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

const shopHeaders = () => ({ "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" });

interface UploadAnswer {
  key?: string;
  id?: string;
  url?: string | null;
  message?: string;
}

/** Sends the font to the shop; the answer, or the error to show. */
async function uploadFont(fileName: string, buffer: ArrayBuffer): Promise<{ ok: true; data: UploadAnswer & { key: string; id: string } } | { ok: false; error: string }> {
  let response: Response;
  try {
    response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-font`, {
      method: "POST",
      headers: { "content-type": "application/json", ...shopHeaders() },
      body: JSON.stringify({ name: fileName, data: toBase64(buffer), rightsConfirmed: true }),
    });
  } catch {
    return { ok: false, error: "Немає звʼязку з магазином. Спробуйте ще раз за хвилину." };
  }
  const data = (await response.json().catch(() => ({}))) as UploadAnswer;
  if (!response.ok || !data.key || !data.id) {
    return { ok: false, error: response.status === 429 ? "Забагато шрифтів за годину. Спробуйте пізніше." : data.message ?? "Не вдалося завантажити шрифт" };
  }
  return { ok: true, data: { ...data, key: data.key, id: data.id } };
}

/** The TTF or OTF the shop unpacked from a WOFF2 file, by the signed link; null on failure. */
async function unpackedFont(url: string | null | undefined): Promise<ArrayBuffer | null> {
  if (!url) return null;
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}${url}`, { headers: shopHeaders() });
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}

/** Checks the file, uploads it with the rights confirmation and keeps it in this browser. Check errors come in the page language. */
export async function addCustomFont(file: File, rightsConfirmed: boolean, locale: Locale = "uk"): Promise<AddFontResult> {
  if (!rightsConfirmed) return { ok: false, error: "Підтвердьте, що маєте право використовувати цей шрифт" };
  const sent = await file.arrayBuffer();
  const woff2 = sniffFontFormat(new Uint8Array(sent.slice(0, 4))) === "woff2";
  if (woff2 && sent.byteLength > MAX_FONT_BYTES) return { ok: false, error: "Файл шрифту більший за 10 МБ" };
  if (!woff2) {
    const { font: _font, ...local } = checkFontBuffer(sent, file.name, locale);
    if (!local.ok || !local.format) return { ok: false, error: local.error ?? "Шрифт не підходить", check: local };
  }

  const uploaded = await uploadFont(file.name, sent);
  if (!uploaded.ok) return { ok: false, error: uploaded.error };
  const buffer = woff2 ? await unpackedFont(uploaded.data.url) : sent;
  if (!buffer) return { ok: false, error: "Не вдалося відкрити шрифт WOFF2. Спробуйте той самий шрифт у TTF або OTF" };
  const { font: _font, ...check } = checkFontBuffer(buffer, file.name, locale);
  if (!check.ok || !check.format) return { ok: false, error: check.error ?? "Шрифт не підходить", check };

  const record: CustomFontRecord = {
    id: uploaded.data.id, key: uploaded.data.key, name: check.familyName, fileName: file.name.slice(0, 200), format: check.format,
    sizeBytes: buffer.byteLength, rightsConfirmed: true, addedAt: new Date().toISOString(),
  };
  const stored: StoredFont = { record, buffer };
  try {
    await tx("readwrite", (store) => store.put(stored));
  } catch {
    // Private mode: the font works until the page is closed.
  }
  return { ok: true, font: toLoaded(stored, locale), check };
}
