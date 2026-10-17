// <option> list of a font picker: shop fonts by name, the customer's own fonts marked «Ваш».
// While the font list loads, one disabled-looking option keeps the current value selectable.

import type { FontEntry } from "@/types/text";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CONSTRUCTOR } from "@/lib/i18n/dictionaries/constructor";
import { tr } from "@/lib/i18n/translate";

export function FontOptions({ fonts, current }: { fonts: FontEntry[]; current?: string }) {
  const t = tr(CONSTRUCTOR, useLocale());
  if (fonts.length === 0) return current != null ? <option value={current}>{t.fontsLoading}</option> : null;
  return <>{fonts.map((f) => <option key={f.id} value={f.id}>{f.custom ? t.yourFont(f.name) : f.name}</option>)}</>;
}
