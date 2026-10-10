// Ids of customer fonts: "custom:<storage key>", the key being "YYYY-MM-DD/<uuid>.<ext>"
// given by the Medusa upload route. The strict pattern keeps the key safe to use as a
// file path on the server.

export const CUSTOM_FONT_PREFIX = "custom:";
const KEY = /^\d{4}-\d{2}-\d{2}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(ttf|otf|woff)$/;

export function isCustomFontId(id: string): boolean {
  return id.startsWith(CUSTOM_FONT_PREFIX);
}

export function customFontId(key: string): string {
  return `${CUSTOM_FONT_PREFIX}${key}`;
}

/** Storage key of a customer font id, or null when the id is not a valid customer font. */
export function customFontKey(id: string): string | null {
  if (!isCustomFontId(id)) return null;
  const key = id.slice(CUSTOM_FONT_PREFIX.length);
  return KEY.test(key) ? key : null;
}

export function isValidFontKey(key: string): boolean {
  return KEY.test(key);
}
