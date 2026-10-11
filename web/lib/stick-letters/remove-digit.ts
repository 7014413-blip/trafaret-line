// Removes one copy of a digit from the set (digit picker «−»): the last one typed, looking from
// the last line up. Returns the line index and its new text, or null when the set has no such digit.

export function removeDigit(texts: string[], digit: string): { index: number; text: string } | null {
  for (let i = texts.length - 1; i >= 0; i -= 1) {
    const at = texts[i].lastIndexOf(digit);
    if (at >= 0) return { index: i, text: texts[i].slice(0, at) + texts[i].slice(at + 1) };
  }
  return null;
}
