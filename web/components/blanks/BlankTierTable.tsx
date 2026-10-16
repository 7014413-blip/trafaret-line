// Wholesale scale of the chosen blank before ordering: the price of one piece at 1, 10, 50 and
// 100 pieces, the chosen step marked.

import { formatUAH } from "@/lib/format";
import type { BlankTierPrice } from "@/types/blank";

export function BlankTierTable({ tiers, quantity }: { tiers: BlankTierPrice[]; quantity: number }) {
  const active = [...tiers].reverse().find((t) => quantity >= t.minQty)?.minQty;
  return (
    <table className="w-full border-collapse text-[13px] tabular-nums">
      <caption className="mb-1 text-left text-[13px] font-bold uppercase tracking-wider text-[var(--muted)]">Ціна за штуку від кількості</caption>
      <tbody>
        {tiers.map((t) => (
          <tr key={t.minQty} className={t.minQty === active ? "font-bold" : "text-[var(--muted)]"}>
            <td className="py-0.5">{t.minQty === 1 ? "1 шт." : `від ${t.minQty} шт.`}</td>
            <td className="py-0.5 text-right">{t.discount ? `−${Math.round(t.discount * 100)}%` : ""}</td>
            <td className="py-0.5 text-right">{formatUAH(t.unitPrice)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
