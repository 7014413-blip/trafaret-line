// Master layouts of catalogue stencils (ТЗ §19): the vector file of a product (its article
// TL-<HANDLE>) is scaled to every size ordered, and the cut of a size is kept in a cache
// <MASTERS_CACHE_DIR>/<article>/<size>_<w>x<h>mm_<hash>… so a repeat order of the same size
// takes the file from there. Size files nobody used for 90 days are deleted.

import type { Vec2 } from "../shared/types/geometry";

/** What the order needs to know about a catalogue line to cut it. */
export interface CatalogLineSource {
  handle: string;
  /** Catalogue size code ("q30", "c7"). */
  sizeCode: string;
  sizeLabel: string;
  sheetMm: [number, number];
  /** Size description of the catalogue («малюнок 30 × 30 см, аркуш 33 × 33 см»). */
  detail: string;
  /** Master layouts of the product, one per piece of a set (product metadata.design_files). */
  designUrls: string[];
  materialCode: string;
  sku: string;
}

/** One piece cut from a master: the regions to cut out, in sheet millimetres. */
export interface MasterPiece {
  cutPaths: Vec2[][];
  designWidthMm: number;
  designHeightMm: number;
}

/** Cut of one size of a product, as stored in the cache (<base>.json). */
export interface MasterCut {
  article: string;
  sizeCode: string;
  sheet: { widthMm: number; heightMm: number };
  pieces: MasterPiece[];
  builtAt: string;
}

export interface MasterCutResult {
  cut: MasterCut;
  /** The cut came from the cache (a repeat order of the same size). */
  fromCache: boolean;
  /** Cache files of the size: <base>.json and <base>-<n>.svg / .dxf per piece. */
  files: string[];
}
