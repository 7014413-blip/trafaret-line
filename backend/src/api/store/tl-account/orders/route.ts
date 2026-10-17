// GET /store/tl-account/orders — «Мої замовлення» of the signed-in customer: the storefront
// sends the session token from its HttpOnly cookie in the "x-tl-account" header.

import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import { sessionCustomerId } from "../../../../lib/account/session-customer";
import { toAccountCustomer } from "../../../../lib/account/account-customer";
import { accountOrders } from "../../../../lib/account/account-orders";
import type { AccountOrdersResponse } from "../../../../shared/types/account";
import type { CustomerRecord, CustomerStore } from "../../../../types/account";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customerId = sessionCustomerId(req);
  if (!customerId) return res.status(401).json({ message: "Sign in first" });
  const customers = req.scope.resolve(Modules.CUSTOMER) as unknown as CustomerStore;
  const [customer]: CustomerRecord[] = await customers.listCustomers({ id: customerId, has_account: true });
  if (!customer) return res.status(401).json({ message: "Sign in first" });
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const body: AccountOrdersResponse = {
    customer: toAccountCustomer(customer),
    orders: await accountOrders(query as never, customers, customer),
  };
  res.setHeader("cache-control", "private, no-store");
  return res.json(body);
}
