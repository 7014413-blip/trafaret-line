"use client";
// Choice of 1–5 stars: five radio buttons drawn as stars, usable from the keyboard.

import { StarIcon } from "./StarIcon";

const WORDS = ["", "Погано", "Так собі", "Нормально", "Добре", "Чудово"];

export function StarInput({ value, onChange, error }: { value: number; onChange: (value: number) => void; error?: string }) {
  return (
    <fieldset className="m-0 grid gap-1.5 border-0 p-0" aria-describedby={error ? "rv-rating-error" : undefined}>
      <legend className="mb-1 font-semibold">Оцінка</legend>
      <div className="flex flex-wrap items-center gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2">
            <input type="radio" name="rv-rating" value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={`${n} з 5 — ${WORDS[n]}`} />
            <span className={n <= value ? "text-[var(--ink)]" : "text-[var(--muted)]"}><StarIcon fill={n <= value ? 1 : 0} size={30} /></span>
          </label>
        ))}
        {value > 0 && <span className="ml-2 text-[var(--muted)]">{WORDS[value]}</span>}
      </div>
      {error && <p id="rv-rating-error" className="m-0 text-sm text-[var(--danger)]">{error}</p>}
    </fieldset>
  );
}
