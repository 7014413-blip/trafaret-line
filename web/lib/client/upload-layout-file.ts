// Sends a customer's file (layout, logo) to POST /store/tl-upload and returns its key.
// The order keeps the key; a manager opens the file before cutting. A stored file is reported
// to analytics as «upload_layout» with the page it was sent from.

import { trackEvent } from "../analytics/track-event";

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
  reader.onerror = () => reject(reader.error ?? new Error("read failed"));
  reader.readAsDataURL(file);
});

export async function uploadLayoutFile(file: File): Promise<string> {
  const response = await fetch(`${process.env.NEXT_PUBLIC_MEDUSA_URL}/store/tl-upload`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-publishable-api-key": process.env.NEXT_PUBLIC_MEDUSA_PK ?? "" },
    body: JSON.stringify({ name: file.name, data: await toBase64(file) }),
  });
  const body = (await response.json().catch(() => ({}))) as { key?: string; message?: string };
  if (!response.ok || !body.key) throw new Error(body.message || "Не вдалося завантажити файл. Спробуйте ще раз.");
  trackEvent("upload_layout", { constructor_name: window.location.pathname });
  return body.key;
}
