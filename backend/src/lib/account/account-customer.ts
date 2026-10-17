// The Medusa customer of a person who signed in: the registered customer with this e-mail, or
// a new one. Guest customers that the checkout created for the same e-mail stay as they are;
// their orders join the cabinet through the e-mail (account-orders.ts, Google only).

import type { AccountCustomer, LoginProvider } from "../../shared/types/account";
import type { CustomerRecord, CustomerStore, LoginProfile } from "../../types/account";
import { isTelegramEmail } from "./telegram-profile";

export async function signInCustomer(customers: CustomerStore, profile: LoginProfile): Promise<CustomerRecord> {
  const [existing] = await customers.listCustomers({ email: profile.email, has_account: true });
  const metadata = {
    login: profile.provider,
    ...(profile.telegramId ? { telegramId: profile.telegramId, telegramUsername: profile.telegramUsername ?? null } : {}),
  };
  if (existing) {
    // Names the person changed in Google or Telegram follow; names typed in the admin stay.
    const update: Record<string, unknown> = { metadata: { ...(existing.metadata ?? {}), ...metadata } };
    if (!existing.first_name && profile.firstName) update.first_name = profile.firstName;
    if (!existing.last_name && profile.lastName) update.last_name = profile.lastName;
    return customers.updateCustomers(existing.id, update);
  }
  try {
    return await customers.createCustomers({
      email: profile.email, first_name: profile.firstName || null, last_name: profile.lastName || null, has_account: true, metadata,
    });
  } catch (error) {
    // Two sign-ins of one person at the same moment: the other one created the customer.
    const [created] = await customers.listCustomers({ email: profile.email, has_account: true });
    if (created) return created;
    throw error;
  }
}

/** The customer as the cabinet page shows it. */
export function toAccountCustomer(customer: CustomerRecord): AccountCustomer {
  const login = customer.metadata?.login;
  const provider: LoginProvider | null = login === "google" || login === "telegram" ? login : null;
  return {
    id: customer.id,
    firstName: customer.first_name ?? "",
    lastName: customer.last_name ?? "",
    email: isTelegramEmail(customer.email) ? null : customer.email,
    provider,
  };
}
