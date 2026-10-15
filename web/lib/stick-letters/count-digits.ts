// How many of every digit 0–9 the set has, over all its lines: the digit picker of
// «Акрилові цифри і літери» shows these counts and stays in step with typed text («125»).

export const DIGITS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"] as const;

export function countDigits(texts: string[]): Record<string, number> {
  const counts: Record<string, number> = Object.fromEntries(DIGITS.map((d) => [d, 0]));
  for (const text of texts) {
    for (const ch of text) {
      if (ch in counts) counts[ch] += 1;
    }
  }
  return counts;
}
