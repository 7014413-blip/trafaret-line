// Customer-facing number formats (uk-UA). Prices in whole hryvnias.

/** "1 285 ₴" */
export function formatUAH(value: number): string {
  return `${value.toLocaleString("uk-UA")} ₴`;
}

/** "1 285,00" for invoices and receipts. */
export function formatMoney2(value: number): string {
  return value.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Millimetres to "30 см" / "30,5 см". */
export function formatCm(mm: number): string {
  return `${(mm / 10).toLocaleString("uk-UA", { maximumFractionDigits: 1 })} см`;
}
