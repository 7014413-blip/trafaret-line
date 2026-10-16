// Customer sign-in on the server (lib/account): what Google and Telegram tell about the person.

import type { LoginProvider } from "../shared/types/account";

/** Fields of the Telegram login (oauth.telegram.org → #tgAuthResult), checked by its hash. */
export interface TelegramLogin {
  id: number;
  firstName: string;
  lastName: string;
  username: string | null;
  authDate: number;
}

/** A person who signed in, as the customer record needs it. */
export interface LoginProfile {
  provider: LoginProvider;
  /** Verified Google e-mail, or the cabinet address of a Telegram account (no real e-mail there). */
  email: string;
  firstName: string;
  lastName: string;
  telegramId?: number;
  telegramUsername?: string | null;
}

/** The parts of the Medusa customer module the cabinet uses. */
export interface CustomerStore {
  listCustomers(filters: Record<string, unknown>, config?: Record<string, unknown>): Promise<CustomerRecord[]>;
  createCustomers(data: Record<string, unknown>): Promise<CustomerRecord>;
  updateCustomers(id: string, data: Record<string, unknown>): Promise<CustomerRecord>;
}

export interface CustomerRecord {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  has_account: boolean;
  metadata?: Record<string, unknown> | null;
}

/** An order as query.graph returns it for the cabinet. */
export interface AccountOrderRecord {
  id: string;
  display_id: number;
  customer_id: string | null;
  status: string;
  created_at: string | Date;
  metadata?: Record<string, unknown> | null;
  fulfillments?: { shipped_at?: string | Date | null; canceled_at?: string | Date | null; labels?: { tracking_number?: string | null }[] | null }[] | null;
  items?: AccountOrderItemRecord[] | null;
}

export interface AccountOrderItemRecord {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
  thumbnail?: string | null;
  created_at?: string | Date;
  metadata?: Record<string, unknown> | null;
}
