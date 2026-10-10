// B2B invoice (рахунок-фактура) for ФОП and ТОВ buyers. The seller is ФОП 2nd group,
// not a VAT payer, so every invoice says "Без ПДВ". Money in UAH with kopecks
// (2 decimals) because an invoice is a legal document.

export type LegalForm = "company" | "fop";

/** Buyer requisites, filled from Opendatabot by ЄДРПОУ (8 digits) or РНОКПП (10 digits). */
export interface B2BCompany {
  form: LegalForm;
  /** ЄДРПОУ for companies, РНОКПП for ФОП. */
  code: string;
  name: string;
  shortName?: string;
  address?: string;
  director?: string;
  vatPayer?: boolean;
  /** IBAN for the buyer's own records, optional. */
  iban?: string;
  email?: string;
  phone?: string;
  /** "active" when the registry says the business is working. */
  registryStatus?: string;
}

/** Seller requisites (site settings). */
export interface InvoiceSeller {
  name: string;
  code: string;
  address: string;
  iban: string;
  bank: string;
  taxNote: string;
  phone: string;
  email: string;
}

export interface InvoiceLine {
  position: number;
  title: string;
  unit: string;
  quantity: number;
  price: number;
  amount: number;
}

export interface B2BInvoice {
  number: string;
  /** ISO date, Kyiv calendar. */
  date: string;
  /** Payment due date, ISO. */
  dueDate: string;
  orderNumber: string;
  seller: InvoiceSeller;
  buyer: B2BCompany;
  lines: InvoiceLine[];
  total: number;
  /** "Одна тисяча двісті вісімдесят п'ять гривень 00 копійок" */
  totalInWords: string;
  vatNote: string;
}

/** Order data an invoice is built from (Medusa order paid by invoice). */
export interface InvoiceOrderLine {
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface InvoiceOrder {
  number: string;
  createdAt: string;
  lines: InvoiceOrderLine[];
  company: B2BCompany;
}
