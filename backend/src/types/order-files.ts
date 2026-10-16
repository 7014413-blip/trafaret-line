// Production files of an order (ТЗ §7): what the server writes into the order folder, what the
// admin page lists, and the note kept next to every customer font.

import type { CatalogLineSource } from "./masters";

export type OrderFileKind = "svg" | "dxf" | "png" | "json" | "font";

export interface OrderFile {
  /** Path inside the order folder: "TL-12-1_stencil_pet_thin_300x120mm.svg" or "fonts/…". */
  name: string;
  kind: OrderFileKind;
  sizeBytes: number;
}

/** An order line as the production files need it. */
export interface OrderLineForFiles {
  title: string;
  quantity: number;
  metadata: Record<string, unknown> | null;
  /** Catalogue stencil: its master layouts and sheet (lib/masters/catalog-line-sources.ts). */
  catalog?: CatalogLineSource | null;
}

export interface OrderForFiles {
  id: string;
  displayId: number;
  /** When the customer ticked «Макет перевірив» (cart metadata layoutApprovedAt), ISO. */
  approvedAt: string | null;
  items: OrderLineForFiles[];
}

/** What the order folder holds after the files were written. */
export interface OrderFilesResult {
  orderNumber: string;
  files: OrderFile[];
  /** Lines the server could not build a machine file for, in Ukrainian, for the manager. */
  problems: string[];
}

/** Note stored next to a customer font (backend/uploads/fonts/<key>.json). */
export interface FontSidecar {
  originalName: string;
  family: string;
  rightsConfirmed: boolean;
  /** Upload time, ISO. */
  at: string;
  ip: string;
  sha256: string;
  embeddingRestricted: boolean;
  /** The customer sent WOFF2; the stored file is the unpacked TTF or OTF. */
  convertedFrom?: "woff2";
  /** Orders that use the font: such fonts are never deleted. */
  orders?: string[];
}

/** One file of a ZIP archive. */
export interface ZipEntry {
  name: string;
  data: Buffer;
}

/** query.graph of the Medusa container, as the order file helpers call it. */
export type QueryGraph = (input: { entity: string; fields: string[]; filters: Record<string, unknown> }) => Promise<{ data: unknown[] }>;
