// Drawing of a round blank with the chosen hole, to scale: the buyer sees how big the hole
// is on the chosen circle and where it sits before ordering.

import type { HoleSpec } from "@/types/hole";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";
import { decimal } from "@/lib/i18n/dictionaries/units";

const VIEW = 200;
const PAD = 14;

/** Mirror tints by material name in any site language (gold, rose gold, silver); anything else is drawn silver. */
function tint(materialLabel: string): [string, string, string] {
  const name = materialLabel.toLowerCase();
  if (name.includes("рожев") || name.includes("розов") || name.includes("rose")) return ["#ffe6dc", "#d79a86", "#8c5446"];
  if (name.includes("золот") || name.includes("gold")) return ["#fff3c4", "#e2b54a", "#8a6414"];
  return ["#ffffff", "#c9ced6", "#7c8591"];
}

export function HolePreview({ pieceMm, hole, materialLabel }: { pieceMm: number; hole: HoleSpec | null; materialLabel: string }) {
  const scale = (VIEW / 2 - PAD) / (pieceMm / 2);
  const c = VIEW / 2;
  const [light, mid, dark] = tint(materialLabel);
  const holeX = hole ? c + hole.centreMm[0] * scale : c;
  const holeY = hole ? c + hole.centreMm[1] * scale : c;
  const holeR = hole ? Math.max(0.8, (hole.diameterMm / 2) * scale) : 0;
  const locale = useLocale();
  const t = tr(CATALOG, locale);
  const label = hole ? t.holeCircleWithHole(pieceMm / 10, decimal(hole.diameterMm, locale)) : t.holeCircle(pieceMm / 10);
  return (
    <figure className="m-0 grid gap-2">
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} role="img" aria-label={label} className="aspect-square w-full rounded-[20px] border border-[var(--line)] bg-[var(--card)]">
        <defs>
          <linearGradient id="hole-mirror" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={light} />
            <stop offset="0.55" stopColor={mid} />
            <stop offset="1" stopColor={dark} />
          </linearGradient>
          <mask id="hole-cut">
            <rect width={VIEW} height={VIEW} fill="#fff" />
            {hole && <circle cx={holeX} cy={holeY} r={holeR} fill="#000" />}
          </mask>
        </defs>
        <circle cx={c} cy={c} r={VIEW / 2 - PAD} fill="url(#hole-mirror)" stroke={dark} strokeWidth={1} mask="url(#hole-cut)" />
        {hole && <circle cx={holeX} cy={holeY} r={holeR} fill="none" stroke={dark} strokeWidth={0.8} />}
      </svg>
      <figcaption className="text-center text-[13px] text-[var(--muted)]">{label}</figcaption>
    </figure>
  );
}
