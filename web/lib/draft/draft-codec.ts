// A draft in the address: JSON → UTF-8 → base64url, so Cyrillic text and line breaks survive
// any messenger. decodeDraft never throws: a damaged link just opens the default layout.

/** Longest draft accepted from an address (characters of the encoded value). */
export const MAX_DRAFT_LENGTH = 6000;

export function encodeDraft(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeDraft(encoded: string): unknown {
  if (!encoded || encoded.length > MAX_DRAFT_LENGTH || !/^[A-Za-z0-9_-]+$/.test(encoded)) return null;
  try {
    const binary = atob(encoded.replace(/-/g, "+").replace(/_/g, "/"));
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0));
    return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return null;
  }
}
