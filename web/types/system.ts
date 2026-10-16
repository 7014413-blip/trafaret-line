// System-wide shapes: errors of the site's own API, the external services, and the test
// answers in data/knowledge_base/mock_*.json (real provider formats, made-up data).

import type {
  NpEnvelope, NpRawDeliveryDate, NpRawDocumentPrice, NpRawSettlementSearch, NpRawWarehouse, OdbRawCompany, OdbRawFop, VchasnoResponse,
} from "./integrations";

export type { ApiErrorBody, IntegrationName } from "./integrations";

/** data/knowledge_base/mock_novaposhta.json: one answer per API method, plus an error answer. */
export interface NovaPoshtaMocks {
  about: string;
  updated: string;
  searchSettlements: NpEnvelope<NpRawSettlementSearch>;
  getWarehouses: NpEnvelope<NpRawWarehouse>;
  getDocumentPrice: NpEnvelope<NpRawDocumentPrice>;
  getDocumentDeliveryDate: NpEnvelope<NpRawDeliveryDate>;
  error: NpEnvelope<never>;
}

/** data/knowledge_base/mock_vchasno.json: a receipt, a collision to retry, a stop. */
export interface VchasnoMocks {
  about: string;
  updated: string;
  saleOk: VchasnoResponse;
  collision: VchasnoResponse;
  stop: VchasnoResponse;
}

/** data/knowledge_base/mock_opendatabot.json: a company by ЄДРПОУ and a ФОП by РНОКПП. */
export interface OpendatabotMocks {
  about: string;
  updated: string;
  company: OdbRawCompany;
  fop: OdbRawFop;
}

/** Which program reads an environment variable. */
export type EnvScope = "web" | "backend" | "bot";

/** Login and password of a closed staging copy (STAGING_BASIC_AUTH="login:password"). */
export interface BasicAuthCredentials {
  user: string;
  password: string;
}
