// Pricing of an order line on the server (lib/orders/price-line.ts): the catalogue variant as
// the database has it and the priced line.

export type VariantPrice = { title: string; sku: string | null; price: number; sheetMm: [number, number] | null; hole: unknown };
/** `spec` is set when the server rewrote the production data (a checked hole). */
export type PricedLine = { title: string; unitPrice: number; spec?: Record<string, unknown> };

