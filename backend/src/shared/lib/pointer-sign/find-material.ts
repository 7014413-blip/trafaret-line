// Looks up a pointer sign sheet by id; unknown ids are refused (the server reads designs from the browser).

import type { PointerMaterial } from "../../types/pointer-sign";
import { POINTER_MATERIALS } from "./materials";

export function findPointerMaterial(id: string, palette: PointerMaterial[] = POINTER_MATERIALS): PointerMaterial {
  const sheet = palette.find((m) => m.id === id);
  if (!sheet) throw new Error(`Unknown pointer sign material: ${id}`);
  return sheet;
}
