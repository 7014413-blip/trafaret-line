// <option> list of a font picker: shop fonts by name, the customer's own fonts marked «Ваш».
// While the font list loads, one disabled-looking option keeps the current value selectable.

import type { FontEntry } from "@/types/text";

export function FontOptions({ fonts, current }: { fonts: FontEntry[]; current?: string }) {
  if (fonts.length === 0) return current != null ? <option value={current}>Шрифти завантажуються…</option> : null;
  return <>{fonts.map((f) => <option key={f.id} value={f.id}>{f.custom ? `Ваш: ${f.name}` : f.name}</option>)}</>;
}
