"use client";

// Branch / parcel locker of the chosen city. Points where the parcel does not fit
// (size or weight from lib/calculators/packaging.ts) are shown but cannot be picked.
// A parcel larger than a locker cell (40 × 60 × 30 см, knowledge base) gets no lockers at all:
// they are left out of the request to Nova Poshta (PLAN-RABOT шаг 8.2).
// Without a city from the list (or without the Nova Poshta key) it is a text input.

import { useLocale } from "@/components/i18n/LocaleProvider";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { tr } from "@/lib/i18n/translate";
import { useEffect, useMemo, useState } from "react";
import { getJson } from "@/lib/client/api-client";
import type { Parcel } from "@/types/packaging";
import type { NpWarehouse } from "@/types/integrations";

export function WarehouseField({ cityRef, value, warehouseRef, parcel, error, onChange }: {
  cityRef: string;
  value: string;
  warehouseRef: string;
  parcel: Parcel | null;
  error?: string;
  onChange: (label: string, ref: string) => void;
}) {
  const [list, setList] = useState<NpWarehouse[] | null>(null);
  const [filter, setFilter] = useState("");
  const t = tr(CHECKOUT, useLocale());
  const lockers = parcel ? parcel.fitsPostomat : true;
  const label = lockers ? t.branchOrLocker : t.branch;

  useEffect(() => {
    if (!cityRef) {
      setList(null);
      return;
    }
    const controller = new AbortController();
    const size = parcel ? `&l=${parcel.lengthMm}&w=${parcel.widthMm}&h=${parcel.heightMm}&kg=${parcel.billingKg}${parcel.fitsPostomat ? "" : "&lockers=0"}` : "";
    getJson<{ warehouses: NpWarehouse[] }>(`/api/novaposhta/warehouses?cityRef=${cityRef}${size}`, controller.signal)
      .then((result) => setList(result.ok ? result.data.warehouses.filter((w) => !parcel || parcel.fitsPostomat || w.category !== "postomat") : null))
      .catch(() => undefined);
    return () => controller.abort();
  }, [cityRef, parcel]);

  const shown = useMemo(() => {
    if (!list) return [];
    const q = filter.trim().toLowerCase();
    return (q ? list.filter((w) => w.number === q || w.label.toLowerCase().includes(q)) : list).slice(0, 60);
  }, [list, filter]);

  const inputClass = `h-12 rounded-xl border-[1.5px] bg-[var(--card)] px-3.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none ${error ? "border-[var(--danger)]" : "border-[var(--line)]"}`;

  if (!list) {
    return (
      <label className="grid gap-1 text-sm text-[var(--muted)]">{label}
        <input id="c-wh" value={value} placeholder={t.branchPlaceholder} onChange={(e) => onChange(e.target.value, "")} aria-invalid={!!error} className={inputClass} />
        {!lockers && <span className="text-[13px]">{t.tooBigTypeBranch}</span>}
        {error && <span className="text-[13px] text-[var(--danger)]">{error}</span>}
      </label>
    );
  }

  return (
    <div className="grid gap-1 text-sm text-[var(--muted)]">
      <label htmlFor="c-wh-filter">{label}</label>
      {!lockers && <span className="text-[13px]">{t.tooBigNoLockers}</span>}
      <input id="c-wh-filter" value={filter} placeholder={t.branchPlaceholder} onChange={(e) => setFilter(e.target.value)} className={inputClass} />
      <select id="c-wh" size={Math.min(6, Math.max(2, shown.length))} value={warehouseRef} aria-invalid={!!error}
        onChange={(e) => {
          const w = list.find((x) => x.ref === e.target.value);
          if (w) onChange(w.label, w.ref);
        }}
        className="rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-1 text-[15px] text-[var(--ink)]">
        {shown.map((w) => (
          <option key={w.ref} value={w.ref} disabled={w.fits === false}>
            {w.category === "postomat" ? t.locker : t.branch} №{w.number}: {w.shortAddress}{w.fits === false ? t.wontFit : ""}
          </option>
        ))}
      </select>
      {value && <span className="text-[13px] text-[var(--ink)]">{value}</span>}
      {error && <span className="text-[13px] text-[var(--danger)]">{error}</span>}
    </div>
  );
}
