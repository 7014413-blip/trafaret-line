"use client";

// Uploads the customer's logo of a constructor once, before the design goes to the cart, and
// keeps the storage key on the logo so a second «В кошик» does not upload it again. The buy
// button shows the upload and, when it fails, the message for the customer.

import { uploadLayoutFile } from "./upload-layout-file";
import type { BuyStateControls } from "./use-buy-state";
import type { LogoUploadResult, UploadableLogo } from "../../types/constructor-ui";

export async function ensureLogoUploaded<T extends UploadableLogo>(
  logo: T | null,
  setLogo: (update: (current: T | null) => T | null) => void,
  buyState: Pick<BuyStateControls, "uploading" | "failed">,
): Promise<LogoUploadResult> {
  if (!logo) return { ok: true, uploadKey: null };
  if (logo.uploadKey) return { ok: true, uploadKey: logo.uploadKey };
  buyState.uploading();
  try {
    const uploadKey = await uploadLayoutFile(logo.file);
    setLogo((current) => (current && current.previewUrl === logo.previewUrl ? { ...current, uploadKey } : current));
    return { ok: true, uploadKey };
  } catch (error) {
    buyState.failed((error as Error).message || "Не вдалося завантажити логотип. Спробуйте ще раз.");
    return { ok: false };
  }
}
