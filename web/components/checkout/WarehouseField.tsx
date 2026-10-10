"use client";

// Branch / parcel locker of the chosen city. Points where the parcel does not fit
// (size or weight from lib/calculators/packaging.ts) are shown but cannot be picked.
// Without a city from the list (or without the Nova Poshta key) it is a text input.

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

  useEffect(() => {
    if (!cityRef) {
      setList(null);
      return;
    }
    const controller = new AbortController();
    const size = parcel ? `&l=${parcel.lengthMm}&w=${parcel.widthMm}&h=${parcel.heightMm}&kg=${parcel.billingKg}` : "";
    getJson<{ warehouses: NpWarehouse[] }>(`/api/novaposhta/warehouses?cityRef=${cityRef}${size}`, controller.signal)
      .then((result) => setList(result.ok ? result.data.warehouses : null))
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
      <label className="grid gap-1 text-sm text-[var(--muted)]">Відділення або поштомат
        <input id="c-wh" value={value} placeholder="Номер або вулиця" onChange={(e) => onChange(e.target.value, "")} aria-invalid={!!error} className={inputClass} />
        {error && <span className="text-[13px] text-[var(--danger)]">{error}</span>}
      </label>
    );
  }

  return (
    <div className="grid gap-1 text-sm text-[var(--muted)]">
      <label htmlFor="c-wh-filter">Відділення або поштомат</label>
      <input id="c-wh-filter" value={filter} placeholder="Номер або вулиця" onChange={(e) => setFilter(e.target.value)} className={inputClass} />
      <select id="c-wh" size={Math.min(6, Math.max(2, shown.length))} value={warehouseRef} aria-invalid={!!error}
        onChange={(e) => {
          const w = list.find((x) => x.ref === e.target.value);
          if (w) onChange(w.label, w.ref);
        }}
        className="rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] p-1 text-[15px] text-[var(--ink)]">
        {shown.map((w) => (
          <option key={w.ref} value={w.ref} disabled={w.fits === false}>
            {w.category === "postomat" ? "Поштомат" : "Відділення"} №{w.number}: {w.shortAddress}{w.fits === false ? " (посилка не поміститься)" : ""}
          </option>
        ))}
      </select>
      {value && <span className="text-[13px] text-[var(--ink)]">{value}</span>}
      {error && <span className="text-[13px] text-[var(--danger)]">{error}</span>}
    </div>
  );
}
