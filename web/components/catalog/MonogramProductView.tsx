"use client";

// Wedding initials constructor on a monogram product page: the buyer picks a design (all
// site designs, the product's own first), types two initials (and the date where the
// design has one) and sees the real cut for the chosen size. Price, quantity scale and
// cart come from the usual buy box; the design, letters and date go with the order as
// production data.

import { useCallback, useMemo, useState } from "react";
import type { CatalogProduct, CatalogVariant } from "@/types/catalog";
import type { MonogramField, MonogramInput, MonogramStyleId } from "@/types/monogram";
import { checkMonogramInput } from "@/lib/monogram/check-input";
import { MONOGRAM_CONFIG } from "@/lib/monogram/config";
import { constructorStyles } from "@/lib/monogram/constructor-styles";
import { Gallery, ProductBuyBox, type BuyBoxPersonalisation } from "./ProductBuyBox";
import { MonogramPreview, type MonogramView } from "./MonogramPreview";
import { useLocale } from "@/components/i18n/LocaleProvider";
import { CATALOG } from "@/lib/i18n/dictionaries/catalog";
import { tr } from "@/lib/i18n/translate";

const DEFAULT_SHEET: [number, number] = [100, 100];

export function MonogramProductView({ p }: { p: CatalogProduct }) {
  const locale = useLocale();
  const t = tr(CATALOG, locale);
  const styles = useMemo(() => constructorStyles(p.monogram?.styles ?? []), [p.monogram]);
  const [styleId, setStyleId] = useState<MonogramStyleId | undefined>(styles[0]?.id);
  const style = styles.find((s) => s.id === styleId) ?? styles[0];
  const [raw, setRaw] = useState<MonogramInput>(() => ({ ...(styles[0]?.sample ?? { first: "", second: "", date: "" }) }));
  const [view, setView] = useState<MonogramView>("stencil");
  const [variant, setVariant] = useState<CatalogVariant | undefined>(undefined);
  const onVariantChange = useCallback((v: CatalogVariant | undefined) => setVariant(v), []);

  const fields = useMemo(() => style?.fields ?? [], [style]);
  const check = useMemo(() => checkMonogramInput(raw, fields), [raw, fields]);
  // The check writes its messages in Ukrainian; other languages show their translation.
  const error = (field: MonogramField) => {
    const text = check.errors[field];
    return text ? t.monogramErrors[text] ?? text : undefined;
  };
  // The preview shows the sample letters until the buyer types their own.
  const shown = useMemo<MonogramInput>(() => ({
    first: check.errors.first ? style?.sample.first ?? "" : check.value.first,
    second: check.errors.second ? style?.sample.second ?? "" : check.value.second,
    date: fields.includes("date") ? (check.errors.date ? style?.sample.date ?? "" : check.value.date) : "",
  }), [check, fields, style]);
  const sheet: [number, number] = variant?.sheetMm ?? DEFAULT_SHEET;

  if (!style) return null;

  const ready = Object.keys(check.errors).length === 0;
  const letters = `${check.value.first} & ${check.value.second}`;
  const personal: BuyBoxPersonalisation = {
    ready,
    summary: [letters, fields.includes("date") ? check.value.date : "", style.name[locale === "ru" ? "ru" : "uk"]].filter(Boolean).join(", "),
    spec: {
      monogram: {
        style: style.id,
        first: check.value.first,
        second: check.value.second,
        ...(fields.includes("date") ? { date: check.value.date } : {}),
        sheetMm: sheet,
      },
    },
    node: (
      <fieldset className="grid gap-3">
        {styles.length > 1 && (
          <div className="grid gap-2">
            <span className="text-sm font-semibold">{t.monogramStyle}</span>
            <div role="radiogroup" aria-label={t.monogramStyle} className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={s.id === style.id}
                  onClick={() => setStyleId(s.id)}
                  className={`min-h-11 rounded-full border-[1.5px] px-4 text-sm ${s.id === style.id ? "border-[2px] border-[var(--ink)] bg-[var(--surface)] font-semibold" : "border-[var(--line)] bg-[var(--card)]"}`}>
                  {s.name[locale === "ru" ? "ru" : "uk"]}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          {(["first", "second"] as const).map((key) => (
            <label key={key} className="grid min-w-0 content-start gap-1 text-sm text-[var(--muted)]">{t.monogramFields[key]}
              <input id={`mono-${key}`} value={raw[key]} maxLength={2} autoComplete="off" autoCapitalize="characters"
                onChange={(e) => setRaw((x) => ({ ...x, [key]: e.target.value }))}
                aria-invalid={!!check.errors[key]}
                className="h-12 w-full min-w-0 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-center text-xl font-semibold text-[var(--ink)] uppercase" />
              {error(key) && <span className="text-[13px] text-[var(--danger,#b91c1c)]">{error(key)}</span>}
            </label>
          ))}
        </div>
        {fields.includes("date") && (
          <label className="grid gap-1 text-sm text-[var(--muted)]">{t.monogramFields.date}
            <input id="mono-date" value={raw.date} maxLength={MONOGRAM_CONFIG.dateMaxLength} inputMode="numeric" autoComplete="off" placeholder="27.09.2026"
              onChange={(e) => setRaw((x) => ({ ...x, date: e.target.value }))}
              aria-invalid={!!check.errors.date}
              className="h-11 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3 text-base text-[var(--ink)]" />
            {error("date") && <span className="text-[13px] text-[var(--danger,#b91c1c)]">{error("date")}</span>}
          </label>
        )}
        <span className="text-[13px] text-[var(--muted)]">{t.monogramPreviewNote}</span>
      </fieldset>
    ),
  };

  return (
    <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
      <div className="grid gap-4">
        <div className="grid gap-2 lg:sticky lg:top-24">
          <div role="tablist" aria-label={t.monogramView} className="flex gap-2">
            {([["stencil", t.monogramStencil], ["cookie", t.monogramCookie]] as const).map(([id, name]) => (
              <button key={id} type="button" role="tab" aria-selected={view === id} onClick={() => setView(id)}
                className={`min-h-10 rounded-full border-[1.5px] px-4 text-sm ${view === id ? "border-[var(--ink)] bg-[var(--ink)] text-white" : "border-[var(--line)] bg-[var(--card)]"}`}>
                {name}
              </button>
            ))}
          </div>
          <MonogramPreview style={style} input={shown} sheetMm={sheet} view={view} />
        </div>
        {p.images.length > 0 && <Gallery images={p.images} title={p.title} />}
      </div>
      <ProductBuyBox p={p} personal={personal} onVariantChange={onVariantChange} />
    </div>
  );
}
