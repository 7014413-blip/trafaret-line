// Notes and errors about a constructor design, shown above the price. Errors are red and block
// «В кошик»; warnings are grey.

import type { DesignCheckMessage } from "@/types/constructor-ui";

export function DesignChecks({ checks, errors = [] }: {
  checks: DesignCheckMessage[];
  /** Extra errors the constructor finds itself (empty design, missing glyphs). */
  errors?: string[];
}) {
  if (checks.length === 0 && errors.length === 0) return null;
  return (
    <ul className="m-0 grid list-none gap-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
      {errors.map((text) => <li key={text} className="text-[var(--danger)]">{text}</li>)}
      {checks.map((c, i) => <li key={i} className={c.level === "error" ? "text-[var(--danger)]" : "text-[var(--muted)]"}>{c.message.uk}</li>)}
    </ul>
  );
}
