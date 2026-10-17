"use client";

// City input with Nova Poshta suggestions. Without the Nova Poshta key the field stays a
// plain text input (the manager checks the address), so the checkout never breaks.

import { useLocale } from "@/components/i18n/LocaleProvider";
import { CHECKOUT } from "@/lib/i18n/dictionaries/checkout";
import { tr } from "@/lib/i18n/translate";
import { useEffect, useId, useRef, useState } from "react";
import { getJson, notConfigured } from "@/lib/client/api-client";
import type { NpCity } from "@/types/integrations";

export function CityField({ value, cityRef, error, onChange }: {
  value: string;
  cityRef: string;
  error?: string;
  onChange: (city: string, cityRef: string) => void;
}) {
  const t = tr(CHECKOUT, useLocale());
  const listId = useId();
  const [options, setOptions] = useState<NpCity[]>([]);
  const [open, setOpen] = useState(false);
  const [available, setAvailable] = useState(true);
  const pending = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!available || cityRef || value.trim().length < 2) {
      setOptions([]);
      return;
    }
    const timer = setTimeout(async () => {
      pending.current?.abort();
      const controller = new AbortController();
      pending.current = controller;
      try {
        const result = await getJson<{ cities: NpCity[] }>(`/api/novaposhta/cities?q=${encodeURIComponent(value.trim())}`, controller.signal);
        if (result.ok) {
          setOptions(result.data.cities);
          setOpen(true);
        } else if (notConfigured(result)) {
          setAvailable(false);
        }
      } catch {
        // Aborted by the next keystroke.
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [value, cityRef, available]);

  return (
    <label className="relative grid gap-1 text-sm text-[var(--muted)]">{t.city}
      <input id="c-city" value={value} autoComplete="address-level2" placeholder={t.cityPlaceholder}
        role="combobox" aria-expanded={open && options.length > 0} aria-controls={listId} aria-autocomplete="list"
        aria-invalid={!!error} aria-describedby={error ? "e-city" : undefined}
        onChange={(e) => onChange(e.target.value, "")}
        onFocus={() => options.length && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`h-12 rounded-xl border-[1.5px] bg-[var(--card)] px-3.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none ${error ? "border-[var(--danger)]" : "border-[var(--line)]"}`} />
      {open && options.length > 0 && (
        <ul id={listId} role="listbox" className="absolute top-full z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-[var(--line)] bg-[var(--card)] p-1 text-[15px] text-[var(--ink)] shadow-lg">
          {options.map((city) => (
            <li key={city.cityRef} role="option" aria-selected={city.cityRef === cityRef}>
              <button type="button" className="w-full rounded-lg px-3 py-2 text-left hover:bg-[var(--surface)]"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => { onChange(city.label, city.cityRef); setOpen(false); }}>
                {city.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <span id="e-city" className="text-[13px] text-[var(--danger)]">{error}</span>}
    </label>
  );
}
