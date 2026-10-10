"use client";

// Product page of a blank with a hanging hole (mirror acrylic circles, Денис 2026-10-10):
// the buyer picks where the hole sits (top, bottom, left, right, centre) and its diameter
// (3–30 mm, at most 40 % of the circle, at least 3 mm of acrylic to the edge). The price does
// not change; the checked hole goes with the order as production data and the checkout
// repeats the check on the server.

import { useCallback, useMemo, useState } from "react";
import type { CatalogProduct, CatalogVariant } from "@/types/catalog";
import type { HoleError, HoleInput, HolePosition, HoleRules } from "@/types/hole";
import { checkHole } from "@/lib/catalog/check-hole";
import { defaultHoleMm } from "@/lib/catalog/hole-rules";
import { maxHoleMm } from "@/lib/catalog/hole-geometry";
import { Gallery, ProductBuyBox, type BuyBoxPersonalisation } from "./ProductBuyBox";
import { HolePreview } from "./HolePreview";

const POSITION_LABEL: Record<HolePosition, string> = {
  top: "Зверху",
  bottom: "Знизу",
  left: "Зліва",
  right: "Справа",
  center: "По центру",
};

const POSITION_IN_TEXT: Record<HolePosition, string> = {
  top: "зверху",
  bottom: "знизу",
  left: "зліва",
  right: "справа",
  center: "по центру",
};

const DEFAULT_PIECE_MM = 100;

const mm = (value: number) => String(value).replace(".", ",");

function errorText(error: HoleError, rules: HoleRules, maxMm: number): string {
  if (error === "diameter_not_number") return "Вкажіть діаметр числом, наприклад 5 або 5,5.";
  if (error === "diameter_too_small") return `Найменший отвір — ${mm(rules.minMm)} мм.`;
  if (error === "diameter_too_large") return `На цьому колі отвір до ${mm(maxMm)} мм, щоб краї не зламались.`;
  return "Оберіть розташування отвору.";
}

export function HoleProductView({ p, rules }: { p: CatalogProduct; rules: HoleRules }) {
  const [variant, setVariant] = useState<CatalogVariant | undefined>(undefined);
  const onVariantChange = useCallback((v: CatalogVariant | undefined) => setVariant(v), []);
  const pieceMm = variant?.sheetMm?.[0] ?? DEFAULT_PIECE_MM;
  const maxMm = maxHoleMm(pieceMm, rules.maxMm, rules.maxShare, rules.edgeMm);
  const [position, setPosition] = useState<HolePosition>(rules.defaultPosition);
  // null: the buyer has not typed a diameter yet, so the default for the chosen circle is used.
  const [typed, setTyped] = useState<string | null>(null);
  const diameterText = typed ?? String(defaultHoleMm(pieceMm, rules, maxMm));
  const check = useMemo(() => {
    const input: HoleInput = { position, diameterMm: diameterText };
    return checkHole(input, pieceMm, rules);
  }, [position, diameterText, pieceMm, rules]);

  const personal: BuyBoxPersonalisation = {
    ready: check.spec !== null,
    summary: check.spec ? `отвір Ø${mm(check.spec.diameterMm)} мм ${POSITION_IN_TEXT[check.spec.position]}` : "",
    spec: { hole: check.spec },
    node: (
      <fieldset className="grid gap-3">
        <legend className="mb-1 text-sm font-semibold">Отвір</legend>
        <div role="radiogroup" aria-label="Розташування отвору" className="flex flex-wrap gap-2">
          {rules.positions.map((pos) => (
            <button key={pos} type="button" role="radio" aria-checked={pos === position} onClick={() => setPosition(pos)}
              className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm ${pos === position ? "border-[2px] border-[var(--ink)] bg-[var(--surface)] font-semibold" : "border-[var(--line)] bg-[var(--card)]"}`}>
              {POSITION_LABEL[pos]}
            </button>
          ))}
        </div>
        <label className="grid gap-1 text-sm text-[var(--muted)]">Діаметр отвору, мм
          <input id="hole-diameter" value={diameterText} inputMode="decimal" autoComplete="off" maxLength={5}
            onChange={(e) => setTyped(e.target.value)}
            aria-invalid={check.error !== null} aria-describedby="hole-help"
            className="h-11 w-32 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base tabular-nums text-[var(--ink)]" />
        </label>
        {check.error ? (
          <span id="hole-help" role="alert" className="text-[13px] text-[var(--danger,#b91c1c)]">{errorText(check.error, rules, maxMm)}</span>
        ) : (
          <span id="hole-help" className="text-[13px] text-[var(--muted)]">Від {mm(rules.minMm)} до {mm(maxMm)} мм на цьому колі. Ціна не змінюється.</span>
        )}
      </fieldset>
    ),
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="grid gap-4">
        <div className="lg:sticky lg:top-24">
          <HolePreview pieceMm={pieceMm} hole={check.spec} materialLabel={variant?.materialLabel ?? ""} />
        </div>
        {p.images.length > 0 && <Gallery images={p.images} title={p.title} />}
      </div>
      <ProductBuyBox p={p} personal={personal} onVariantChange={onVariantChange} />
    </div>
  );
}
