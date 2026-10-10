"use client";

// Buyer requisites for payment by invoice (ФОП / ТОВ). The code is checked locally
// (checksum), then the name and address are filled from Opendatabot. Without the
// Opendatabot key or when the registry is silent, the customer types them in.

import { useState } from "react";
import { getJson } from "@/lib/client/api-client";
import { codeKind, validTaxCode } from "@/lib/validation/tax-codes";
import type { B2BCompany } from "@/types/invoice";

export const EMPTY_COMPANY: B2BCompany = { form: "company", code: "", name: "" };

export function CompanyFields({ value, error, onChange }: { value: B2BCompany; error?: string; onChange: (next: B2BCompany) => void }) {
  const [status, setStatus] = useState<"idle" | "loading" | "found" | "manual">("idle");
  const [note, setNote] = useState("");

  const lookup = async () => {
    const code = value.code.replace(/\s/g, "");
    if (!validTaxCode(code)) {
      setNote("Код не проходить перевірку: ЄДРПОУ має 8 цифр, РНОКПП 10 цифр.");
      return;
    }
    setStatus("loading");
    setNote("");
    const result = await getJson<{ company: B2BCompany }>(`/api/opendatabot?code=${code}`);
    if (result.ok) {
      onChange({ ...result.data.company, email: value.email, iban: value.iban });
      setStatus("found");
      if (result.data.company.vatPayer) setNote("Ми не платники ПДВ: рахунок буде без ПДВ.");
      return;
    }
    setStatus("manual");
    setNote(result.error?.error === "not_found" ? "У реєстрі не знайшли, заповніть назву вручну." : "Заповніть назву і адресу вручну.");
  };

  const input = "h-12 rounded-xl border-[1.5px] border-[var(--line)] bg-[var(--card)] px-3.5 text-base text-[var(--ink)] focus:border-[var(--ink)] focus:outline-none";
  return (
    <fieldset className="m-0 grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4">
      <legend className="px-1.5 font-bold">Реквізити для рахунку</legend>
      <div className="grid grid-cols-[1fr_auto] items-end gap-2">
        <label className="grid gap-1 text-sm text-[var(--muted)]">ЄДРПОУ або РНОКПП
          <input id="c-code" inputMode="numeric" value={value.code} maxLength={10}
            onChange={(e) => {
              const code = e.target.value.replace(/\D/g, "");
              onChange({ ...value, code, form: codeKind(code) === "fop" ? "fop" : "company" });
            }}
            className={input} />
        </label>
        <button type="button" onClick={lookup} disabled={status === "loading"} className="h-12 rounded-full px-5 font-bold shadow-[inset_0_0_0_1.5px_var(--ink)] disabled:opacity-50">
          {status === "loading" ? "Шукаємо…" : "Заповнити"}
        </button>
      </div>
      <label className="grid gap-1 text-sm text-[var(--muted)]">Назва (ФОП або компанія)
        <input id="c-company" value={value.name} onChange={(e) => onChange({ ...value, name: e.target.value })} aria-invalid={!!error} className={input} />
      </label>
      <label className="grid gap-1 text-sm text-[var(--muted)]">Юридична адреса
        <input id="c-address" value={value.address ?? ""} onChange={(e) => onChange({ ...value, address: e.target.value })} className={input} />
      </label>
      <label className="grid gap-1 text-sm text-[var(--muted)]">Email для рахунку
        <input id="c-inv-email" type="email" value={value.email ?? ""} onChange={(e) => onChange({ ...value, email: e.target.value })} className={input} />
      </label>
      {(note || error) && <p className="m-0 text-[13px] text-[var(--danger)]">{error ?? note}</p>}
    </fieldset>
  );
}
