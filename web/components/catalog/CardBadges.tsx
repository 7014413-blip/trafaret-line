// Badges in the corner of a product photo: «Хіт» (best seller) and «Новинка» (new), both set by
// the manager in «Простий кабінет». Anthracite on white, as every label of the design.

import { useLocale } from "@/components/i18n/LocaleProvider";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";

export function CardBadges({ hit, isNew }: { hit: boolean; isNew: boolean }) {
  const t = tr(CATALOG, useLocale());
  if (!hit && !isNew) return null;
  return (
    <span className="absolute top-2 left-2 flex flex-wrap gap-1.5">
      {isNew && <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-bold text-[var(--bg)]">{t.isNew}</span>}
      {hit && <span className="rounded-full bg-[var(--card)] px-2.5 py-1 text-xs font-bold text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--line)]">{t.hit}</span>}
    </span>
  );
}
