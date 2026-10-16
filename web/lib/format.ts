// Customer-facing number formats (uk-UA). Prices in whole hryvnias.

/** "1 285 ₴" */
export function formatUAH(value: number): string {
  return `${value.toLocaleString("uk-UA")} ₴`;
}

/** "1 285,00" for invoices and receipts. */
export function formatMoney2(value: number): string {
  return value.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Millimetres to centimetres without the unit: "30" / "30,5". */
export function cmText(mm: number): string {
  return (Math.round(mm) / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 });
}

/** Millimetres to "30 см" / "30,5 см". */
export function formatCm(mm: number): string {
  return `${cmText(mm)} см`;
}
