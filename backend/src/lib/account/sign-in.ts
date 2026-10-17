// End of a Google or Telegram sign-in: the customer record and a session token for the
// storefront's HttpOnly cookie.

import type { AccountSignInResponse } from "../../shared/types/account";
import type { CustomerStore, LoginProfile } from "../../types/account";
import { makeAccountToken } from "../../shared/lib/account/account-token";
import { signInCustomer, toAccountCustomer } from "./account-customer";

export async function signIn(customers: CustomerStore, profile: LoginProfile, secret: string): Promise<AccountSignInResponse> {
  const customer = await signInCustomer(customers, profile);
  return { session: makeAccountToken("session", customer.id, secret), customer: toAccountCustomer(customer) };
}
