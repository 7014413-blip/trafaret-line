// Reads a logo picked in the business sign constructor: SVG, PNG and JPG as in the other
// constructors (read-logo-file.ts), plus PDF, whose first page is drawn for the preview.

import { MAX_LOGO_BYTES, readLogoFile } from "./read-logo-file";
import { renderPdfPreview } from "./render-pdf-preview";

export const SIGN_LOGO_ACCEPT = ".svg,.png,.jpg,.jpeg,.pdf";

export type SignLogoFileResult =
  | { ok: true; file: File; previewUrl: string; aspect: number; format: "svg" | "raster" | "pdf" }
  | { ok: false; error: string };

export async function readSignLogoFile(file: File): Promise<SignLogoFileResult> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (ext !== "pdf") {
    const result = await readLogoFile(file);
    return result.ok ? result : { ok: false, error: result.error.replace("SVG, PNG або JPG", "SVG, PDF, PNG або JPG") };
  }
  if (file.size > MAX_LOGO_BYTES) return { ok: false, error: "Файл більший за 10 МБ. Стисніть його або надішліть нам у Viber." };
  const head = new Uint8Array(await file.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...head) !== "%PDF-") return { ok: false, error: "Файл PDF пошкоджений. Збережіть логотип ще раз." };
  try {
    const preview = await renderPdfPreview(file);
    return { ok: true, file, previewUrl: preview.url, aspect: preview.aspect, format: "pdf" };
  } catch {
    return { ok: false, error: "Не вдалося відкрити PDF. Збережіть логотип як SVG або PNG." };
  }
}
