// Ukrainian tax codes: ЄДРПОУ (8 digits, companies) and РНОКПП (10 digits, people and ФОП).
// Used in the checkout (instant check) and on the server before a paid registry lookup.

/** "company" for 8 digits, "fop" for 10 digits, null otherwise. */
export function codeKind(code: string): "company" | "fop" | null {
  if (/^\d{8}$/.test(code)) return "company";
  if (/^\d{10}$/.test(code)) return "fop";
  return null;
}

/** ЄДРПОУ checksum: weights 1–7 (or 7,1–6 for 30–60 million), second pass with weights +2. */
export function validEdrpou(code: string): boolean {
  if (!/^\d{8}$/.test(code)) return false;
  const digits = [...code].map(Number);
  const value = Number(code);
  const weights = value < 30_000_000 || value > 60_000_000 ? [1, 2, 3, 4, 5, 6, 7] : [7, 1, 2, 3, 4, 5, 6];
  let check = weights.reduce((s, w, i) => s + w * digits[i], 0) % 11;
  if (check === 10) {
    check = (weights.reduce((s, w, i) => s + (w + 2) * digits[i], 0) % 11) % 10;
  }
  return check === digits[7];
}

/** РНОКПП checksum: weights −1, 5, 7, 9, 4, 6, 10, 5, 7; (sum mod 11) mod 10 = last digit. */
export function validRnokpp(code: string): boolean {
  if (!/^\d{10}$/.test(code)) return false;
  const digits = [...code].map(Number);
  const weights = [-1, 5, 7, 9, 4, 6, 10, 5, 7];
  const sum = weights.reduce((s, w, i) => s + w * digits[i], 0);
  return ((sum % 11) + 11) % 11 % 10 === digits[9];
}

/** Valid ЄДРПОУ or РНОКПП. */
export function validTaxCode(code: string): boolean {
  const kind = codeKind(code);
  if (kind === "company") return validEdrpou(code);
  if (kind === "fop") return validRnokpp(code);
  return false;
}
