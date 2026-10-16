// A buyer's photo for a review, reduced in the browser: the longest side up to 1600 px, JPEG,
// turned the right way up. Drawing on a canvas drops EXIF, so the place where the photo was
// taken never leaves the phone; the server checks again (backend lib/reviews).

import { base64Bytes } from "../reviews/base64-bytes";
import { REVIEW_LIMITS } from "../reviews/review-limits";

const QUALITIES = [0.85, 0.75, 0.6, 0.45];

export interface ReducedPhoto {
  /** JPEG as base64, for the request. */
  base64: string;
  /** The same JPEG as a data: address, for the preview. */
  dataUrl: string;
}

export async function resizePhoto(file: File, maxSide: number = REVIEW_LIMITS.photoSidePx, maxBytes: number = REVIEW_LIMITS.photoBytesMax): Promise<ReducedPhoto> {
  if (!file.type.startsWith("image/")) throw new Error("Оберіть фото у форматі JPG або PNG");
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => {
    throw new Error("Не вдалося відкрити фото. Оберіть JPG або PNG");
  });
  try {
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Браузер не зміг обробити фото");
    // Transparent PNG parts become white instead of black in the JPEG.
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    for (const quality of QUALITIES) {
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      if (base64Bytes(base64) <= maxBytes) return { base64, dataUrl };
    }
    throw new Error("Фото завелике, оберіть інше");
  } finally {
    bitmap.close();
  }
}
