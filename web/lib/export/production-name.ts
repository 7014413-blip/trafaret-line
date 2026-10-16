// Name of the production files of an order line (ТЗ §7):
//   <order number>-<position>_<constructor>_<material>_<width>x<height>mm
// e.g. "TL-1042-2_stencil_pet_thin_300x120mm" + ".svg" / ".dxf" / ".png" / ".json".
// Only Latin letters, digits, "-" and "_": RDWorks and Windows tools of the workshop open such
// names without trouble, and the files sort by order and position.

import type { ProductionNameInput } from "../../types/production";

const safe = (value: string) => value.replace(/[^A-Za-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "") || "x";

export function productionFileName(input: ProductionNameInput): string {
  const size = `${Math.round(input.widthMm)}x${Math.round(input.heightMm)}mm`;
  return `${safe(input.orderNumber)}-${Math.max(1, Math.round(input.position))}_${safe(input.constructor)}_${safe(input.materialId)}_${size}`;
}
