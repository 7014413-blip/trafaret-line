// Ukrainian plural form: 1 дизайн, 2 дизайни, 5 дизайнів, 21 дизайн, 11 дизайнів.

export function pluralUk(count: number, forms: readonly [one: string, few: string, many: string]): string {
  const n = Math.abs(Math.trunc(count));
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
