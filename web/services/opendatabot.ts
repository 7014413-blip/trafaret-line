// Opendatabot API v4 client (https://opendatabot.com/api/v4/, key in the apiKey query
// parameter). Needs OPENDATABOT_API_KEY. Used to fill B2B invoice requisites from
// ЄДРПОУ (8 digits, company) or РНОКПП (10 digits, ФОП). Answers are cached for a day
// because every call is paid.

import "server-only";
import type { B2BCompany } from "../types/invoice";
import type { OdbRawCompany, OdbRawFop } from "../types/integrations";
import { codeKind } from "../lib/validation/tax-codes";
import { requireEnv, UpstreamError } from "./config";
import { fetchJson } from "./http";

const BASE = "https://opendatabot.com/api/v4";
const CACHE_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: B2BCompany | null }>();

function addressText(address?: { zip?: string; address?: string }, fallback?: string): string | undefined {
  if (address?.address) return address.zip ? `${address.zip}, ${address.address}` : address.address;
  return fallback;
}

function isVatPayer(vat?: { code?: string; cancellationDate?: string }): boolean {
  return !!vat?.code && !vat.cancellationDate;
}

export function mapCompany(raw: OdbRawCompany): B2BCompany {
  const usr = raw.USR ?? {};
  const director = usr.ceoName ?? usr.heads?.find((h) => h.name)?.name;
  return {
    form: "company",
    code: raw.code,
    name: usr.fullName ?? raw.companyName ?? raw.code,
    shortName: usr.shortName ?? raw.companyName,
    address: addressText(usr.address, usr.location),
    director,
    vatPayer: isVatPayer(raw.vat),
    registryStatus: usr.status,
  };
}

export function mapFop(raw: OdbRawFop): B2BCompany {
  const usr = raw.USR ?? {};
  const fullName = usr.fullName ?? raw.fullName ?? raw.code;
  return {
    form: "fop",
    code: raw.code,
    name: `ФОП ${fullName}`,
    shortName: fullName,
    address: addressText(usr.address, usr.location),
    director: fullName,
    vatPayer: isVatPayer(raw.vat),
    email: usr.email,
    phone: usr.phones?.[0],
    registryStatus: usr.status,
  };
}

/** Requisites by code; null when the registry has no such business. */
export async function lookupBusiness(code: string): Promise<B2BCompany | null> {
  const kind = codeKind(code);
  if (!kind) throw new UpstreamError("opendatabot", "Code must be 8 (ЄДРПОУ) or 10 (РНОКПП) digits", 400);
  const cached = cache.get(code);
  if (cached && Date.now() - cached.at < CACHE_MS) return cached.value;

  const { OPENDATABOT_API_KEY } = requireEnv("opendatabot", ["OPENDATABOT_API_KEY"]);
  const url = `${BASE}/${kind}/${code}?apiKey=${encodeURIComponent(OPENDATABOT_API_KEY)}`;
  const { status, data } = await fetchJson<OdbRawCompany & OdbRawFop & { message?: string }>("opendatabot", url, { timeoutMs: 15_000 });
  if (status === 404) {
    cache.set(code, { at: Date.now(), value: null });
    return null;
  }
  if (status === 401 || status === 403) throw new UpstreamError("opendatabot", "Opendatabot: API key rejected", status);
  if (status !== 200) throw new UpstreamError("opendatabot", `Opendatabot: ${data?.message ?? `HTTP ${status}`}`, status);
  const value = kind === "company" ? mapCompany(data) : mapFop(data);
  cache.set(code, { at: Date.now(), value });
  return value;
}
