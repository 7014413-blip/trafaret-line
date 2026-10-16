// Production files of a paid order line (ТЗ §7): the machine part (SVG and DXF, lib/export/layers.ts),
// a PNG preview and the parameters. Built on the Medusa server from the line spec with the
// same geometry code as the constructors (lib/export/*-part.ts).

import type { MaterialType } from "./customizer";
import type { BridgeStrength, TextAlign, WeldOptions } from "./geometry";
import type { CanvasShapeKind, CanvasTransform } from "./canvas";
import type { LoadedFont } from "./text";
import type { LayeredPart } from "./vector";

/** Constructor that made the line; the second part of the production file name. */
export type ProductionConstructor = "stencil" | "square-stencil" | "canvas-stencil" | "word" | "canvas-piece";

/** Everything the production file name is made of. */
export interface ProductionNameInput {
  /** Order number as the customer sees it, e.g. "TL-1042". */
  orderNumber: string;
  /** Position of the line in the order, from 1. */
  position: number;
  constructor: ProductionConstructor;
  materialId: string;
  widthMm: number;
  heightMm: number;
}

/** Text of a «Свій напис» line with its fonts already loaded. */
export interface ProductionText {
  text: string;
  font: LoadedFont;
  /** Font of each line; null = the main font. */
  lineFonts: (LoadedFont | null)[];
  align: TextAlign;
  upper: boolean;
}

/** «Свій напис» stencil: the sheet width the customer paid for and the cut settings. */
export interface TextStencilInput extends ProductionText {
  widthMm: number;
  marginMm: number;
  square: boolean;
  bridgeStrength: BridgeStrength;
  materialId: MaterialType;
}

/** «Цілим словом»: the welded word at the paid width. */
export interface WeldedWordInput extends ProductionText {
  widthMm: number;
  options: WeldOptions;
  materialId: MaterialType;
  /** Colour of the piece on the preview. */
  colourHex: string;
}

/** One element of «Вільне полотно» as the order line stores it, fonts loaded. */
export type ProductionCanvasElement =
  | { kind: "text"; transform: CanvasTransform; text: string; font: LoadedFont; capMm: number }
  | { kind: "shape"; transform: CanvasTransform; shape: CanvasShapeKind };

/** «Вільне полотно»: the sheet and its elements, cut as a stencil or as one piece. */
export interface CanvasPartInput {
  sheet: { widthMm: number; heightMm: number; marginMm: number };
  elements: ProductionCanvasElement[];
  materialId: MaterialType;
  result: "stencil" | "piece";
  autoJoin: boolean;
}

/** Machine part of one order line and its preview picture. */
export interface ProductionPart {
  constructor: ProductionConstructor;
  part: LayeredPart;
  /** Filled picture of the product (sheet with cut-outs, or the piece) for the PNG preview. */
  previewSvg: string;
  /** Size of what is cut, mm (the sheet, or the bounding box of the piece). */
  widthMm: number;
  heightMm: number;
  /** Problems found while building, in Ukrainian, for the manager. */
  warnings: string[];
}
