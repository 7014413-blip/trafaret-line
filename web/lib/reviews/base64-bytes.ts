// Size of a base64 payload in bytes without decoding it (review photos are checked before upload).

/** Bytes of a base64 string without decoding it. */
export function base64Bytes(value: string): number {
  const clean = value.replace(/\s/g, "");
  const padding = clean.endsWith("==") ? 2 : clean.endsWith("=") ? 1 : 0;
  return Math.floor((clean.length * 3) / 4) - padding;
}
