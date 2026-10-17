// Wholesale scale of the chosen blank before ordering: the price of one piece at 1, 10, 50 and
// 100 pieces, the chosen step marked.

import { formatUAH } from "@/lib/format";
import type { BlankTierPrice } from "@/types/blank";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { BLANKS } from "@/lib/i18n/dictionaries/blanks";
import { tr } from "@/lib/i18n/translate";

export function BlankTierTable({ tiers, quantity }: { tiers: BlankTierPrice[]; quantity: number }) {
  const t = tr(BLANKS, useLocale());
  const active = [...tiers].reverse().find((t) => quantity >= t.minQty)?.minQty;
  return (
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <caption className="mb-1 text-left text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">{t.tierCaption}</caption>
      <tbody>
        {tiers.map((tier) => (
          <tr key={tier.minQty} className={tier.minQty === active ? "font-bold" : "text-[var(--muted)]"}>
            <td className="py-0.5">{tier.minQty === 1 ? t.onePiece : t.fromQty(tier.minQty)}</td>
            <td className="py-0.5 text-right">{tier.discount ? `−${Math.round(tier.discount * 100)}%` : ""}</td>
            <td className="py-0.5 text-right">{formatUAH(tier.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
