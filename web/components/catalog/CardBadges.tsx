// Badges in the corner of a product photo: «Хіт» (best seller) and «Новинка» (new), both set by
// the manager in «Простий кабінет». Anthracite on white, as every label of the design.

export function CardBadges({ hit, isNew }: { hit: boolean; isNew: boolean }) {
  if (!hit && !isNew) return null;
  return (
    <span className="absolute top-2 left-2 flex flex-wrap gap-1.5">
      {isNew && <span className="rounded-full bg-[var(--ink)] px-2.5 py-1 text-xs font-bold text-[var(--bg)]">Новинка</span>}
      {hit && <span className="rounded-full bg-[var(--card)] px-2.5 py-1 text-xs font-bold text-[var(--ink)] shadow-[inset_0_0_0_1px_var(--line)]">Хіт</span>}
    </span>
  );
}
