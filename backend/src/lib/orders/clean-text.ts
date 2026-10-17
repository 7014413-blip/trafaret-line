// Customer text for a title or an address line.

/** Customer text for a title: control characters removed, spaces collapsed, length capped. */
export function cleanText(value: unknown, max = 80): string {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

