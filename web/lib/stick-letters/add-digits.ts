// Adds digits to the end of a line of the set (digit picker «+» and «Повний набір 0–9»).
// Returns null when the line would grow past the character limit.

export function addDigits(text: string, digits: string, maxChars: number): string | null {
  const next = text + digits;
  return next.length > maxChars ? null : next;
}
